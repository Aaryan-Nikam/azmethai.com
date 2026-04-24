import 'dotenv/config';
import { ToolBridge } from './business/tools/ToolBridge.js';
import * as readline from 'readline';

const toolBridge = new ToolBridge();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const AZURE_KEY = process.env.AZURE_AI_API_KEY;
const AZURE_ENDPOINT =
    process.env.AZURE_AI_CHAT_COMPLETIONS_ENDPOINT ??
    'https://nikam-mn2vv7tk-eastus2.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview';

if (!AZURE_KEY) {
    throw new Error('Missing AZURE_AI_API_KEY (set it in your shell or an .env file).');
}

async function runRawAgentTest() {
    console.log('\n==================================================');
    console.log('🦾 Mantis AI Agent - RAW CAPABILITY TEST ("Uncaged")');
    console.log('🤖 Model: Kimi (via Azure AI Studio)');
    console.log('==================================================\n');

    // Role definitions to simulate an Expert Agent
    const MOCK_ROLE_ID = "role_test_expert";
    const MOCK_TENANT_ID = "tenant_test";
    
    // Dynamically retrieve all Mantis-configured tools (Legal + Core + n8n hooks)
    const availableTools = toolBridge.getDefinitions(MOCK_ROLE_ID);
    
    console.log(`✅ Loaded ${availableTools.length} total tools from ToolBridge.`);

    // Keep conversation history alive across loops!
    let messages: any[] = [
        { role: 'system', content: 'You are the Mantis Expert AI Employee. Use your tools to fulfill the user request. You might need to draft documents or send emails.' }
    ];

    const askQuestion = () => {
        rl.question('\n💬 Give power test prompt (or "exit"):\n> ', async (input) => {
            if (input.toLowerCase() === 'exit') {
                rl.close();
                process.exit(0);
            }

            if (!input.trim()) return askQuestion();

            console.log('\n[1] 🧠 Agent Thinking...');

            try {
                // Append the user's new message to the history
                messages.push({ role: 'user', content: input });

                // Convert Anthropic tool structure to OpenAI tool structure dynamically
                const openAITools = availableTools.map(t => ({
                    type: 'function',
                    function: {
                        name: t.name,
                        description: t.description,
                        parameters: (t as any).input_schema
                    }
                }));

                const reqBody = {
                    model: 'Kimi-K2.5',
                    messages,
                    tools: openAITools,
                    tool_choice: 'auto'
                };

                const res = await fetch(AZURE_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': AZURE_KEY
                    },
                    body: JSON.stringify(reqBody)
                });

                if (!res.ok) {
                    throw new Error(`Azure API Error: ${res.status} ${await res.text()}`);
                }

                const response = await res.json();
                const responseMessage = response.choices[0].message;

                // Save the assistant's response to history
                messages.push(responseMessage);

                console.log(`\n[2] 🎯 Agent Decision:`);
                
                if (responseMessage.content) {
                    console.log(`   📝 "${responseMessage.content}"`);
                }
                
                if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                    for (const toolCall of responseMessage.tool_calls) {
                        const name = toolCall.function.name;
                        const args = JSON.parse(toolCall.function.arguments);
                        console.log(`\n   🛠️ INITIALIZING TOOL: ${name}`);
                        console.log(`       Input: ${JSON.stringify(args, null, 2)}`);
                        
                        // Execute tool uncaged (bypassing Governance)
                        console.log('\n[3] ⚡ Executing Tool Bridge Forwarding (No Governance)...');
                        const result = await toolBridge.execute(
                            name, 
                            args, 
                            MOCK_ROLE_ID, 
                            MOCK_TENANT_ID
                        );

                        console.log(`\n   ✅ TOOL RESULT:`);
                        console.log(result);

                        // Save the tool result to the history so the AI knows what happened!
                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            name: name,
                            content: JSON.stringify(result)
                        });
                    }
                    
                    // We need to trigger the AI again so it can analyze the tool result!
                    console.log('\n[4] 🧠 Agent Analyzing Tool Results...');
                    const followUpReqBody = {
                        model: 'Kimi-K2.5',
                        messages,
                        tools: openAITools,
                        tool_choice: 'auto'
                    };
                    
                    const followUpRes = await fetch(AZURE_ENDPOINT, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'api-key': AZURE_KEY
                        },
                        body: JSON.stringify(followUpReqBody)
                    });
                    
                    if (followUpRes.ok) {
                        const finalResponse = await followUpRes.json();
                        const finalMsg = finalResponse.choices[0].message;
                        messages.push(finalMsg);
                        if (finalMsg.content) console.log(`   📝 "${finalMsg.content}"`);
                    }
                } else if (!responseMessage.content) {
                     console.log(`   📝 (No output or tool calls)`);
                }
                
                console.log(`\n🎉 Raw iteration complete!`);
            } catch (err) {
                console.error(`\n❌ Error during execution:`, err);
            }

            askQuestion();
        });
    };

    askQuestion();
}

runRawAgentTest().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
