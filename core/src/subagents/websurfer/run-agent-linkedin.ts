#!/usr/bin/env npx tsx
/**
 * LinkedIn Bot Detection Challenge
 *
 * Goal: Navigate LinkedIn's signup flow and see how far we get
 * before hitting a CAPTCHA or bot block. This tests our stealth
 * browser's anti-detection capabilities against one of the most
 * aggressive bot detection systems on the web.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx src/subagents/websurfer/run-agent-linkedin.ts
 */

import { runAgenticBrowser } from "./agentic-browser.js";
import { createOpenAIAgent, createAnthropicAgent } from "./llm-provider.js";
import { randomFingerprint } from "./human-behavior.js";
import { createCaptchaService } from "./captcha-service.js";

const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

async function main() {
    console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}${CYAN}║   LINKEDIN BOT DETECTION CHALLENGE           ║${RESET}`);
    console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════╝${RESET}\n`);
    console.log(`  ${YELLOW}🎯 Real goal: Can we pass LinkedIn's bot detection?${RESET}\n`);

    // Pick LLM provider
    let llm;
    if (process.env.OPENAI_API_KEY) {
        console.log(`  🤖 Using OpenAI GPT-4o-mini\n`);
        llm = createOpenAIAgent();
    } else if (process.env.ANTHROPIC_API_KEY) {
        console.log(`  🤖 Using Anthropic Claude\n`);
        llm = createAnthropicAgent();
    } else {
        console.error("❌ No API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
        process.exit(1);
    }

    // ── The Goal — Natural Language ──
    const goal = `
    I want to test if this browser gets detected as a bot by LinkedIn's signup page.

    IMPORTANT: LinkedIn uses a MULTI-STEP signup form.
    
    STEALTH INSTRUCTIONS:
    1. Do NOT fill fields top-to-bottom.
    2. USE READING PAUSES, but do not get stuck waiting.
    3. ONLY interact with visible fields.

    Steps:
    1. Look at the CURRENTLY VISIBLE fields.
    2. If you see email/password AND THEY ARE EMPTY:
       - Action: Fill Password (DesignMaster2026!)
       - Action: Fill Email (alex.thompson.design.sf@gmail.com)
       - Action: Click submit.
    3. If you see name fields AND THEY ARE EMPTY:
       - Action: Fill First Name (Alex)
       - Action: Fill Last Name (Thompson)
       - Action: Click submit.
    4. After the final submit, observe what happens CAREFULLY:
       - CAPTCHA, security puzzle, or "verify you're human" → report "BOT DETECTED — [type of challenge]"
       - "Verify email" or profile setup → report "STEALTH PASSED — reached [page description]"
       - "Unusual activity" or "try again later" → report "BOT BLOCKED — [error message]"
       - Form validation error → report "FORM ERROR — [error shown]"
    5. If you see a CAPTCHA, use the 'solve_captcha' action immediately. Do not mark as done until you try to solve it.
  `;

    const fingerprint = randomFingerprint();
    // FORCE MAC FINGERPRINT for local consistency
    fingerprint.userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    fingerprint.viewport = { width: 1440, height: 900 };

    const captchaService = createCaptchaService();

    const result = await runAgenticBrowser(
        goal,
        "https://www.linkedin.com/signup",
        {
            llm,
            maxSteps: 30,
            useScreenshots: true,
            screenshotDir: "src/subagents/websurfer/test-screenshots/linkedin-bot-test",
            headless: false, // Watch it live!
            verbose: true,
            browserConfig: {
                mode: "standalone",
                executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                fingerprint,
            },
            captchaService,
        },
    );

    // ── Print Results ──
    console.log(`\n${BOLD}${CYAN}══════════════════════════════════════════════${RESET}\n`);
    console.log(`  ${result.success ? "✅ COMPLETED" : "❌ FAILED"}`);
    console.log(`  Steps taken: ${result.steps.length}`);
    console.log(`  Duration: ${(result.durationMs / 1000).toFixed(1)}s`);
    console.log(`  Screenshots: ${result.screenshots.length}`);

    if (result.result) {
        console.log(`\n  📋 Bot Detection Result:`);
        console.log(`  ${BOLD}${result.result}${RESET}`);

        // Interpret the result
        if (result.result.includes("STEALTH PASSED")) {
            console.log(`\n  ${BOLD}🏆 Our stealth browser PASSED LinkedIn's bot detection!${RESET}`);
        } else if (result.result.includes("BOT DETECTED")) {
            console.log(`\n  ${YELLOW}🔍 LinkedIn detected us — but we got far enough to trigger it.${RESET}`);
            console.log(`  ${YELLOW}   This tells us which detection layer caught us.${RESET}`);
        } else if (result.result.includes("BOT BLOCKED")) {
            console.log(`\n  ${YELLOW}⛔ LinkedIn blocked us at the network/IP level.${RESET}`);
        }
    }

    if (result.error) console.log(`\n  ❌ Error: ${result.error}`);
    console.log();
}

main().catch(console.error);
