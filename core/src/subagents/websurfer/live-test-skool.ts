#!/usr/bin/env npx tsx
/**
 * Live Websurfer Test — Skool Signup
 *
 * Runs the stealth browser in NON-HEADLESS mode so you can watch
 * the agent navigate, type, and click like a human — LIVE on screen.
 *
 * Run: npx tsx src/subagents/websurfer/live-test-skool.ts
 */

import { StealthBrowser } from "./stealth-browser.js";
import { randomFingerprint, humanDelay } from "./human-behavior.js";
import * as fs from "node:fs";

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function log(step: string, detail?: string) {
    const time = new Date().toLocaleTimeString();
    console.log(`  ${CYAN}[${time}]${RESET} ${BOLD}${step}${RESET}${detail ? ` ${DIM}— ${detail}${RESET}` : ""}`);
}

async function saveScreenshot(browser: StealthBrowser, name: string) {
    const buf = await browser.screenshot();
    if (buf) {
        const dir = "src/subagents/websurfer/test-screenshots/";
        fs.mkdirSync(dir, { recursive: true });
        const path = `${dir}${name}.png`;
        fs.writeFileSync(path, buf);
        log("📸 Screenshot", path);
    }
}

async function main() {
    console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}${CYAN}║   LIVE WEBSURFER TEST — SKOOL SIGNUP         ║${RESET}`);
    console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════╝${RESET}\n`);

    const fingerprint = randomFingerprint();
    fingerprint.viewport = { width: 1280, height: 800 };

    const browser = new StealthBrowser({
        mode: "standalone",
        headless: false,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        fingerprint,
    });

    try {
        // ── Step 1: Launch ──
        log("🚀 Launching stealth browser", `UA: ${fingerprint.userAgent.slice(0, 60)}...`);
        await browser.launch();
        log("✅ Browser launched", "visible on screen");
        const page = browser.getPage()!;

        // ── Step 2: Navigate to Skool signup ──
        log("🌐 Navigating to Skool.com/signup");
        const navResult = await browser.navigate("https://www.skool.com/signup");
        if (!navResult.success) {
            log(`❌ Navigation failed: ${navResult.error}`);
            return;
        }
        log("✅ Landed on Skool", navResult.url);
        await saveScreenshot(browser, "skool-01-landing");

        // ── Step 3: Click "CREATE YOUR COMMUNITY" ──
        await humanDelay(1000, 2000);
        log("🖱️ Clicking 'CREATE YOUR COMMUNITY' button");

        // Try multiple selectors for the CTA button
        const ctaClicked = await tryClick(page, [
            'text="CREATE YOUR COMMUNITY"',
            'button:has-text("create")',
            'a:has-text("create")',
            'button:has-text("Create Your Community")',
            'a:has-text("Create Your Community")',
            'button:has-text("Sign Up")',
            'a:has-text("Sign Up")',
            'button:has-text("Get Started")',
        ]);

        if (ctaClicked) {
            log("✅ CTA clicked");
        } else {
            log("⚠️ CTA button not found — trying to scroll and look");
            await browser.scroll({ scrolls: 2 });
            await humanDelay(1000, 2000);
            await saveScreenshot(browser, "skool-02-scrolled");
        }

        await humanDelay(2000, 4000);
        await saveScreenshot(browser, "skool-02-after-cta");

        // ── Step 4: Handle the signup form ──
        log("👀 Looking for signup form...");

        // Try various selectors that Skool might use
        const emailSelectors = [
            'input[type="email"]',
            'input[name="email"]',
            'input[placeholder*="email" i]',
            'input[placeholder*="Email" i]',
            'input[autocomplete="email"]',
            'input[data-testid*="email" i]',
        ];

        const passwordSelectors = [
            'input[type="password"]',
            'input[name="password"]',
            'input[placeholder*="password" i]',
            'input[placeholder*="Password" i]',
        ];

        const nameSelectors = [
            'input[name="name"]',
            'input[placeholder*="name" i]',
            'input[placeholder*="Name" i]',
            'input[autocomplete="name"]',
        ];

        // Wait a moment for the form to render
        await humanDelay(2000, 3000);

        // Try to find any input field
        let foundForm = false;
        for (const sel of emailSelectors) {
            try {
                const el = await page.$(sel);
                if (el && await el.isVisible()) {
                    log("📧 Found email field", sel);
                    foundForm = true;

                    // Type email with human behavior
                    log("⌨️ Typing email...", "justgetit0909@gmail.com");
                    await browser.type(sel, "justgetit0909@gmail.com");
                    await saveScreenshot(browser, "skool-03-email");
                    break;
                }
            } catch { /* try next */ }
        }

        if (!foundForm) {
            // Maybe the page requires interaction first — let's see what's on screen
            log("� No email field yet — dumping all input fields on page");
            const inputs = await page.$$eval("input", (els) =>
                els.map((el) => ({
                    type: el.type,
                    name: el.name,
                    placeholder: el.placeholder,
                    id: el.id,
                    visible: el.offsetParent !== null,
                    className: el.className.slice(0, 50),
                }))
            );
            console.log(`  ${DIM}Inputs found: ${JSON.stringify(inputs, null, 2)}${RESET}`);

            // Also check for any buttons/links
            log("🔍 Checking all buttons and links");
            const buttons = await page.$$eval("button, a[role='button'], [role='link']", (els) =>
                els.map((el) => ({
                    text: el.textContent?.trim().slice(0, 60),
                    tag: el.tagName,
                    visible: el.offsetParent !== null,
                    href: (el as HTMLAnchorElement).href || "",
                })).filter((b) => b.visible)
            );
            console.log(`  ${DIM}Buttons: ${JSON.stringify(buttons, null, 2)}${RESET}`);

            await saveScreenshot(browser, "skool-03-no-form");
        }

        // Fill password if found
        await humanDelay(500, 1000);
        for (const sel of passwordSelectors) {
            try {
                const el = await page.$(sel);
                if (el && await el.isVisible()) {
                    log("🔑 Found password field — typing password");
                    await browser.type(sel, "Payal@02");
                    await saveScreenshot(browser, "skool-04-password");
                    break;
                }
            } catch { /* try next */ }
        }

        // Fill name if found
        await humanDelay(500, 1000);
        for (const sel of nameSelectors) {
            try {
                const el = await page.$(sel);
                if (el && await el.isVisible()) {
                    log("👤 Found name field — typing name");
                    await browser.type(sel, "Just Get It");
                    await saveScreenshot(browser, "skool-05-name");
                    break;
                }
            } catch { /* try next */ }
        }

        // Submit
        await humanDelay(1000, 2000);
        const submitClicked = await tryClick(page, [
            'button[type="submit"]',
            'button:has-text("Sign up")',
            'button:has-text("Create")',
            'button:has-text("Continue")',
            'button:has-text("Next")',
            'input[type="submit"]',
        ]);

        if (submitClicked) {
            log("🖱️ Submit clicked");
        } else {
            log("⚠️ No submit button found — pressing Enter");
            await page.keyboard.press("Enter");
        }

        // ── Step 5: Wait and observe result ──
        log("⏳ Waiting for response...");
        await humanDelay(5000, 8000);
        await saveScreenshot(browser, "skool-06-result");

        log("� Current URL", page.url());
        log("📄 Page title", await page.title());

        // ── Keep open so user can see ──
        log("👁️ Keeping browser open for 15 seconds...");
        await humanDelay(15000, 15000);

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log(`❌ Error: ${msg}`);
        await saveScreenshot(browser, "skool-error");
    } finally {
        log("🔒 Closing browser");
        await browser.close();
        log("✅ Done");
    }
}

/**
 * Try clicking the first matching visible element from a list of selectors.
 */
async function tryClick(page: any, selectors: string[]): Promise<boolean> {
    for (const sel of selectors) {
        try {
            const el = await page.$(sel);
            if (el && await el.isVisible()) {
                await el.click();
                return true;
            }
        } catch { /* try next */ }
    }
    return false;
}

main().catch(console.error);
