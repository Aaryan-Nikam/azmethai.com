import 'dotenv/config';
import * as readline from 'readline';
import { AgentExecutor } from '../engine/agent-executor.js';
import { AutoResearchEngine } from '../engine/autoresearch.js';
import { NodeValidator } from '../engine/node-validator.js';
import { BrowserTool } from '../agents/tools/browser-tool.js';
import { WebSearchTool } from '../agents/tools/web-search-tool.js';
import { FacebookAPITool } from '../agents/tools/facebook-api-tool.js';
import { ImageGenTool } from '../agents/tools/image-gen-tool.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function runLiveTest() {
    console.log('\n==================================================');
    console.log('🤖 Azmeth Live Agentic CLI Testing Environment');
    console.log('==================================================\n');

    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('⚠️  WARNING: ANTHROPIC_API_KEY is missing. The agent will run in Mock Mode.');
        console.warn('   To test realistically, please add real API keys to your .env file:\n');
        console.warn('   - ANTHROPIC_API_KEY (Required for the Brain)');
        console.warn('   - PERPLEXITY_API_KEY (Required for Web Search)');
        console.warn('   - BROWSERBASE_API_KEY / BROWSERBASE_PROJECT_ID (Required for Scraping)\n');
    } else {
        console.log('✅ Anthropic API Key detected. Running in LIVE mode.\n');
    }

    // Initialize tools
    const tools = new Map<string, any>([
        ['browser', new BrowserTool()],
        ['web_search', new WebSearchTool()],
        ['facebook_api', new FacebookAPITool()],
        ['image_gen', new ImageGenTool()]
    ]);

    const executor = new AgentExecutor(
        process.env.ANTHROPIC_API_KEY || 'dummy_key',
        tools
    );

    const validator = new NodeValidator();
    const autoResearch = new AutoResearchEngine(
        executor,
        validator,
        process.env.ANTHROPIC_API_KEY || 'dummy_key'
    );

    const askQuestion = () => {
        rl.question('\n💬 Enter a prompt for Azmeth (or "exit" to quit):\n> ', async (input) => {
            if (input.toLowerCase() === 'exit') {
                rl.close();
                return;
            }

            if (!input.trim()) {
                askQuestion();
                return;
            }

            console.log('\n[1/2] 🧠 Decomposing task...');
            try {
                const plan = await executor.decompose(input);
                console.log(`\n📋 Strategy: ${plan.reasoning}`);
                plan.steps.forEach((s, idx) => console.log(`   ${idx + 1}. [${s.nodeType}] ${s.label}: ${s.instruction}`));

                console.log(`\n[2/2] 🚀 Executing workflow constraints with AutoResearch...`);
                
                let previousContext = { userMessage: input };

                for (let i = 0; i < plan.steps.length; i++) {
                    const step = plan.steps[i];
                    console.log(`\n▶️  Executing Step ${i + 1}/${plan.steps.length}: ${step.label}`);
                    console.log(`   Instruction: ${step.instruction}`);
                    
                    const result = await autoResearch.executeWithReflection(
                        step.instruction,
                        previousContext,
                        undefined, 
                        (toolName, toolInput) => {
                            console.log(`\n   🛠️  [TOOL CALLED]: ${toolName}`);
                            console.log(`       Input: ${JSON.stringify(toolInput).substring(0, 100)}...`);
                        },
                        (toolName, toolResult) => {
                            console.log(`   ✅ [TOOL RESULT]: ${toolName} -> Success: ${toolResult.success}`);
                        },
                        2 // Allow 2 retries for self-correction
                    );
                    
                    console.log(`\n   📄 Step ${i + 1} Output:\n${result.finalOutput.content}\n`);
                    console.log(`   🛡️  Validation Checks Passed: ${result.attempts} attempts (Refined: ${result.wasRefined})`);
                    
                    // Pass output to next step
                    previousContext = { ...previousContext, [`step_${i+1}_output`]: result.finalOutput.output };
                }

                console.log(`\n🎉 Workflow Complete! All tasks executed and validated.`);
            } catch (err) {
                console.error(`\n❌ Error during execution:`, err);
            }

            askQuestion();
        });
    };

    askQuestion();
}

runLiveTest().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
