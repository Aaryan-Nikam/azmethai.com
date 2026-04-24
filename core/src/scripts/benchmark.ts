import 'dotenv/config';
import { AgentExecutor } from '../engine/agent-executor.js';
import { BrowserTool } from '../agents/tools/browser-tool.js';
import { WebSearchTool } from '../agents/tools/web-search-tool.js';
import { FacebookAPITool } from '../agents/tools/facebook-api-tool.js';
import { ImageGenTool } from '../agents/tools/image-gen-tool.js';

async function runBenchmark() {
    console.log('🚀 Starting Azmeth Benchmark Execution\n');

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

    const tasks = [
        {
            name: 'Task 1: Simple Knowledge Retrieval',
            prompt: 'What were the major AI product announcements from Apple in 2024?'
        },
        {
            name: 'Task 2: Multi-step Marketing Research',
            prompt: 'Analyze the landing page strategy of linear.app and craft a competitive positioning statement.'
        },
        {
            name: 'Task 3: Complex Campaign Generation',
            prompt: 'Build a comprehensive B2B Facebook ad campaign targeting SaaS founders, including competitor research, 3 ad copy variations, and API campaign setup.'
        }
    ];

    const results = [];

    for (const task of tasks) {
        console.log(`\n==================================================`);
        console.log(`▶ Running ${task.name}`);
        console.log(`  Prompt: "${task.prompt}"`);
        console.log(`==================================================\n`);

        const startTime = Date.now();

        // 1. Measure Decomposition
        console.log(`[1/2] Decomposing task...`);
        const decompStart = Date.now();
        const plan = await executor.decompose(task.prompt);
        const decompTime = Date.now() - decompStart;
        console.log(`      ✓ Decomposed into ${plan.steps.length} steps in ${decompTime}ms`);

        // 2. Measure Execution
        console.log(`\n[2/2] Executing steps...`);
        let totalToolsUsed = 0;
        let successfulSteps = 0;

        for (let i = 0; i < plan.steps.length; i++) {
            const step = plan.steps[i];
            console.log(`      → Step ${i + 1}: ${step.label}`);
            
            try {
                const result = await executor.execute(
                    step.instruction,
                    { userPrompt: task.prompt },
                    undefined,
                    (toolName) => process.stdout.write(`        [Tool] ${toolName}... `),
                    (toolName, result) => console.log(result.success ? '✓' : '✗')
                );
                
                totalToolsUsed += result.toolsUsed.length;
                successfulSteps++;
            } catch (err) {
                console.log(`        ❌ Step failed: ${err}`);
            }
        }

        const totalTime = Date.now() - startTime;
        console.log(`\n✅ ${task.name} Complete in ${totalTime}ms`);

        results.push({
            name: task.name,
            decompTimeMs: decompTime,
            totalTimeMs: totalTime,
            stepsCount: plan.steps.length,
            toolsUsedCount: totalToolsUsed,
            validationSuccess: `${successfulSteps}/${plan.steps.length}`
        });
    }

    console.log(`\n\n📊 Benchmark Results Summary`);
    console.table(results);
}

runBenchmark().catch(console.error);
