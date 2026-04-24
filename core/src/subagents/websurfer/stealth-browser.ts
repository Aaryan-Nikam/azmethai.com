/**
 * Stealth Browser Engine
 *
 * Wraps Playwright with anti-detection measures to operate on third-party
 * platforms without triggering bot detection. Supports two launch modes:
 *
 * MODE A — STANDALONE (development / local)
 *   Launches its own Chromium process with stealth args.
 *   Fast to start, no Docker required.
 *
 * MODE B — SANDBOXED (production)
 *   Connects to a Chromium instance running inside a Docker container
 *   via Chrome DevTools Protocol (CDP). Uses Azmeth's container
 *   infrastructure for isolation. Stealth patches are injected into
 *   the Playwright context after connection.
 *
 * Both modes get the same stealth treatment:
 *   - Anti-detection JS patches (webdriver flag, chrome.runtime, plugins, etc.)
 *   - Randomized fingerprint per session (viewport, user-agent, timezone)
 *   - Proxy support with rotation
 *   - Human behavior simulation on all interactions
 *   - Cookie/session persistence for sign-in state
 *   - Automatic screenshot capture on failure
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import {
    humanClick,
    humanDelay,
    humanMouseMove,
    humanPageExplore,
    humanScroll,
    humanType,
    randomFingerprint,
    type BrowserFingerprint,
} from "./human-behavior.js";
import { ProxyManager, type ProxyConfig } from "./proxy-manager.js";

// ─── Types ───────────────────────────────────────────────────────────

export interface StealthBrowserConfig {
    /** Launch mode. "standalone" = own Chromium. "sandbox" = connect to Docker CDP. */
    mode: "standalone" | "sandbox";

    /** CDP URL to connect to when mode is "sandbox" (e.g. "http://127.0.0.1:9222"). */
    cdpUrl?: string;

    /** Proxy manager for IP rotation (optional). */
    proxyManager?: ProxyManager;

    /** Path to persist cookies/storage between sessions. */
    storagePath?: string;

    /** Whether to run headless (default: true). Only applies to standalone mode. */
    headless?: boolean;

    /** Path to the Chromium executable (default: system chromium). Standalone only. */
    executablePath?: string;

    /** Custom fingerprint (default: random). */
    fingerprint?: BrowserFingerprint;

    /** Max page load timeout in ms (default: 30s). */
    pageLoadTimeoutMs?: number;

    /** In-memory storage state (cookies/origins) to inject (optional). */
    storageState?: { cookies: any[]; origins: any[] };
}

export interface NavigationResult {
    success: boolean;
    url: string;
    title: string;
    screenshot?: string;
    error?: string;
}

// ─── Stealth Patches ────────────────────────────────────────────────

/**
 * JavaScript injected into every page to patch common bot detection signals.
 *
 * What each patch defeats:
 * 1. navigator.webdriver — Playwright sets this to true; real browsers don't
 * 2. chrome.runtime — bot detectors check for extension API stubs
 * 3. Permissions API — "notifications" should return the real permission state
 * 4. navigator.plugins — real browsers report PDF viewer plugins
 * 5. navigator.languages — must be a real array, not empty
 * 6. iframe contentWindow — some detectors check chrome object inside iframes
 * 7. WebGL renderer — return a realistic GPU string instead of "SwiftShader"
 * 8. canvas fingerprint — add noise to prevent exact fingerprinting
 */
const STEALTH_SCRIPTS = `
/**
 * Stealth Evasion Scripts
 * Wraps native overrides to pass toString() checks.
 */
(function() {
    const originalToString = Function.prototype.toString;
    function makeNative(newFunc, name) {
        Object.defineProperty(newFunc, 'toString', {
            value: function() {
                if (this === newFunc) {
                    return "function " + name + "() { [native code] }";
                }
                return originalToString.call(this);
            },
            configurable: true,
            writable: true
        });
        return newFunc;
    }

    // 1. Remove webdriver flag
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

    // 2. Chrome Runtime (better mock)
    window.chrome = {
        runtime: {
            id: undefined,
            connect: function() {},
            sendMessage: function() {}
        },
        app: {
            isInstalled: false,
            InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
            RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
        },
        csi: function() {},
        loadTimes: function() {}
    };

    // 3. Fix Permissions API
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = makeNative(async function query(parameters) {
        if (parameters.name === 'notifications') {
            return { state: Notification.permission, onchange: null };
        }
        return originalQuery.apply(this, arguments);
    }, "query");

    // 4. Plugins (basic)
    Object.defineProperty(navigator, 'plugins', {
        get: () => [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
            { name: 'Native Client', filename: 'internal-nacl-plugin' }
        ]
    });

    // 5. Languages
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

    // 7. WebGL renderer override (DISABLED for local consistency)
    /*
    const getParam = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = makeNative(function getParameter(param) {
        // UNMASKED_VENDOR_WEBGL
        if (param === 37445) return 'Google Inc. (NVIDIA)';
        // UNMASKED_RENDERER_WEBGL
        if (param === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Direct3D11 vs_5_0 ps_5_0, D3D11)';
        return getParam.call(this, param);
    }, "getParameter");
    */

    // 8. Canvas fingerprint noise (DISABLED for local consistency)
    /*
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = makeNative(function toDataURL(type) {
        const ctx = this.getContext('2d');
        // Add minimal noise (alpha change) only once per context to avoid accumulated drift
        if (ctx && !ctx._hasNoise) {
            const style = ctx.fillStyle;
            ctx.fillStyle = 'rgba(0,0,0,0.01)';
            ctx.fillRect(0, 0, 1, 1);
            ctx.fillStyle = style;
            ctx._hasNoise = true;
        }
        return origToDataURL.apply(this, arguments);
    }, "toDataURL");
    */

})();
`;

// ─── Chromium Stealth Args ──────────────────────────────────────────

/**
 * Launch arguments that reduce Chromium's bot fingerprint.
 * Only used in standalone mode (Docker container args are set at build time).
 */
const STEALTH_LAUNCH_ARGS = [
    "--disable-blink-features=AutomationControlled",  // Hide automation flag
    "--disable-features=IsolateOrigins,site-per-process",
    "--disable-infobars",           // Remove "controlled by automation" bar
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--disable-dev-shm-usage",      // Prevent /dev/shm overflow in containers
    "--disable-save-password-bubble",
    "--disable-single-click-autofill",
    "--disable-autofill-keyboard-accessory-view",
    "--disable-translate",
    "--password-store=basic",       // Don't use system keychain (avoids popups)
];

// ─── Stealth Browser ────────────────────────────────────────────────

export class StealthBrowser {
    private config: StealthBrowserConfig;
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private fingerprint: BrowserFingerprint;
    private currentProxy: ProxyConfig | null = null;

    constructor(config: StealthBrowserConfig) {
        this.config = config;
        this.fingerprint = config.fingerprint ?? randomFingerprint();
    }

    public getPage(): Page | null {
        return this.page;
    }

    /**
     * Launch or connect the stealth browser.
     *
     * STANDALONE: Launches a local Chromium with stealth args.
     * SANDBOX:    Connects to Docker Chromium via CDP, then patches.
     */
    async launch(): Promise<void> {
        this.currentProxy = this.config.proxyManager?.getNext() ?? null;

        if (this.config.mode === "sandbox") {
            await this.launchSandboxed();
        } else {
            await this.launchStandalone();
        }

        // ── Common setup (both modes) ──
        await this.setupContext();
    }

    /**
     * STANDALONE — Launch our own Chromium process.
     */
    private async launchStandalone(): Promise<void> {
        const launchArgs = [
            ...STEALTH_LAUNCH_ARGS,
            `--window-size=${this.fingerprint.viewport.width},${this.fingerprint.viewport.height}`,
        ];

        const launchOptions: Record<string, unknown> = {
            headless: this.config.headless ?? true,
            args: launchArgs,
        };

        if (this.config.executablePath) {
            launchOptions.executablePath = this.config.executablePath;
        }

        if (this.currentProxy) {
            launchOptions.proxy = ProxyManager.toPlaywrightProxy(this.currentProxy);
        }

        this.browser = await chromium.launch(
            launchOptions as Parameters<typeof chromium.launch>[0],
        );
    }

    /**
     * SANDBOX — Connect to a Docker-containerized Chromium via CDP.
     * This uses the same CDP connection method as Azmeth's pw-session.ts
     * (`chromium.connectOverCDP(cdpUrl)`), but then patches the context
     * with our stealth scripts.
     */
    private async launchSandboxed(): Promise<void> {
        const cdpUrl = this.config.cdpUrl;
        if (!cdpUrl) {
            throw new Error("Sandbox mode requires cdpUrl (CDP endpoint of the Docker container).");
        }

        // Wait for CDP to be reachable (container may still be starting)
        const reachable = await this.waitForCdp(cdpUrl, 15_000);
        if (!reachable) {
            throw new Error(`CDP endpoint not reachable at ${cdpUrl} after 15s.`);
        }

        this.browser = await chromium.connectOverCDP(cdpUrl);
    }

    /**
     * Wait for a CDP endpoint to become reachable.
     * Mirrors Azmeth's waitForSandboxCdp pattern.
     */
    private async waitForCdp(cdpUrl: string, timeoutMs: number): Promise<boolean> {
        const deadline = Date.now() + timeoutMs;
        // Extract host:port from cdpUrl for the /json/version check
        const versionUrl = cdpUrl.replace(/\/?$/, "/json/version").replace("ws://", "http://").replace("wss://", "https://");

        while (Date.now() < deadline) {
            try {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 2000);
                try {
                    const res = await fetch(versionUrl, { signal: ctrl.signal });
                    if (res.ok) return true;
                } finally {
                    clearTimeout(timer);
                }
            } catch {
                // Not ready yet
            }
            await new Promise((r) => setTimeout(r, 300));
        }
        return false;
    }

    /**
     * Set up the browser context with stealth patches.
     * This is the same for both standalone and sandbox modes.
     */
    private async setupContext(): Promise<void> {
        if (!this.browser) throw new Error("Browser not initialized.");

        const contextOptions: Record<string, unknown> = {
            viewport: this.fingerprint.viewport,
            userAgent: this.fingerprint.userAgent,
            locale: this.fingerprint.locale,
            timezoneId: this.fingerprint.timezone,
            colorScheme: this.fingerprint.colorScheme,
            deviceScaleFactor: this.fingerprint.deviceScaleFactor,
            permissions: ["geolocation"],
            acceptDownloads: true,
        };

        // Proxy for context (standalone: set at browser level, sandbox: set here)
        if (this.config.mode === "sandbox" && this.currentProxy) {
            contextOptions.proxy = ProxyManager.toPlaywrightProxy(this.currentProxy);
        }

        // Load saved cookies/session if available
        if (this.config.storageState) {
            contextOptions.storageState = this.config.storageState;
        } else if (this.config.storagePath) {
            try {
                const fs = await import("node:fs");
                if (fs.existsSync(this.config.storagePath)) {
                    contextOptions.storageState = this.config.storagePath;
                }
            } catch { /* start fresh */ }
        }

        // For sandbox mode, use existing contexts if available
        if (this.config.mode === "sandbox") {
            const existingContexts = this.browser.contexts();
            if (existingContexts.length > 0) {
                this.context = existingContexts[0];
                // Still inject stealth into existing context
                await this.context.addInitScript(STEALTH_SCRIPTS);
                const pages = this.context.pages();
                this.page = pages.length > 0 ? pages[0] : await this.context.newPage();
            } else {
                this.context = await this.browser.newContext(
                    contextOptions as Parameters<Browser["newContext"]>[0],
                );
                await this.context.addInitScript(STEALTH_SCRIPTS);
                this.page = await this.context.newPage();
            }
        } else {
            this.context = await this.browser.newContext(
                contextOptions as Parameters<Browser["newContext"]>[0],
            );
            await this.context.addInitScript(STEALTH_SCRIPTS);
            this.page = await this.context.newPage();
        }

        // Set timeouts
        const timeout = this.config.pageLoadTimeoutMs ?? 30_000;
        this.page.setDefaultTimeout(timeout);
        this.page.setDefaultNavigationTimeout(timeout);
    }

    // ─── Actions ────────────────────────────────────────────────────────

    /**
     * Navigate to a URL with human-like behavior.
     */
    async navigate(url: string): Promise<NavigationResult> {
        if (!this.page) {
            return { success: false, url, title: "", error: "Browser not launched. Call launch() first." };
        }

        try {
            const response = await this.page.goto(url, { waitUntil: "domcontentloaded" });
            const status = response?.status() ?? 0;

            if (status >= 400) {
                return { success: false, url: this.page.url(), title: await this.page.title(), error: `HTTP ${status}` };
            }

            // Simulate human page exploration
            await humanPageExplore(this.page);

            if (this.currentProxy) {
                this.config.proxyManager?.reportSuccess(this.currentProxy.server);
            }

            return { success: true, url: this.page.url(), title: await this.page.title() };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (this.currentProxy) {
                this.config.proxyManager?.reportFailure(this.currentProxy.server);
            }

            let screenshot: string | undefined;
            try {
                const buf = await this.page.screenshot({ type: "png" });
                screenshot = buf.toString("base64");
            } catch { /* page may be dead */ }

            return { success: false, url: this.page.url(), title: "", screenshot, error: `Navigation failed: ${message}` };
        }
    }

    /** Click with human behavior. */
    async click(selector: string): Promise<void> {
        if (!this.page) throw new Error("Browser not launched.");
        await humanClick(this.page, selector);
    }

    /** Type with human behavior. */
    async type(selector: string, text: string): Promise<void> {
        if (!this.page) throw new Error("Browser not launched.");
        await humanType(this.page, selector, text);
    }

    /** Scroll with human behavior. */
    async scroll(options?: { scrolls?: number; direction?: "down" | "up" }): Promise<void> {
        if (!this.page) throw new Error("Browser not launched.");
        await humanScroll(this.page, options);
    }

    /** Wait for a selector to appear. */
    async waitFor(selector: string, timeoutMs?: number): Promise<boolean> {
        if (!this.page) return false;
        try {
            await this.page.waitForSelector(selector, { timeout: timeoutMs ?? 10_000 });
            return true;
        } catch {
            return false;
        }
    }

    /** Get clean text content of the page (non-destructive — doesn't modify DOM). */
    async getPageText(): Promise<string> {
        if (!this.page) return "";
        return await this.page.evaluate(() => {
            // Tags to skip when extracting text (we read but don't remove them)
            const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH"]);
            const result: string[] = [];
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode(node) {
                        const parent = node.parentElement;
                        if (!parent) return NodeFilter.FILTER_REJECT;
                        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
                        const text = (node.textContent || "").trim();
                        if (!text) return NodeFilter.FILTER_REJECT;
                        return NodeFilter.FILTER_ACCEPT;
                    },
                },
            );
            while (walker.nextNode()) {
                result.push((walker.currentNode.textContent || "").trim());
            }
            return result.join(" ");
        });
    }

    /** Get current page HTML. */
    async getPageHtml(): Promise<string> {
        if (!this.page) return "";
        return await this.page.content();
    }

    /** Take a screenshot. */
    async screenshot(): Promise<Buffer | null> {
        if (!this.page) return null;
        return await this.page.screenshot({ type: "png", fullPage: false });
    }

    /** Save cookies/storage for session reuse across runs. */
    async saveState(): Promise<void> {
        if (!this.context || !this.config.storagePath) return;
        const state = await this.context.storageState();
        const fs = await import("node:fs");
        fs.writeFileSync(this.config.storagePath, JSON.stringify(state, null, 2));
    }

    /** Get current storage state (cookies, local storage) in-memory. */
    async getStorageState(): Promise<{ cookies: any[]; origins: any[] } | null> {
        if (!this.context) return null;
        return await this.context.storageState();
    }

    /** Get raw Playwright Page for advanced use. */
    getPage(): Page | null {
        return this.page;
    }

    /** Get current launch mode. */
    getMode(): "standalone" | "sandbox" {
        return this.config.mode;
    }

    /**
     * Close the browser and clean up.
     * Saves session state before closing.
     * In sandbox mode, does NOT kill the Docker container — only disconnects.
     */
    async close(): Promise<void> {
        if (this.config.storagePath) {
            await this.saveState();
        }

        if (this.config.mode === "sandbox") {
            // Disconnect from CDP — container keeps running
            await this.browser?.close();
        } else {
            // Standalone: close everything
            await this.context?.close();
            await this.browser?.close();
        }

        this.page = null;
        this.context = null;
        this.browser = null;
    }
}
