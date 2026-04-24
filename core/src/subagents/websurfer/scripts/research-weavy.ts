
import { runAgenticBrowser } from '../agentic-browser.js';
import { StealthBrowser } from '../stealth-browser.js';
import { createOpenAIAgent, createAnthropicAgent } from '../llm-provider.js';
import { randomFingerprint } from '../human-behavior.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

/**
 * UI Research Script for Weavy.ai
 * Goal: Navigate to the Canvas, interact with UI elements, and capture screenshots for replication.
 */
async function runWeavyResearch() {
    console.log("🚀 Starting Weavy.ai UI Research Agent (Google Login Mode)...");

    const email = "nikamaaryan57@gmail.com";

    // 1. Setup LLM
    let llm;
    if (process.env.OPENAI_API_KEY) {
        llm = createOpenAIAgent();
    } else if (process.env.ANTHROPIC_API_KEY) {
        llm = createAnthropicAgent();
    } else {
        console.error("❌ No API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.");
        process.exit(1);
    }

    // 2. Setup Artifacts
    const artifactDir = path.resolve(process.cwd(), 'artifacts/weavy-research');
    if (!fs.existsSync(artifactDir)) {
        fs.mkdirSync(artifactDir, { recursive: true });
    }

    // 3. Define Goal
    const goal = `
    PRECONDITON: The user is ALREADY LOGGED IN.
    
    PHASE 1: NAVIGATION & VALIDATION
    1. Navigate to https://app.weavy.ai/ (Dashboard).
    2. If you see a "Sign In" page, WAIT for the user to fix it, or try clicking "Log in" once. But primarily expect to see the Dashboard.
    3. Look for "Create Project", "New Canvas", or an existing project.
    4. **CLICK IT** to enter the **Editor Interface**.
    
    PHASE 2: DEEP UI EXPLORATION (FOCUS: NODES & FLOWS)
    5. Once in the Editor/Canvas (URL contains 'flow'):
       - **CRITICAL**: This is a Node-based editor. Focus on the NODES.
       - **Action 1**: Find a Node (block/card on canvas) and CLICK it. Take Screenshot of its properties.
       - **Action 2**: Try to DRAG a node to a new position. Take Screenshot.
       - **Action 3**: Look for "Connectors" or lines between nodes. Hover or Click them. Take Screenshot.
       - **Action 4**: Add a NEW Node from the toolbar/sidebar. Take Screenshot.
       - **Action 5**: Zoom in/out to see the grid/canvas structure.
    
    6. **Constraint**: You must capture at least 5 screenshots specifically of NODE interactions.
    7. Do not just look at the toolbar. Interact with the graph itself.
    8. Only use the "done" action after you have fully explored the Node system.
    `;

    // 4. Run Agent
    const fingerprint = randomFingerprint();

    // Manual Navigation & Wait Loop
    const browser = new StealthBrowser({
        mode: "standalone",
        headless: false,
        fingerprint: fingerprint
    });

    try {
        console.log("🚀 Launching Browser...");
        await browser.launch();
        await browser.navigate("https://app.weavy.ai");

        console.log("WAITING FOR USER TO LOGIN...");
        console.log("👉 Please log in manually. The agent will pause until you reach the Dashboard.");

        // Wait loop
        const page = browser.getPage();
        if (!page) throw new Error("No page found");

        let checks = 0;
        while (true) {
            const url = page.url();
            let title = "";
            try { title = await page.title(); } catch { }

            console.log(`Checking [${checks}] URL: ${url} | Title: ${title}`);

            // Allow any project or flow page, or dashboard
            // Timeout check (independent of URL)
            if (checks > 30) {
                console.log("⚠️ Timeout waiting for dashboard. Starting anyway? (Hope you are logged in!)");
                break;
            }

            // Valid Dashboard URL check
            if ((url.includes("app.weavy.ai") || url.includes("cedar-server")) &&
                !url.includes("signin") &&
                !url.includes("login") &&
                (title.toLowerCase().includes("dashboard") || title.toLowerCase().includes("project") || url.includes("/flow/"))) {

                console.log("✅ Dashboard/Project detected! Starting Agentic AI...");
                break;
            }

            checks++;
            await new Promise(r => setTimeout(r, 2000));
        }

        // Now run the agent on the EXISTING browser instance? 
        // AgenticBrowser creates its own browser instance by default. 
        // I need to modify AgenticBrowser to accept an existing browser OR 
        // simple: just restart the agentic loop on the current URL, but AgenticBrowser is designed to own the lifecycle.

        // BETTER APPROACH: Use the AgenticBrowser's "goal" to just BE QUIET until dashboard?
        // No, LLM is costly and impatient.

        // Hack: Close this manual browser, pass the storage state? 
        // Or refactor AgenticBrowser to take an existing page?
        // Refactoring AgenticBrowser is best, but "keepOpen" was added.
        // Let's passed the `browser` instance to runAgenticBrowser? 
        // The current signature is `config`. 

        // actually, runAgenticBrowser creates `new StealthBrowser`.
        // If I close this one, I lose the session cookies unless I save them.

        // DIRECT HANDOFF: Pass the existing browser instance to the agent
        console.log("🤝 Handing over browser to Agent...");

        const result = await runAgenticBrowser(
            goal,
            "https://app.weavy.ai", // Should update current page
            {
                llm,
                maxSteps: 50,
                useScreenshots: true,
                screenshotDir: artifactDir,
                headless: false,
                keepOpen: true,
                existingBrowser: browser, // <--- Key Change
                verbose: true
            }
        );

        console.log(`\n🏁 Research Finished. Success: ${result.success}`);
        if (!result.success && result.error) {
            console.error(`❌ Error details: ${result.error}`);
        }
        console.log(`📂 Artifacts saved to: ${artifactDir}`);

    } catch (error) {
        console.error("❌ Research failed:", error);
    }
}

// Run
runWeavyResearch();
