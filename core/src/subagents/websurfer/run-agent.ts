#!/usr/bin/env npx tsx
/**
 * Run the Agentic Browser — Live Demo
 *
 * This is the autonomous agent. Give it a goal in plain English
 * and it figures out the rest. No hardcoded selectors.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx src/subagents/websurfer/run-agent.ts
 *
 * Or set the key in your .env file.
 */

import { runAgenticBrowser } from "./agentic-browser.js";
import { createOpenAIAgent, createAnthropicAgent } from "./llm-provider.js";
import { randomFingerprint } from "./human-behavior.js";

const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

async function main() {
    console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}${CYAN}║   AGENTIC BROWSER — AUTONOMOUS MODE          ║${RESET}`);
    console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════╝${RESET}\n`);

    // Pick LLM provider based on available key
    let llm;
    if (process.env.OPENAI_API_KEY) {
        console.log(`  🤖 Using OpenAI GPT-4o\n`);
        llm = createOpenAIAgent();
    } else if (process.env.ANTHROPIC_API_KEY) {
        console.log(`  🤖 Using Anthropic Claude 3.5 Sonnet\n`);
        llm = createAnthropicAgent();
    } else {
        console.error("❌ No API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
        console.error("   Example: OPENAI_API_KEY=sk-... npx tsx src/subagents/websurfer/run-agent.ts");
        process.exit(1);
    }

    // ── The Goal — Natural Language ──
    const goal = `
    I want to use my Skool account. Here are my login details:
    - Email: nikamaaryan57@gmail.com
    - Password: NIKAMAARYAN.0707

    Steps to accomplish:
    1. Type my email into the email field and my password into the password field, then click "Log In"
    2. After logging in, go to the Discover page to search for communities
    3. Search for "AI" or "Artificial Intelligence" communities
    4. Browse the results and join 2-3 communities that focus on AI or machine learning
    5. Tell me which communities you joined
  `;

    const fingerprint = randomFingerprint();
    fingerprint.viewport = { width: 1280, height: 800 };

    const result = await runAgenticBrowser(
        goal,
        "https://www.skool.com/login",
        {
            llm,
            maxSteps: 30,
            useScreenshots: true,
            screenshotDir: "src/subagents/websurfer/test-screenshots/agent-run",
            headless: false,  // Watch it live!
            verbose: true,
            browserConfig: {
                mode: "standalone",
                executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                fingerprint,
            },
        },
    );

    // ── Print Results ──
    console.log(`\n${BOLD}${CYAN}══════════════════════════════════════════════${RESET}\n`);
    console.log(`  ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);
    console.log(`  Steps taken: ${result.steps.length}`);
    console.log(`  Duration: ${(result.durationMs / 1000).toFixed(1)}s`);
    console.log(`  Screenshots: ${result.screenshots.length}`);
    if (result.result) console.log(`\n  📋 Result:\n  ${result.result}`);
    if (result.error) console.log(`\n  ❌ Error: ${result.error}`);
    console.log();
}

main().catch(console.error);
