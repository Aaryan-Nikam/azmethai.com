/**
 * Websurfer Subagent
 *
 * The Websurfer has TWO operating modes:
 *
 * MODE 1 — "fetch" (default, fast, cheap)
 *   Uses HTTP fetch + linkedom parsing. Good for public pages.
 *   Cost: ~$0.001 per page (one cheap LLM call for extraction).
 *
 * MODE 2 — "browser" (stealth, interactive)
 *   Uses Playwright with anti-detection (stealth patches, proxy rotation,
 *   human behavior simulation). Used for:
 *     - JS-rendered pages that fetch can't read
 *     - Login-required platforms (sign in, navigate, extract)
 *     - Interactive workflows (click, type, submit forms)
 *     - Fallback when API calls fail and you need to act like a human
 *   Cost: ~$0.002 per page (LLM extraction + browser overhead).
 *
 * Expert agents specify the mode via params.mode ("fetch" | "browser").
 * If not specified, defaults to "fetch" (cheapest option).
 */

import { parseHTML } from "linkedom";
import type { Subagent, SubagentInput, SubagentResult } from "../types.js";
import { StealthBrowser, type StealthBrowserConfig } from "./stealth-browser.js";
import { ProxyManager, type ProxyManagerConfig } from "./proxy-manager.js";

// ─── Types ───────────────────────────────────────────────────────────

export interface WebsurferData {
    /** The URL that was actually fetched (follows redirects). */
    url: string;
    /** Page title if found. */
    title: string;
    /** Clean text content of the page (HTML stripped). */
    textContent: string;
    /** Structured extraction based on the goal (filled by LLM). */
    extraction: Record<string, unknown> | null;
    /** HTTP status code (0 if browser mode). */
    statusCode: number;
    /** Which mode was used. */
    mode: "fetch" | "browser";
    /** Screenshot as base64 (browser mode only, on failure). */
    screenshot?: string;
}

export interface WebsurferConfig {
    /** Browser launch mode. "standalone" for dev, "sandbox" for production. Default: "standalone". */
    browserLaunchMode?: "standalone" | "sandbox";
    /** CDP URL for sandbox mode (Docker container endpoint). */
    cdpUrl?: string;
    /** Proxy manager config for browser mode (optional). */
    proxyConfig?: ProxyManagerConfig;
    /** Path to persist browser cookies/sessions. */
    storagePath?: string;
    /** Path to Chromium executable (optional, standalone only). */
    executablePath?: string;
    /** Whether to run browser in headless mode (default: true). */
    headless?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 15_000;

const UNWANTED_TAGS = new Set([
    "script", "style", "noscript", "iframe", "svg", "path",
    "link", "meta", "head",
]);

/**
 * Fetch a URL and return the raw HTML string.
 * Uses standard fetch with a timeout via AbortSignal.
 */
async function fetchPage(url: string, timeoutMs: number): Promise<{ html: string; status: number; finalUrl: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
            redirect: "follow",
        });

        const html = await response.text();
        return {
            html,
            status: response.status,
            finalUrl: response.url || url,
        };
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Parse HTML into clean, readable text.
 * Strips scripts, styles, nav, and other non-content elements.
 * Returns the page title and cleaned body text.
 */
export function parseHtmlToText(html: string): { title: string; text: string } {
    const { document } = parseHTML(html);

    // Extract title
    const titleEl = document.querySelector("title");
    const title = titleEl?.textContent?.trim() || "";

    // Remove unwanted elements
    for (const tag of UNWANTED_TAGS) {
        const elements = document.querySelectorAll(tag);
        for (const el of elements) {
            el.remove();
        }
    }

    // Also remove nav, footer, aside (typically non-content)
    for (const selector of ["nav", "footer", "aside", "[role='navigation']", "[role='banner']"]) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
            el.remove();
        }
    }

    // Get text content from body
    const body = document.querySelector("body");
    const rawText = body?.textContent || document.documentElement?.textContent || "";

    // Clean up whitespace: collapse multiple newlines and spaces
    const text = rawText
        .replace(/[ \t]+/g, " ")        // collapse horizontal whitespace
        .replace(/\n\s*\n/g, "\n\n")    // collapse multiple blank lines to one
        .replace(/^\s+|\s+$/gm, "")     // trim each line
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .join("\n")
        .slice(0, 15_000);              // cap at 15k chars to keep LLM costs low

    return { title, text };
}

/**
 * Build the extraction prompt for the LLM.
 * This tells the LLM what to extract from the page text.
 */
export function buildExtractionPrompt(goal: string, pageText: string, pageUrl: string): string {
    return `You are a data extraction assistant. Extract structured information from the following webpage text.

EXTRACTION GOAL: ${goal}

SOURCE URL: ${pageUrl}

PAGE CONTENT:
---
${pageText}
---

INSTRUCTIONS:
1. Extract ONLY information that is explicitly stated in the page content above.
2. Do NOT invent, assume, or hallucinate any data.
3. If a piece of information is not found, set its value to null.
4. Return your answer as a valid JSON object.
5. Keep field names short and descriptive (camelCase).

Respond with ONLY the JSON object, no markdown formatting, no explanation.`;
}

// ─── LLM Extraction (Pluggable) ─────────────────────────────────────

/**
 * Function type for the LLM extraction step.
 * This is injected so we can:
 *   - Mock it in tests (zero cost)
 *   - Swap the model later (Haiku → local LLM)
 */
export type ExtractionFn = (prompt: string) => Promise<string>;

/**
 * Default extraction function — placeholder that returns null.
 * In production, this gets replaced with an actual LLM call.
 */
const defaultExtractionFn: ExtractionFn = async () => {
    return JSON.stringify({ note: "LLM extraction not configured. Raw text returned." });
};

/**
 * Parse the LLM's extraction response into a JSON object.
 * Handles cases where the LLM wraps it in markdown code blocks.
 */
function parseExtractionResponse(raw: string): Record<string, unknown> | null {
    let cleaned = raw.trim();

    // Strip markdown code block wrappers if present
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    try {
        return JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
        return null;
    }
}

// ─── Fetch Mode (Mode 1) ──────────────────────────────────────────

async function executeFetchMode(
    input: SubagentInput,
    extract: ExtractionFn,
): Promise<SubagentResult<WebsurferData>> {
    const start = Date.now();
    const url = input.params?.url as string;

    try {
        const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        const { html, status, finalUrl } = await fetchPage(url, timeoutMs);

        if (status >= 400) {
            return {
                success: false,
                data: { url: finalUrl, title: "", textContent: "", extraction: null, statusCode: status, mode: "fetch" },
                sources: [finalUrl],
                error: `HTTP ${status} error fetching ${finalUrl}`,
                durationMs: Date.now() - start,
            };
        }

        const { title, text } = parseHtmlToText(html);

        let extraction: Record<string, unknown> | null = null;
        let costEstimate = 0;
        if (input.goal && text.length > 0) {
            const prompt = buildExtractionPrompt(input.goal, text, finalUrl);
            const rawResponse = await extract(prompt);
            extraction = parseExtractionResponse(rawResponse);
            costEstimate = 0.001;
        }

        return {
            success: true,
            data: { url: finalUrl, title, textContent: text, extraction, statusCode: status, mode: "fetch" },
            sources: [finalUrl],
            costEstimate,
            durationMs: Date.now() - start,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            success: false,
            data: { url, title: "", textContent: "", extraction: null, statusCode: 0, mode: "fetch" },
            sources: [url],
            error: `Websurfer (fetch) failed: ${message}`,
            durationMs: Date.now() - start,
        };
    }
}

// ─── Browser Mode (Mode 2) ─────────────────────────────────────────

async function executeBrowserMode(
    input: SubagentInput,
    extract: ExtractionFn,
    browserConfig?: WebsurferConfig,
): Promise<SubagentResult<WebsurferData>> {
    const start = Date.now();
    const url = input.params?.url as string;
    const actions = input.params?.actions as Array<{ action: string; selector?: string; value?: string }> | undefined;

    const proxyManager = browserConfig?.proxyConfig
        ? new ProxyManager(browserConfig.proxyConfig)
        : ProxyManager.fromEnv() ?? undefined;

    const browser = new StealthBrowser({
        mode: browserConfig?.browserLaunchMode ?? "standalone",
        cdpUrl: browserConfig?.cdpUrl,
        proxyManager,
        storagePath: browserConfig?.storagePath,
        executablePath: browserConfig?.executablePath,
        headless: browserConfig?.headless ?? true,
    });

    try {
        // Step 1: Launch stealth browser
        await browser.launch();

        // Step 2: Navigate to URL
        const navResult = await browser.navigate(url);
        if (!navResult.success) {
            return {
                success: false,
                data: {
                    url: navResult.url, title: navResult.title, textContent: "",
                    extraction: null, statusCode: 0, mode: "browser",
                    screenshot: navResult.screenshot,
                },
                sources: [navResult.url],
                error: navResult.error ?? "Navigation failed",
                durationMs: Date.now() - start,
            };
        }

        // Step 3: Execute interactive actions (if provided)
        if (actions && actions.length > 0) {
            for (const step of actions) {
                switch (step.action) {
                    case "click":
                        if (step.selector) await browser.click(step.selector);
                        break;
                    case "type":
                        if (step.selector && step.value) await browser.type(step.selector, step.value);
                        break;
                    case "scroll":
                        await browser.scroll();
                        break;
                    case "wait":
                        if (step.selector) await browser.waitFor(step.selector, input.timeoutMs);
                        break;
                }
            }
        }

        // Step 4: Extract page content
        const pageText = await browser.getPageText();
        const title = await browser.getPage()?.title() ?? "";
        const currentUrl = browser.getPage()?.url() ?? url;

        // Cap text for LLM
        const text = pageText.slice(0, 15_000);

        // Step 5: LLM extraction
        let extraction: Record<string, unknown> | null = null;
        let costEstimate = 0.001; // Base cost for browser overhead
        if (input.goal && text.length > 0) {
            const prompt = buildExtractionPrompt(input.goal, text, currentUrl);
            const rawResponse = await extract(prompt);
            extraction = parseExtractionResponse(rawResponse);
            costEstimate = 0.002; // Browser + LLM
        }

        return {
            success: true,
            data: { url: currentUrl, title, textContent: text, extraction, statusCode: 200, mode: "browser" },
            sources: [currentUrl],
            costEstimate,
            durationMs: Date.now() - start,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        // Try to capture a screenshot for debugging
        let screenshot: string | undefined;
        try {
            const buf = await browser.screenshot();
            screenshot = buf?.toString("base64");
        } catch { /* ignore */ }

        return {
            success: false,
            data: { url, title: "", textContent: "", extraction: null, statusCode: 0, mode: "browser", screenshot },
            sources: [url],
            error: `Websurfer (browser) failed: ${message}`,
            durationMs: Date.now() - start,
        };
    } finally {
        await browser.close();
    }
}

// ─── Websurfer Subagent Factory ─────────────────────────────────────

export function createWebsurfer(extractionFn?: ExtractionFn, browserConfig?: WebsurferConfig): Subagent {
    const extract = extractionFn ?? defaultExtractionFn;

    return {
        name: "websurfer",
        description:
            "Navigates to any URL and extracts structured data. Two modes: " +
            "'fetch' (fast, cheap, public pages) and 'browser' (stealth Playwright with " +
            "anti-detection, proxies, human behavior — for login-required platforms, " +
            "JS-rendered pages, and interactive workflows).",
        usesLLM: true,

        async execute(input: SubagentInput): Promise<SubagentResult<WebsurferData>> {
            const url = input.params?.url as string | undefined;
            const mode = (input.params?.mode as string) ?? "fetch";

            // Validate input
            if (!url) {
                return {
                    success: false,
                    data: { url: "", title: "", textContent: "", extraction: null, statusCode: 0, mode: mode as "fetch" | "browser" },
                    sources: [],
                    error: "Missing required param: url",
                    durationMs: 0,
                };
            }

            // Route to the appropriate mode
            if (mode === "browser") {
                return executeBrowserMode(input, extract, browserConfig);
            }
            return executeFetchMode(input, extract);
        },
    };
}
