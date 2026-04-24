#!/usr/bin/env npx tsx
/**
 * Websurfer Integration Tests
 *
 * Run: npx tsx src/subagents/websurfer/integration-test.ts
 *
 * Tests the Websurfer against REAL websites to verify:
 *   1. Fetch mode — public page scraping
 *   2. Browser mode — stealth Chromium navigation
 *   3. Anti-detection — bot detection bypass
 *
 * No mocks. Real network requests. Real browser.
 */

import { createWebsurfer, type ExtractionFn } from "./websurfer.js";
import { StealthBrowser } from "./stealth-browser.js";
import { randomFingerprint } from "./human-behavior.js";
import { ProxyManager } from "./proxy-manager.js";

// ─── Colors for terminal output ──────────────────────────────────────

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function pass(label: string, detail?: string): void {
    console.log(`  ${GREEN}✓${RESET} ${label}${detail ? ` ${DIM}(${detail})${RESET}` : ""}`);
}

function fail(label: string, error: string): void {
    console.log(`  ${RED}✗${RESET} ${label}`);
    console.log(`    ${RED}${error}${RESET}`);
}

function header(title: string): void {
    console.log(`\n${CYAN}${BOLD}── ${title} ──${RESET}\n`);
}

// ─── Mock LLM (simple JSON echo) ────────────────────────────────────

const mockLlm: ExtractionFn = async (prompt: string) => {
    // Return a simple extraction based on whether we got page content
    if (prompt.includes("PAGE CONTENT")) {
        return JSON.stringify({
            note: "Mock LLM extraction (integration test)",
            hasContent: true,
            contentLength: prompt.length,
        });
    }
    return JSON.stringify({ hasContent: false });
};

// ─── Test 1: Fetch Mode ─────────────────────────────────────────────

async function testFetchMode(): Promise<boolean> {
    header("TEST 1: Fetch Mode (Public Page)");
    let passed = true;

    const websurfer = createWebsurfer(mockLlm);
    const result = await websurfer.execute({
        goal: "Extract the page title and main content summary",
        params: { url: "https://example.com" },
    });

    // Check success
    if (result.success) {
        pass("Fetched example.com successfully");
    } else {
        fail("Failed to fetch example.com", result.error ?? "unknown error");
        passed = false;
    }

    // Check data shape
    if (result.data && typeof result.data === "object") {
        pass("SubagentResult data is an object");
    } else {
        fail("SubagentResult data is missing or malformed", JSON.stringify(result.data));
        passed = false;
    }

    // Check we got text content
    const data = result.data as Record<string, unknown>;
    if (data.textContent && typeof data.textContent === "string" && (data.textContent as string).length > 0) {
        pass("Got text content", `${(data.textContent as string).length} chars`);
    } else {
        fail("No text content returned", "textContent is empty");
        passed = false;
    }

    // Check sources
    if (result.sources && result.sources.length > 0) {
        pass("Sources array populated", result.sources[0]);
    } else {
        fail("Sources array empty", "provenance tracking broken");
        passed = false;
    }

    // Check timing
    if (result.durationMs && result.durationMs > 0) {
        pass("Duration tracked", `${result.durationMs}ms`);
    } else {
        fail("Duration not tracked", "durationMs is 0 or missing");
        passed = false;
    }

    // Check mode
    if (data.mode === "fetch") {
        pass("Mode correctly reported as 'fetch'");
    } else {
        fail("Wrong mode", `expected 'fetch', got '${data.mode}'`);
        passed = false;
    }

    // Check extraction ran
    if (data.extraction && typeof data.extraction === "object") {
        pass("LLM extraction ran", JSON.stringify(data.extraction).slice(0, 80));
    } else {
        fail("LLM extraction did not run", "extraction is null");
        passed = false;
    }

    return passed;
}

// ─── Test 2: Browser Mode (Stealth) ─────────────────────────────────

async function testBrowserMode(): Promise<boolean> {
    header("TEST 2: Browser Mode (Stealth Navigation)");
    let passed = true;

    const websurfer = createWebsurfer(mockLlm, { headless: true });
    const result = await websurfer.execute({
        goal: "Extract the page title and confirm navigation worked",
        params: {
            url: "https://example.com",
            mode: "browser",
        },
    });

    if (result.success) {
        pass("Stealth browser navigated to example.com");
    } else {
        fail("Browser navigation failed", result.error ?? "unknown error");
        passed = false;
        return passed; // Skip remaining checks
    }

    const data = result.data as Record<string, unknown>;
    if (data.mode === "browser") {
        pass("Mode correctly reported as 'browser'");
    } else {
        fail("Wrong mode", `expected 'browser', got '${data.mode}'`);
        passed = false;
    }

    if (data.textContent && (data.textContent as string).length > 0) {
        pass("Got page text via browser", `${(data.textContent as string).length} chars`);
    } else {
        fail("No text from browser", "textContent empty");
        passed = false;
    }

    if (data.title && (data.title as string).length > 0) {
        pass("Got page title", data.title as string);
    } else {
        fail("No page title", "title empty");
        passed = false;
    }

    if (result.durationMs && result.durationMs > 0) {
        pass("Duration tracked", `${result.durationMs}ms`);
    }

    return passed;
}

// ─── Test 3: Anti-Detection (Bot Test) ──────────────────────────────

async function testAntiDetection(): Promise<boolean> {
    header("TEST 3: Anti-Detection (Stealth Patches)");
    let passed = true;

    const browser = new StealthBrowser({
        mode: "standalone",
        headless: true,
        fingerprint: randomFingerprint(),
    });

    try {
        await browser.launch();
        pass("Stealth browser launched");

        // Navigate to the bot detection test page
        const navResult = await browser.navigate("https://bot.sannysoft.com/");

        if (navResult.success) {
            pass("Navigated to bot.sannysoft.com");
        } else {
            fail("Navigation failed", navResult.error ?? "unknown");
            return false;
        }

        // Check key anti-detection properties via page evaluation
        const page = browser.getPage();
        if (!page) {
            fail("No page available", "getPage() returned null");
            return false;
        }

        // Wait for the test page to run its checks
        await new Promise((r) => setTimeout(r, 3000));

        // Check: navigator.webdriver should be undefined (not true)
        const webdriverValue = await page.evaluate(() => navigator.webdriver);
        if (webdriverValue === undefined || webdriverValue === false) {
            pass("navigator.webdriver is hidden", `value: ${webdriverValue}`);
        } else {
            fail("navigator.webdriver EXPOSED", `value: ${webdriverValue}`);
            passed = false;
        }

        // Check: chrome.runtime should exist
        const chromeRuntime = await page.evaluate(() => typeof (window as any).chrome?.runtime);
        if (chromeRuntime !== "undefined") {
            pass("chrome.runtime stub present", `type: ${chromeRuntime}`);
        } else {
            fail("chrome.runtime missing", "bot detectors will flag this");
            passed = false;
        }

        // Check: plugins should have entries
        const pluginCount = await page.evaluate(() => navigator.plugins.length);
        if (pluginCount > 0) {
            pass("navigator.plugins populated", `count: ${pluginCount}`);
        } else {
            fail("navigator.plugins empty", "bot detectors check this");
            passed = false;
        }

        // Check: languages should be realistic
        const languages = await page.evaluate(() => navigator.languages);
        if (languages && languages.length > 0 && languages[0] === "en-US") {
            pass("navigator.languages realistic", JSON.stringify(languages));
        } else {
            fail("navigator.languages suspicious", JSON.stringify(languages));
            passed = false;
        }

        // Take a screenshot of the detection results
        const screenshot = await browser.screenshot();
        if (screenshot) {
            const fs = await import("node:fs");
            const screenshotPath = "src/subagents/websurfer/test-screenshots/";
            fs.mkdirSync(screenshotPath, { recursive: true });
            fs.writeFileSync(screenshotPath + "bot-detection-results.png", screenshot);
            pass("Screenshot saved", `${screenshotPath}bot-detection-results.png`);
        }

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        fail("Anti-detection test crashed", msg);
        passed = false;
    } finally {
        await browser.close();
        pass("Browser closed cleanly");
    }

    return passed;
}

// ─── Test 4: Proxy Manager (no network) ─────────────────────────────

async function testProxyManager(): Promise<boolean> {
    header("TEST 4: Proxy Manager (Logic Check)");
    let passed = true;

    const pm = new ProxyManager({
        proxies: [
            { server: "http://proxy1:8080", type: "http", isResidential: true, label: "resi-1" },
            { server: "http://proxy2:8080", type: "http", isResidential: true, label: "resi-2" },
            { server: "socks5://proxy3:1080", type: "socks5", isResidential: false, label: "dc-1" },
        ],
        rotation: "round-robin",
        maxFailures: 3,
    });

    // Round-robin check
    const first = pm.getNext();
    const second = pm.getNext();
    const third = pm.getNext();
    const fourth = pm.getNext(); // wraps

    if (first?.label === "resi-1" && second?.label === "resi-2" && third?.label === "dc-1" && fourth?.label === "resi-1") {
        pass("Round-robin rotation works");
    } else {
        fail("Round-robin broken", `${first?.label} → ${second?.label} → ${third?.label} → ${fourth?.label}`);
        passed = false;
    }

    // Failure tracking
    pm.reportFailure("http://proxy1:8080");
    pm.reportFailure("http://proxy1:8080");
    pm.reportFailure("http://proxy1:8080"); // 3 failures = removed
    if (pm.healthyCount() === 2) {
        pass("Dead proxy removed from pool", `healthy: ${pm.healthyCount()}/3`);
    } else {
        fail("Failure tracking broken", `healthy: ${pm.healthyCount()}`);
        passed = false;
    }

    // Stats
    const stats = pm.stats();
    if (stats.total === 3 && stats.totalRequests === 4) {
        pass("Stats tracking correct", `total: ${stats.total}, requests: ${stats.totalRequests}`);
    } else {
        fail("Stats wrong", JSON.stringify(stats));
        passed = false;
    }

    return passed;
}

// ─── Test 5: Fingerprint Variety ────────────────────────────────────

async function testFingerprints(): Promise<boolean> {
    header("TEST 5: Fingerprint Randomization");
    let passed = true;

    const fingerprints = Array.from({ length: 20 }, () => randomFingerprint());
    const uniqueUAs = new Set(fingerprints.map((f) => f.userAgent));
    const uniqueViewports = new Set(fingerprints.map((f) => `${f.viewport.width}x${f.viewport.height}`));
    const uniqueTimezones = new Set(fingerprints.map((f) => f.timezone));

    if (uniqueUAs.size > 1) {
        pass("User agents vary", `${uniqueUAs.size} unique across 20 samples`);
    } else {
        fail("User agents not randomizing", "all same");
        passed = false;
    }

    if (uniqueViewports.size > 1) {
        pass("Viewports vary", `${uniqueViewports.size} unique across 20 samples`);
    } else {
        fail("Viewports not randomizing", "all same");
        passed = false;
    }

    if (uniqueTimezones.size > 1) {
        pass("Timezones vary", `${uniqueTimezones.size} unique across 20 samples`);
    } else {
        fail("Timezones not randomizing", "all same");
        passed = false;
    }

    return passed;
}

// ─── Main Runner ────────────────────────────────────────────────────

async function main() {
    console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}${CYAN}║   WEBSURFER INTEGRATION TESTS                ║${RESET}`);
    console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════╝${RESET}`);

    const results: Array<{ name: string; passed: boolean }> = [];

    // Test 1: Fetch mode (always run)
    results.push({ name: "Fetch Mode", passed: await testFetchMode() });

    // Test 4 & 5: No network needed
    results.push({ name: "Proxy Manager", passed: await testProxyManager() });
    results.push({ name: "Fingerprint Variety", passed: await testFingerprints() });

    // Test 2 & 3: Require Chromium — try, but gracefully fail
    try {
        results.push({ name: "Browser Mode", passed: await testBrowserMode() });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Executable doesn't exist") || msg.includes("browserType.launch")) {
            console.log(`\n  ${YELLOW}⚠ Browser Mode skipped — Chromium not installed${RESET}`);
            console.log(`  ${DIM}Run: npx playwright install chromium${RESET}`);
        } else {
            fail("Browser Mode", msg);
            results.push({ name: "Browser Mode", passed: false });
        }
    }

    try {
        results.push({ name: "Anti-Detection", passed: await testAntiDetection() });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Executable doesn't exist") || msg.includes("browserType.launch")) {
            console.log(`\n  ${YELLOW}⚠ Anti-Detection skipped — Chromium not installed${RESET}`);
        } else {
            fail("Anti-Detection", msg);
            results.push({ name: "Anti-Detection", passed: false });
        }
    }

    // Summary
    header("RESULTS");
    const totalPassed = results.filter((r) => r.passed).length;
    const totalFailed = results.filter((r) => !r.passed).length;

    for (const r of results) {
        const icon = r.passed ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
        console.log(`  ${icon} ${r.name}`);
    }

    console.log(`\n  ${BOLD}${totalPassed} passed${RESET}, ${totalFailed > 0 ? RED : ""}${totalFailed} failed${RESET}\n`);

    process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(console.error);
