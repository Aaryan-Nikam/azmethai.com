import type { GatewayRequestHandler, GatewayRequestHandlers } from './server-methods/types.js';
import { WorkflowEngine } from '../engine/workflow-engine.js';
import { taskRouter } from '../routing/task-router.js';
import { streamingManager } from '../streaming/streaming-manager.js';
import { AzmethAgent } from '../engine/azmeth-agent.js';
import { AutoResearchEngine } from '../engine/autoresearch.js';
import { NodeValidator } from '../engine/node-validator.js';

// Tools
import { BrowserTool } from '../agents/tools/browser-tool.js';
import { WebSearchTool } from '../agents/tools/web-search-tool.js';
import { FacebookAPITool } from '../agents/tools/facebook-api-tool.js';
import { ImageGenTool } from '../agents/tools/image-gen-tool.js';
import { BashTool } from '../agents/tools/bash-tool.js';
import { buildWorkspaceSkillsPrompt } from '../agents/skills.js';

/**
 * WebSocket methods for Workspace UI — Functional Node System
 *
 * Uses WorkflowEngine to manage node trees. The agent creates Goal → Plan →
 * Work → Output nodes dynamically, each executing tools and getting validated.
 */

// Store engines per session so we can edit/retry/export later
const engines: Map<string, WorkflowEngine> = new Map();

function getOrCreateEngine(sessionId: string, broadcast: (ev: string, data: any) => void): WorkflowEngine {
    let engine = engines.get(sessionId);
    if (!engine) {
        engine = new WorkflowEngine(sessionId, broadcast);
        engines.set(sessionId, engine);
    }
    return engine;
}

// ─── Handlers ───────────────────────────────────────────────────────────────

const workspaceConnect: GatewayRequestHandler = async ({ params, respond }) => {
    const sessionId = (params.sessionId as string) || `session-${Date.now()}`;
    respond(true, { connected: true, sessionId, message: 'Workspace stream connected' });
};

const workspaceChat: GatewayRequestHandler = async ({ params, respond, context }) => {
    const sessionId = (params.sessionId as string) || 'default';
    const message = (params.message as string) || '';

    if (!message.trim()) {
        respond(true, { received: true, path: 'empty' });
        return;
    }

    respond(true, { received: true });

    const mode = (params.mode as string) || 'orchestration';
    const engine = getOrCreateEngine(sessionId, (ev, data) => context.broadcast(ev, data));

    // Fire-and-forget async workflow based on engine mode switch
    void runWorkflow(engine, sessionId, message, context, mode);
};

// Initialize the toolkit
const allTools = new Map();
allTools.set('browser', new BrowserTool());
allTools.set('web_search', new WebSearchTool());
allTools.set('facebook_api', new FacebookAPITool());
allTools.set('image_gen', new ImageGenTool());
allTools.set('bash', new BashTool());

async function runWorkflow(engine: WorkflowEngine, sessionId: string, message: string, context: any, mode: string = 'orchestration') {
    try {
        // Initialize the Azmeth Agent with guardrails
        const executor = new AzmethAgent(
            process.env.ANTHROPIC_API_KEY || 'dummy_key',
            allTools
        );
        
        const validator = new NodeValidator();
        const autoResearch = new AutoResearchEngine(
            executor,
            validator,
            process.env.ANTHROPIC_API_KEY || 'dummy_key'
        );

        // Load native skills
        const skillsPrompt = buildWorkspaceSkillsPrompt(process.cwd());
        const skillSysPrompt = `You have access to the following Native Skills:\n\n${skillsPrompt}`;

        // 1. GOAL NODE — user's request
        const goalNode = engine.createNode('goal', '🎯 Goal', message, null, { userMessage: message, mode });
        await engine.executeNode(goalNode.id, async () => ({
            content: message,
            output: { userMessage: message },
        }));

        if (mode === 'standard') {
            // "Standard Mode" -> Bypass orchestration graph, just run the direct Azmeth Agent execution
            streamingManager.streamThinking(sessionId, 'Running Standard Azmeth Agent...');
            
            const standardNode = engine.createNode('work', '🤖 Standard Agent', 'Executing simple loop...', goalNode.id, { message });
            await engine.executeNode(standardNode.id, async (node) => {
                const result = await executor.execute(message, {}, skillSysPrompt, 
                    (toolName, input) => {
                        engine['broadcast']('workspace.event', {
                            sessionId, nodeId: node.id, type: 'tool_activity', source: 'engine',
                            data: { toolName, status: 'running', input }, timestamp: Date.now()
                        });
                        streamingManager.streamToolUse(sessionId, toolName, input);
                    },
                    (toolName, toolResult) => {
                        engine['broadcast']('workspace.event', {
                            sessionId, nodeId: node.id, type: 'tool_activity', source: 'engine',
                            data: { toolName, status: 'complete', result: toolResult.success ? toolResult.data : { error: toolResult.error } }, timestamp: Date.now()
                        });
                        streamingManager.streamToolResult(sessionId, toolName, toolResult);
                    }
                );
                
                return {
                    content: result.content,
                    output: result.output,
                    toolsUsed: result.toolsUsed
                };
            });

            // Finish standard workflow
            const finalNodeId = standardNode.id;
            const finalOutput = engine.getNode(standardNode.id)?.output;
            const outputNode = engine.createNode('output', '📦 Result', 'Final Result', finalNodeId, finalOutput);
            await engine.executeNode(outputNode.id, async () => ({
               content: `# Direct Response\n${engine.getNode(standardNode.id)?.content}`,
               output: { deliverable: engine.getNode(standardNode.id)?.content, generatedBy: 'Azmeth' },
               toolsUsed: engine.getNode(standardNode.id)?.toolsUsed || []
            }));
            
            streamingManager.streamThinking(sessionId, 'Standard run complete!');
            context.broadcast('workspace.event', { sessionId, type: 'workflow_complete', source: 'engine', data: {}, timestamp: Date.now() });
            return;
        }

        // 2. Route task (still mockable logic for now, determines complexity)
        const path = await taskRouter.route(message);

        // 3. PLAN NODE — Real Agent decomposition
        streamingManager.streamThinking(sessionId, 'Decomposing task into actionable steps...');
        const planNode = engine.createNode('plan', '📋 Task Plan', `Analyzing: "${message}"`, goalNode.id, { path });

        await engine.executeNode(planNode.id, async () => {
            const decomposition = await executor.decompose(message);
            
            return {
                content: `**Strategy:** ${decomposition.reasoning}\n\n` +
                    decomposition.steps.map((s, i) => `${i + 1}. **${s.label}** — ${s.instruction}`).join('\n'),
                output: { steps: decomposition.steps, path, reasoning: decomposition.reasoning },
            };
        });

        const planOutput = engine.getNode(planNode.id)?.output;
        const steps = planOutput?.steps || [];
        
        if (steps.length === 0) {
             throw new Error("Agent failed to decompose the task into steps.");
        }

        // 4. WORK NODES — one per real step
        let previousNodeId = planNode.id;
        let previousOutput: any = { userMessage: message };
        let allToolsUsed: string[] = [];

        for (const step of steps) {
            streamingManager.streamThinking(sessionId, `Executing step: ${step.label}...`);
            
            const nodeType = step.nodeType || 'work';
            const workNode = engine.createNode(
                nodeType as any,
                step.label,
                step.instruction,
                previousNodeId,
                { ...previousOutput, stepInstruction: step.instruction }
            );

            // Give it a generic name if we aren't using the expert registry yet
            workNode.agent = 'Azmeth Core';

            await engine.executeNode(workNode.id, async (node) => {
                // Execute using the AutoResearch reflection loop
                const result = await autoResearch.executeWithReflection(
                    step.instruction,
                    previousOutput,
                    skillSysPrompt, // inject skills into system prompt
                    (toolName, input) => {
                        // On tool use
                        engine['broadcast']('workspace.event', {
                            sessionId,
                            nodeId: node.id,
                            type: 'tool_activity',
                            source: 'engine',
                            data: { toolName, status: 'running', input },
                            timestamp: Date.now()
                        });
                        streamingManager.streamToolUse(sessionId, toolName, input);
                    },
                    (toolName, toolResult) => {
                        // On tool result
                        engine['broadcast']('workspace.event', {
                            sessionId,
                            nodeId: node.id,
                            type: 'tool_activity',
                            source: 'engine',
                            data: { toolName, status: 'complete', result: toolResult.success ? toolResult.data : { error: toolResult.error } },
                            timestamp: Date.now()
                        });
                        streamingManager.streamToolResult(sessionId, toolName, toolResult);
                    },
                    2 // Allow up to 2 reflections/mutations
                );
                
                allToolsUsed.push(...result.finalOutput.toolsUsed);
                
                return {
                    content: result.finalOutput.content + (result.wasRefined ? "\n\n*(✨ Auto-refined after self-reflection)*" : ""),
                    output: result.finalOutput.output,
                    toolsUsed: result.finalOutput.toolsUsed
                };
            });

            const executed = engine.getNode(workNode.id);
            if (executed?.status === 'failed') {
                // Workflow paused due to failure — stop creating more nodes
                return;
            }

            previousOutput = executed?.output || previousOutput;
            previousNodeId = workNode.id;
        }

        // 5. OUTPUT NODE — final deliverable
        streamingManager.streamThinking(sessionId, 'Compiling final output...');
        const outputNode = engine.createNode('output', '📦 Deliverable', 'Compiling final output...', previousNodeId, previousOutput);
        
        await engine.executeNode(outputNode.id, async () => {
            const allNodes = engine.getAllNodes().filter(n => ['work', 'browser', 'api'].includes(n.type));
            const sections = allNodes
                .filter(n => n.status === 'complete')
                .map(n => `### ${n.label}\n${n.content}`)
                .join('\n\n---\n\n');

            return {
                content: `# Results: ${message}\n\n${sections}\n\n---\n_Generated by Azmeth Agent Engine_`,
                output: { deliverable: sections, generatedBy: 'Azmeth' },
                toolsUsed: [...new Set(allToolsUsed)],
            };
        });

        // 6. WORKFLOW COMPLETE
        streamingManager.streamThinking(sessionId, 'Workflow complete!');
        context.broadcast('workspace.event', {
            sessionId,
            type: 'workflow_complete',
            source: 'engine',
            data: {},
            timestamp: Date.now()
        });

    } catch (err) {
        console.error('[Workflow] Error executing workflow:', err);
        context.broadcast('workspace.event', {
            sessionId,
            type: 'workflow_error',
            source: 'engine',
            data: { error: String(err) },
            timestamp: Date.now()
        });
    }
}

// Mock helpers removed as they are now handled by AgentExecutor natively

// ─── Node Action Handlers ── ─────────────────────────────────────────────

const workspaceEditNode: GatewayRequestHandler = async ({ params, respond, context }) => {
    const sessionId = (params.sessionId as string) || 'default';
    const nodeId = params.nodeId as string;
    const newContent = params.content as string;

    const engine = engines.get(sessionId);
    if (!engine || !nodeId) {
        respond(false, { error: 'Engine or node not found' });
        return;
    }

    respond(true, { editing: true, nodeId });

    void engine.editNode(nodeId, newContent, async (node) => {
        await delay(500);
        return {
            content: newContent,
            output: { edited: true, content: newContent },
            toolsUsed: node.toolsUsed,
        };
    });
};

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const workspaceRetryNode: GatewayRequestHandler = async ({ params, respond, context }) => {
    const sessionId = (params.sessionId as string) || 'default';
    const nodeId = params.nodeId as string;

    const engine = engines.get(sessionId);
    if (!engine || !nodeId) {
        respond(false, { error: 'Engine or node not found' });
        return;
    }

    const node = engine.getNode(nodeId);
    if (!node) {
        respond(false, { error: 'Node not found' });
        return;
    }

    node.retryCount = 0;
    node.status = 'idle';
    respond(true, { retrying: true, nodeId });

    void engine.executeNode(nodeId, async (node) => {
        const executor = new AzmethAgent(
            process.env.ANTHROPIC_API_KEY || 'dummy_key',
            allTools
        );
        
        // Use the content block as the instruction for the retry
        const instruction = node.content.split('** — ')[1] || node.content;
        const skillsPrompt = buildWorkspaceSkillsPrompt(process.cwd());

        const result = await executor.execute(
            instruction,
            node.input,
            `You have access to the following Native Skills:\n\n${skillsPrompt}`,
            (toolName, input) => {
                engine['broadcast']('workspace.event', {
                    sessionId, nodeId: node.id, type: 'tool_activity', source: 'engine',
                    data: { toolName, status: 'running', input }, timestamp: Date.now()
                });
            },
            (toolName, toolResult) => {
                engine['broadcast']('workspace.event', {
                    sessionId, nodeId: node.id, type: 'tool_activity', source: 'engine',
                    data: { toolName, status: 'complete', result: toolResult.success ? toolResult.data : { error: toolResult.error } }, timestamp: Date.now()
                });
            }
        );
        
        return {
            content: result.content,
            output: result.output,
            toolsUsed: result.toolsUsed,
        };
    });
};

const workspaceApproveNode: GatewayRequestHandler = async ({ params, respond }) => {
    const sessionId = (params.sessionId as string) || 'default';
    const nodeId = params.nodeId as string;

    const engine = engines.get(sessionId);
    if (!engine || !nodeId) {
        respond(false, { error: 'Engine or node not found' });
        return;
    }

    await engine.approveNode(nodeId);
    respond(true, { approved: true, nodeId });
};

const workspaceExportNode: GatewayRequestHandler = async ({ params, respond }) => {
    const sessionId = (params.sessionId as string) || 'default';
    const nodeId = params.nodeId as string;
    const format = (params.format as string) || 'json';

    const engine = engines.get(sessionId);
    if (!engine || !nodeId) {
        respond(false, { error: 'Engine or node not found' });
        return;
    }

    const result = engine.exportNode(nodeId, format as any);
    respond(true, { exported: true, nodeId, result });
};

const workspaceInterrupt: GatewayRequestHandler = async ({ params, respond }) => {
    respond(true, { interrupted: true, feedback: (params.feedback as string) || '' });
};

const workspaceGetState: GatewayRequestHandler = async ({ params, respond }) => {
    const sessionId = (params.sessionId as string) || 'default';
    const engine = engines.get(sessionId);
    const nodes = engine?.getAllNodes() || [];
    respond(true, { sessionId, agentStatus: 'idle', nodes: nodes.length });
};

export const workspaceWebSocketMethods: GatewayRequestHandlers = {
    'workspace.connect': workspaceConnect,
    'workspace.chat': workspaceChat,
    'workspace.editNode': workspaceEditNode,
    'workspace.retryNode': workspaceRetryNode,
    'workspace.approveNode': workspaceApproveNode,
    'workspace.exportNode': workspaceExportNode,
    'workspace.interrupt': workspaceInterrupt,
    'workspace.getState': workspaceGetState,
};

export function handleWorkspaceDisconnect(): void { }
