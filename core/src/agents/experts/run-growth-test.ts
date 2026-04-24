
import { createOpenAIAgent } from "../../subagents/websurfer/llm-provider.js";
import { GrowthAgent } from "./growth-agent.js";

async function main() {
    // Check if URL provided
    const target = process.argv[2] || "https://openai.com";

    console.log(`\n🧪 Testing Growth Agent on: ${target}\n`);

    const llm = createOpenAIAgent();
    const agent = new GrowthAgent({ llm, verbose: true });

    try {
        const report = await agent.researchStrategy(target);
        console.log("\n✅ Test Complete. Final Report:\n");
        console.log(report);
    } catch (error) {
        console.error("\n❌ Test Failed:", error);
    }
}

main();
