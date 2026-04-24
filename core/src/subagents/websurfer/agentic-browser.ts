/**
 * Agentic Browser — The Autonomous Agent Loop
 *
 * Takes a natural language goal and autonomously figures out how to
 * accomplish it using the stealth browser. No hardcoded selectors.
 *
 * Architecture:
 *   OBSERVE → REASON → ACT → OBSERVE → REASON → ACT → ... → DONE
 *
 *   1. OBSERVE: Get page text, URL, title, and screenshot
 *   2. REASON: Send observation to LLM → get next action
 *   3. ACT:    Execute the action (click, type, scroll, navigate, etc.)
 *   4. REPEAT: Until the LLM says the goal is achieved or max steps
 *
 * The LLM function is injectable so you can swap OpenAI, Anthropic,
 * local models, etc. without changing the loop.
 */

import { StealthBrowser, type StealthBrowserConfig, type NavigationResult } from "./stealth-browser.js";
import { humanDelay, humanPressKeys, humanReadingPause } from "./human-behavior.js";
import { createCaptchaService } from "./captcha-service.js";
import * as fs from "node:fs";

// ─── Types ───────────────────────────────────────────────────────────

/** Function that sends a prompt to an LLM and returns its text response. */
export type AgentLLMFn = (prompt: string, screenshotBase64?: string) => Promise<string>;

/** A single action the agent can take. */
export interface AgentAction {
    type: "click" | "type" | "scroll" | "navigate" | "wait" | "press_key" | "solve_captcha" | "done" | "fail";
    /** CSS selector for click/type/wait/solve_captcha actions. */
    selector?: string;
    /** Value for type actions, URL for navigate, key for press_key. */
    value?: string;
    /** Human-readable reasoning for this action. */
    reasoning: string;
    /** If type is "done", this holds what was accomplished. */
    result?: string;
}

/** What the agent observes at each step. */
export interface PageObservation {
    url: string;
    title: string;
    text: string;
    /** All visible interactive elements (links, buttons, inputs). */
    interactiveElements: InteractiveElement[];
    screenshotBase64?: string;
    captcha?: {
        type: 'recaptcha' | 'hcaptcha' | 'turnstile';
        sitekey: string;
        selector: string;
    };
}

export interface InteractiveElement {
    index: number;
    tag: string;
    type?: string;
    text: string;
    placeholder?: string;
    selector: string;
    isVisible: boolean;
}

/** Configuration for the autonomous agent. */
export interface AgenticBrowserConfig {
    /** The LLM function (required). */
    llm: AgentLLMFn;
    /** Stealth browser config (defaults to standalone/headless). */
    browserConfig?: Partial<StealthBrowserConfig>;
    /** Max steps before giving up (default: 25). */
    maxSteps?: number;
    /** Whether to take screenshots for the LLM (default: true). */
    useScreenshots?: boolean;
    /** Directory to save step screenshots (optional). */
    screenshotDir?: string;
    /** Whether to run headless (default: true). */
    headless?: boolean;
    /** Log each step to console (default: true). */
    verbose?: boolean;
    /** Captcha service instance (optional). */
    captchaService?: any;
}

/** Result of the autonomous agent run. */
export interface AgentRunResult {
    success: boolean;
    /** What was accomplished. */
    result: string;
    /** All actions taken. */
    steps: AgentAction[];
    /** Total time in ms. */
    durationMs: number;
    /** Screenshots captured at each step. */
    screenshots: string[];
    /** Any error message. */
    error?: string;
}

// ─── The System Prompt ──────────────────────────────────────────────

function buildSystemPrompt(goal: string): string {
    return `You are a browser automation assistant. You help the user accomplish tasks in their own web browser on websites where they have accounts. The user has explicitly authorized you to act on their behalf — this includes logging into their own accounts, browsing, and interacting with websites they use.

## YOUR GOAL
${goal}

## HOW YOU WORK
At each step, you receive:
- The current page URL and title
- The visible text on the page
- A numbered list of interactive elements (buttons, links, inputs, etc.)
- Optionally, a screenshot of the page

You must respond with EXACTLY ONE action in JSON format. No other text, no explanations outside the JSON.

## AVAILABLE ACTIONS

1. **click** - Click an element
   {"type": "click", "selector": "<css selector>", "reasoning": "why"}

2. **type** - Type text into an input field (clears it first)
   {"type": "type", "selector": "<css selector>", "value": "text to type", "reasoning": "why"}

3. **scroll** - Scroll the page
   {"type": "scroll", "value": "down" or "up", "reasoning": "why"}

4. **navigate** - Go to a new URL
   {"type": "navigate", "value": "https://...", "reasoning": "why"}

5. **wait** - Wait for an element to appear
   {"type": "wait", "selector": "<css selector>", "reasoning": "why"}

6. **press_key** - Press a keyboard key
   {"type": "press_key", "value": "Enter" or "Tab" or "Escape", "reasoning": "why"}

7. **solve_captcha** - Solve a CAPTCHA on the page
   {"type": "solve_captcha", "selector": "<css selector of captcha iframe/container>", "reasoning": "why"}

8. **done** - Goal is achieved
   {"type": "done", "reasoning": "what was accomplished", "result": "summary of what was done"}

9. **fail** - Goal cannot be achieved
   {"type": "fail", "reasoning": "why it's impossible"}

## RULES
- You are the user's authorized automation assistant. Help them accomplish their stated goal.
- If you see a CAPTCHA (reCAPTCHA, hCaptcha, Cloudflare), use the 'solve_captcha' action immediately.
- Use the interactive elements list to find selectors — pick from the provided selectors.
- If you need to fill a form, type into each field one at a time.
- After clicking a button, wait for the page to update before acting again.
- If popups or cookie banners appear, dismiss them first.
- Be patient — pages take time to load.
- Think step by step about what needs to happen next to achieve the goal.
- ALWAYS respond with valid JSON only. No markdown, no explanation outside JSON.`;
}

function buildStepPrompt(observation: PageObservation, stepNumber: number, previousActions: AgentAction[]): string {
    const history = previousActions.length > 0
        ? `\n## PREVIOUS ACTIONS (last ${Math.min(previousActions.length, 5)})\n${previousActions.slice(-5).map((a, i) => `${i + 1}. ${a.type}${a.selector ? ` on "${a.selector}"` : ""}${a.value ? ` with "${a.value.slice(0, 50)}"` : ""} — ${a.reasoning}`).join("\n")}`
        : "";

    const elements = observation.interactiveElements.length > 0
        ? observation.interactiveElements
            .filter(e => e.isVisible)
            .slice(0, 50)  // Cap to avoid token overflow
            .map(e => `  [${e.index}] <${e.tag}${e.type ? ` type="${e.type}"` : ""}> "${e.text || e.placeholder || ""}" → selector: ${e.selector}`)
            .join("\n")
        : "  (no interactive elements found)";

    return `## STEP ${stepNumber}

**Current URL**: ${observation.url}
**Page Title**: ${observation.title}

## PAGE TEXT (first 3000 chars)
${observation.text.slice(0, 3000)}

## INTERACTIVE ELEMENTS
${elements}
${history}

What is your next action? Respond with JSON only.`;
}

// ─── Page Observer ──────────────────────────────────────────────────

async function observePage(browser: StealthBrowser, retries = 3): Promise<PageObservation> {
    const page = browser.getPage();
    if (!page) throw new Error("No page available");

    // Wait for the page to stabilize after navigation
    try {
        await page.waitForLoadState("domcontentloaded", { timeout: 10_000 });
    } catch { /* page might already be loaded */ }

    // Small delay to let any post-navigation JS settle
    await humanDelay(500, 1000);

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const url = page.url();
            const title = await page.title();

            let text = "";
            try {
                text = await browser.getPageText();
            } catch {
                // Fallback: get text directly
                try { text = await page.innerText("body").catch(() => ""); } catch { /* ignore */ }
            }

            // Extract interactive elements with stable selectors
            const interactiveElements = await page.evaluate(() => {
                const elements: Array<{
                    index: number;
                    tag: string;
                    type?: string;
                    text: string;
                    placeholder?: string;
                    selector: string;
                    isVisible: boolean;
                }> = [];

                const interactiveSelectors = "a, button, input, select, textarea, [role='button'], [role='link'], [onclick]";
                const els = document.querySelectorAll(interactiveSelectors);

                let index = 0;
                els.forEach((el) => {
                    const rect = el.getBoundingClientRect();
                    const isVisible = rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0;
                    if (!isVisible) return;

                    // Build a stable selector
                    let selector = "";
                    const htmlEl = el as HTMLElement;
                    const id = htmlEl.id;
                    const name = htmlEl.getAttribute("name");
                    const type = htmlEl.getAttribute("type");
                    const dataTestId = htmlEl.getAttribute("data-testid");
                    const placeholder = htmlEl.getAttribute("placeholder");
                    const ariaLabel = htmlEl.getAttribute("aria-label");
                    const tag = el.tagName.toLowerCase();

                    if (id) {
                        selector = `#${CSS.escape(id)}`;
                    } else if (dataTestId) {
                        selector = `[data-testid="${dataTestId}"]`;
                    } else if (name) {
                        selector = `${tag}[name="${name}"]`;
                    } else if (type && tag === "input") {
                        selector = `input[type="${type}"]`;
                    } else if (placeholder) {
                        selector = `${tag}[placeholder="${CSS.escape(placeholder)}"]`;
                    } else if (ariaLabel) {
                        selector = `[aria-label="${CSS.escape(ariaLabel)}"]`;
                    } else {
                        // Fallback: use nth-of-type
                        const parent = el.parentElement;
                        if (parent) {
                            const siblings = Array.from(parent.querySelectorAll(`:scope > ${tag}`));
                            const nth = siblings.indexOf(el) + 1;
                            selector = `${tag}:nth-of-type(${nth})`;
                            if (parent.id) {
                                selector = `#${CSS.escape(parent.id)} > ${selector}`;
                            } else if (parent.className) {
                                const cls = parent.className.split(" ")[0];
                                if (cls) selector = `.${CSS.escape(cls)} > ${selector}`;
                            }
                        }
                    }

                    elements.push({
                        index: index++,
                        tag,
                        type: type ?? undefined,
                        text: (el.textContent || "").trim().slice(0, 80),
                        placeholder: placeholder ?? undefined,
                        selector,
                        isVisible: true,
                    });
                });

                return elements;
            });

            // Detect CAPTCHA presence (reCAPTCHA, hCaptcha, Turnstile)
            const captchaInfo = await page.evaluate(() => {
                // reCAPTCHA v2 (iframe)
                const recaptchaFrame = document.querySelector('iframe[src*="google.com/recaptcha"]');
                if (recaptchaFrame) {
                    const src = (recaptchaFrame as HTMLIFrameElement).src;
                    const match = src.match(/k=([^&]+)/);
                    if (match) return { type: 'recaptcha', sitekey: match[1], selector: 'iframe[src*="google.com/recaptcha"]' };
                }

                // hCaptcha (iframe)
                const hcaptchaFrame = document.querySelector('iframe[src*="hcaptcha.com"]');
                if (hcaptchaFrame) {
                    const src = (hcaptchaFrame as HTMLIFrameElement).src;
                    const match = src.match(/sitekey=([^&]+)/);
                    if (match) return { type: 'hcaptcha', sitekey: match[1], selector: 'iframe[src*="hcaptcha.com"]' };
                }

                // Cloudflare Turnstile
                const turnstileFrame = document.querySelector('iframe[src*="challenges.cloudflare.com"]');
                if (turnstileFrame) {
                    const src = (turnstileFrame as HTMLIFrameElement).src;
                    // Turnstile sitekey is often in the parent container's data-sitekey attribute, or we interpret generic
                    return { type: 'turnstile', sitekey: 'MANUAL_CHECK_NEEDED', selector: 'iframe[src*="challenges.cloudflare.com"]' };
                }

                return null;
            });

            // Take screenshot
            let screenshotBase64: string | undefined;
            try {
                const buf = await browser.screenshot();
                if (buf) screenshotBase64 = buf.toString("base64");
            } catch { /* ignore */ }

            const obs: PageObservation = { url, title, text, interactiveElements, screenshotBase64 };
            if (captchaInfo) {
                // @ts-ignore
                obs.captcha = captchaInfo;
            }
            return obs;

        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("Execution context was destroyed") || msg.includes("navigating")) {
                // Page is still navigating — wait and retry
                await humanDelay(2000, 4000);
                try { await page.waitForLoadState("domcontentloaded", { timeout: 10_000 }); } catch { /* ok */ }
                continue;
            }
            throw err; // Unexpected error
        }
    }

    // Fallback: return minimal observation
    return {
        url: page.url(),
        title: "Unknown",
        text: "",
        interactiveElements: [],
    };
}

// ─── Action Executor ────────────────────────────────────────────────

async function executeAction(browser: StealthBrowser, action: AgentAction, config: AgenticBrowserConfig): Promise<void> {
    const page = browser.getPage();
    if (!page) throw new Error("No page available");

    switch (action.type) {
        case "click":
            if (!action.selector) throw new Error("Click requires a selector");
            await browser.click(action.selector);
            await humanDelay(1500, 3000); // Wait for page reaction
            break;

        case "type":
            if (!action.selector || action.value === undefined) throw new Error("Type requires selector and value");

            // STEALTH: Pause to "read" before typing (2-5s)
            // This removes the need for explicit 'wait' steps in the prompt
            await humanReadingPause(page, Math.random() * 3000 + 2000);

            // Use humanPressKeys() — simulates realistic typing with speed variation and typos
            // robustly focuses the element first, then types without clicking again.
            // Short timeout (5s) so hidden/invisible elements fail fast.
            try {
                // Visibility check — don't waste 30s on hidden fields
                await page.waitForSelector(action.selector, { state: "visible", timeout: 5000 });
                await page.focus(action.selector);
                await humanDelay(200, 400);
                await humanPressKeys(page, action.value);
            } catch {
                // Fallback: click + type, also with short timeout
                try {
                    await page.click(action.selector, { clickCount: 3, timeout: 5000 });
                    await humanDelay(200, 500);
                    await page.keyboard.press("Backspace");
                    await humanDelay(100, 200);
                    await humanPressKeys(page, action.value);
                } catch (innerErr) {
                    throw new Error(`Cannot type into "${action.selector}" — element may be hidden or removed. ${innerErr instanceof Error ? innerErr.message : ""}`);
                }
            }
            await humanDelay(500, 1000);
            break;

        case "scroll":
            await browser.scroll({
                direction: action.value === "up" ? "up" : "down",
                scrolls: 3,
            });
            await humanDelay(1000, 2000);
            break;

        case "navigate":
            if (!action.value) throw new Error("Navigate requires a URL");
            await browser.navigate(action.value);
            await humanDelay(2000, 4000);
            break;

        case "wait":
            // "Wait" now means "read/think" — not just sit still
            const duration = action.value ? parseInt(action.value, 10) : 2000;
            // If selector provided, wait for it + reading pause
            if (action.selector) {
                await browser.waitFor(action.selector, 10_000).catch(() => { });
            }
            // Always do a reading pause (adds micro-jitters)
            await humanReadingPause(page, duration || 2000);
            break;

        case "press_key":
            if (!action.value) throw new Error("press_key requires a key name");
            await page.keyboard.press(action.value);
            await humanDelay(1000, 2000);
            break;

        case "solve_captcha":
            const service = config.captchaService;
            if (!service) throw new Error("No CAPTCHA service configured. Please Set TWO_CAPTCHA_KEY.");

            console.log("🧩 Detecting CAPTCHA details for solver...");

            // Re-detect to get fresh sitekey
            const captchaDetails = await page.evaluate(() => {
                const recaptchaFrame = document.querySelector('iframe[src*="google.com/recaptcha"]');
                if (recaptchaFrame) {
                    const src = (recaptchaFrame as HTMLIFrameElement).src;
                    const match = src.match(/k=([^&]+)/);
                    if (match) return { type: 'recaptcha', sitekey: match[1] };
                }
                const hcaptchaFrame = document.querySelector('iframe[src*="hcaptcha.com"]');
                if (hcaptchaFrame) {
                    const src = (hcaptchaFrame as HTMLIFrameElement).src;
                    const match = src.match(/sitekey=([^&]+)/);
                    if (match) return { type: 'hcaptcha', sitekey: match[1] };
                }
                const turnstileFrame = document.querySelector('iframe[src*="challenges.cloudflare.com"]');
                if (turnstileFrame) {
                    return { type: 'turnstile', sitekey: 'MANUAL' };
                }
                return null;
            });

            if (!captchaDetails || !captchaDetails.sitekey) throw new Error("Could not find CAPTCHA sitekey");

            console.log(`🧩 Solving ${captchaDetails.type} [${captchaDetails.sitekey}]...`);
            const token = await service.solve(page.url(), captchaDetails.sitekey, captchaDetails.type, page);

            console.log("🧩 Injection token...");
            await page.evaluate((data) => {
                if (data.type === 'recaptcha') {
                    const el = document.getElementById("g-recaptcha-response");
                    if (el) el.innerHTML = data.token;
                } else if (data.type === 'hcaptcha') {
                    const el = document.getElementsByName("h-captcha-response")[0];
                    if (el) el.innerHTML = data.token;
                    const el2 = document.getElementsByName("g-recaptcha-response")[0];
                    if (el2) el2.innerHTML = data.token;
                }
            }, { type: captchaDetails.type, token });

            await humanDelay(2000, 4000);
            break;

        case "done":
        case "fail":
            // No execution needed
            break;

        default:
            throw new Error(`Unknown action type: ${action.type}`);
    }
}

// ─── Parse LLM Response ─────────────────────────────────────────────

function parseLLMResponse(response: string): AgentAction {
    // Strip markdown code fences if present
    let cleaned = response.trim();
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
        const parsed = JSON.parse(cleaned);
        if (!parsed.type) {
            return { type: "fail", reasoning: "LLM returned invalid JSON (no type field)" };
        }
        return parsed as AgentAction;
    } catch {
        // Try to extract JSON from the response
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.type) return parsed as AgentAction;
            } catch { /* fall through */ }
        }
        return { type: "fail", reasoning: `Could not parse LLM response: ${response.slice(0, 200)}` };
    }
}

// ─── Main Agent Loop ────────────────────────────────────────────────

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

export async function runAgenticBrowser(
    goal: string,
    startUrl: string,
    config: AgenticBrowserConfig,
): Promise<AgentRunResult> {
    const verbose = config.verbose ?? true;
    const maxSteps = config.maxSteps ?? 25;
    const useScreenshots = config.useScreenshots ?? true;
    const start = Date.now();
    const steps: AgentAction[] = [];
    const screenshots: string[] = [];

    function log(msg: string) {
        if (verbose) {
            const time = new Date().toLocaleTimeString();
            console.log(`  ${CYAN}[${time}]${RESET} ${msg}`);
        }
    }

    // Set up screenshot dir
    if (config.screenshotDir) {
        fs.mkdirSync(config.screenshotDir, { recursive: true });
    }

    // Launch browser
    const browser = new StealthBrowser({
        mode: config.browserConfig?.mode ?? "standalone",
        headless: config.headless ?? true,
        executablePath: config.browserConfig?.executablePath,
        cdpUrl: config.browserConfig?.cdpUrl,
        proxyManager: config.browserConfig?.proxyManager,
        storagePath: config.browserConfig?.storagePath,
        fingerprint: config.browserConfig?.fingerprint,
        ...config.browserConfig,
    });

    try {
        log(`${BOLD}🚀 Launching stealth browser${RESET}`);
        await browser.launch();

        log(`${BOLD}🌐 Navigating to ${startUrl}${RESET}`);
        const navResult = await browser.navigate(startUrl);
        if (!navResult.success) {
            return {
                success: false,
                result: "",
                steps,
                durationMs: Date.now() - start,
                screenshots,
                error: `Failed to navigate to ${startUrl}: ${navResult.error}`,
            };
        }

        const systemPrompt = buildSystemPrompt(goal);

        for (let step = 1; step <= maxSteps; step++) {
            log(`\n${BOLD}── Step ${step}/${maxSteps} ──${RESET}`);

            // 1. OBSERVE
            log("👀 Observing page...");
            const observation = await observePage(browser);
            log(`📍 URL: ${DIM}${observation.url}${RESET}`);
            log(`📄 Title: ${DIM}${observation.title}${RESET}`);
            log(`🔗 ${observation.interactiveElements.length} interactive elements found`);

            // Save screenshot
            if (config.screenshotDir && observation.screenshotBase64) {
                const path = `${config.screenshotDir}/step-${String(step).padStart(2, "0")}.png`;
                fs.writeFileSync(path, Buffer.from(observation.screenshotBase64, "base64"));
                screenshots.push(path);
            }

            // 2. REASON — Send to LLM
            log("🤔 Reasoning...");
            const stepPrompt = buildStepPrompt(observation, step, steps);
            const fullPrompt = `${systemPrompt}\n\n${stepPrompt}`;

            const llmResponse = await config.llm(
                fullPrompt,
                useScreenshots ? observation.screenshotBase64 : undefined,
            );

            // 3. PARSE — Extract action from LLM response
            const action = parseLLMResponse(llmResponse);
            steps.push(action);

            log(`${YELLOW}⚡ Action: ${BOLD}${action.type}${RESET}${action.selector ? ` → ${DIM}${action.selector}${RESET}` : ""}${action.value ? ` = "${DIM}${action.value.slice(0, 40)}${RESET}"` : ""}`);
            log(`   ${DIM}Reasoning: ${action.reasoning}${RESET}`);

            // 4. CHECK — Is the goal done?
            if (action.type === "done") {
                log(`\n${GREEN}${BOLD}✅ GOAL ACHIEVED${RESET}`);
                log(`   ${GREEN}${action.result || action.reasoning}${RESET}`);

                // Final screenshot
                if (config.screenshotDir) {
                    try {
                        const buf = await browser.screenshot();
                        if (buf) {
                            const path = `${config.screenshotDir}/final.png`;
                            fs.writeFileSync(path, buf);
                            screenshots.push(path);
                        }
                    } catch { /* ignore */ }
                }

                return {
                    success: true,
                    result: action.result || action.reasoning,
                    steps,
                    durationMs: Date.now() - start,
                    screenshots,
                };
            }

            if (action.type === "fail") {
                log(`\n${RED}${BOLD}❌ GOAL FAILED${RESET}`);
                log(`   ${RED}${action.reasoning}${RESET}`);
                return {
                    success: false,
                    result: "",
                    steps,
                    durationMs: Date.now() - start,
                    screenshots,
                    error: action.reasoning,
                };
            }

            // 5. ACT — Execute the action
            try {
                await executeAction(browser, action, config);
                log(`${GREEN}✓${RESET} Action executed`);
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                log(`${RED}⚠ Action failed: ${msg}${RESET}`);
                // Don't abort — let the LLM try again with updated observation
                steps[steps.length - 1] = { ...action, reasoning: `${action.reasoning} (FAILED: ${msg})` };
            }

            // Small breathing room between steps
            await humanDelay(500, 1500);
        }

        // Exhausted max steps
        return {
            success: false,
            result: "",
            steps,
            durationMs: Date.now() - start,
            screenshots,
            error: `Reached max steps (${maxSteps}) without completing the goal.`,
        };

    } finally {
        if (!config.keepOpen && !config.existingBrowser) {
            log("🔒 Closing browser");
            await browser.close();
        } else {
            log("🔓 Keeping browser open (requested or shared instance).");
        }
    }
}
