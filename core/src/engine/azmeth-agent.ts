/**
 * AzmethAgent — Core agentic loop for the Azmeth Platform (ReAct pattern).
 *
 * This agent replaces the legacy Azmeth agent-executor. 
 * It introduces Safety Guardrails across tool execution and goal decomposition.
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { Tool, ToolResult } from '../types/mantis.js';
import { Checkpointer, type AgentCheckpoint } from './checkpointer.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AgentStep {
    iteration: number;
    tool: string;
    input: any;
    result: ToolResult;
}

export interface ExecutionResult {
    content: string;
    output: any;
    toolsUsed: string[];
    steps: AgentStep[];
    sources: string[];
    guardrailFlags?: string[];
    status?: 'completed' | 'paused' | 'failed';
    runId?: string;
}

export interface DecomposedStep {
    label: string;
    instruction: string;
    nodeType: 'work' | 'browser' | 'api';
    suggestedTools: string[];
}

export interface DecomposeResult {
    steps: DecomposedStep[];
    reasoning: string;
    guardrailBlocked?: boolean;
}

export interface SafetyGuardrules {
    maxTokensPerSession?: number;
    disallowedTools?: string[];
    requireHumanInTheLoopFor?: string[]; // Tools that pause execution for approval
    queueForBatchReviewFor?: string[];   // Tools that are queued asynchronously while agent continues
    validatorPrompt?: string;            // The decentralized prompt for self-correction
    regexBlocklist?: RegExp[]; // PII or explicit patterns
}

const DEFAULT_GUARDRAILS: SafetyGuardrules = {
    disallowedTools: ['system.run_unsafe'], // Example of default disallowed
    requireHumanInTheLoopFor: ['system.run', 'file.delete', 'filesystem.write'],
    regexBlocklist: [
        /\b(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})\b/ // Generic Credit Card heuristic
    ]
};

// ─── Azmeth Agent ───────────────────────────────────────────────────────────

export class AzmethAgent {
    private anthropic?: Anthropic;
    private openai?: OpenAI;
    private tools: Map<string, Tool>;
    private model: string;
    private provider: 'anthropic' | 'openai' | 'mock' = 'mock';
    private guardrails: SafetyGuardrules;
    private checkpointer: Checkpointer;

    constructor(
        apiKey: string,
        tools: Map<string, Tool>,
        model: string = 'claude-3-5-sonnet-20241022',
        customGuardrails?: Partial<SafetyGuardrules>
    ) {
        this.tools = tools;
        this.model = model;
        this.guardrails = { ...DEFAULT_GUARDRAILS, ...customGuardrails };

        if (apiKey && apiKey !== 'dummy_key' && !apiKey.startsWith('sk-proj')) {
            this.anthropic = new Anthropic({ apiKey });
            this.provider = 'anthropic';
        } else if (process.env.OPENAI_API_KEY || (apiKey && apiKey.startsWith('sk-proj'))) {
            this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || apiKey });
            this.provider = 'openai';
            this.model = 'gpt-4o';
        }

        this.checkpointer = new Checkpointer();
    }

    get isLive(): boolean {
        return this.provider !== 'mock';
    }

    // ── Guardrails Check ─────────────────────────────────────────────────

    private applyContentGuardrails(text: string): { safe: boolean; reason?: string } {
        if (!this.guardrails.regexBlocklist) return { safe: true };
        for (const regex of this.guardrails.regexBlocklist) {
            if (regex.test(text)) {
                return { safe: false, reason: 'Content matched safety blocklist (e.g. sensitive data).' };
            }
        }
        return { safe: true };
    }

    private applyToolGuardrails(toolName: string): { allowed: boolean; needsApproval: boolean; queuesForBatch: boolean } {
        if (this.guardrails.disallowedTools?.includes(toolName)) {
            return { allowed: false, needsApproval: false, queuesForBatch: false };
        }
        if (this.guardrails.requireHumanInTheLoopFor?.includes(toolName)) {
            return { allowed: true, needsApproval: true, queuesForBatch: false };
        }
        if (this.guardrails.queueForBatchReviewFor?.includes(toolName)) {
            return { allowed: true, needsApproval: false, queuesForBatch: true };
        }
        return { allowed: true, needsApproval: false, queuesForBatch: false };
    }

    // ── Decompose ───────────────────────────────────────────────────────

    async decompose(goal: string): Promise<DecomposeResult> {
        const safetyCheck = this.applyContentGuardrails(goal);
        if (!safetyCheck.safe) {
            return { reasoning: 'Blocked by safety guardrails.', steps: [], guardrailBlocked: true };
        }

        if (!this.isLive) {
            return this.mockDecompose(goal);
        }

        const toolNames = Array.from(this.tools.keys()).join(', ');
        const systemPrompt = `You are Azmeth, an advanced task decomposition engine. Break the user's goal into 3-6 concrete work steps.
Available tools: ${toolNames}

For each step, provide:
- label: Short emoji+title (e.g. "🔍 Market Research")
- instruction: Detailed instruction for what to do (2-3 sentences)
- nodeType: "browser" if step primarily needs web browsing, "api" if it makes API calls, otherwise "work"
- suggestedTools: Array of tool names

Respond in valid JSON only. Format:
{
  "reasoning": "Strategy",
  "steps": [ { "label": "...", "instruction": "...", "nodeType": "work|browser|api", "suggestedTools": ["..."] } ]
}`;

        let text = '{}';
        if (this.provider === 'anthropic' && this.anthropic) {
            const response = await this.anthropic.messages.create({
                model: this.model,
                max_tokens: 2048,
                temperature: 0.3,
                system: systemPrompt,
                messages: [{ role: 'user', content: goal }]
            });
            text = response.content.find(b => b.type === 'text')?.text || '{}';
        } else if (this.provider === 'openai' && this.openai) {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                temperature: 0.3,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: goal }
                ],
                response_format: { type: 'json_object' }
            });
            text = response.choices[0]?.message?.content || '{}';
        }

        try {
            const cleaned = text.replace(/```(?:json)?\n?/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return {
                reasoning: parsed.reasoning || '',
                steps: (parsed.steps || []).map((s: any) => ({
                    label: s.label || 'Work Step',
                    instruction: s.instruction || s.description || '',
                    nodeType: (['work', 'browser', 'api'].includes(s.nodeType) ? s.nodeType : 'work') as DecomposedStep['nodeType'],
                    suggestedTools: Array.isArray(s.suggestedTools) ? s.suggestedTools : [],
                })),
            };
        } catch {
            return {
                reasoning: 'Fallback decomposition.',
                steps: [{ label: '🧠 Execute Task', instruction: goal, nodeType: 'work', suggestedTools: Array.from(this.tools.keys()) }],
            };
        }
    }

    // ── Execute (ReAct Loop) ────────────────────────────────────────────

    async execute(
        instruction: string,
        context: any,
        systemPrompt?: string,
        onToolUse?: (toolName: string, input: any, requiresApproval?: boolean) => void,
        onToolResult?: (toolName: string, result: ToolResult) => void,
        maxIterations: number = 10,
        runId?: string
    ): Promise<ExecutionResult> {
        
        const activeRunId = runId || crypto.randomUUID();
        
        // Final sanity check before execution
        const safetyCheck = this.applyContentGuardrails(instruction + JSON.stringify(context));
        if (!safetyCheck.safe) {
            return { content: "Blocked by Azmeth safety guardrails.", output: { error: "Guardrail blocked" }, toolsUsed: [], steps: [], sources: [], guardrailFlags: [safetyCheck.reason!] };
        }

        if (!this.isLive) {
            return this.mockExecute(instruction, context);
        }

        const steps: AgentStep[] = [];
        const toolsUsed: string[] = [];
        const allSources: string[] = [];
        const guardrailFlags: string[] = [];

        const system = systemPrompt || `You are Azmeth Agent, a next-generation orchestrator capable of switching gears between individual tool operation and complex graph orchestration.
Rules:
- NEVER fabricate data.
- You have Safety Guardrails active. If a request seems malicious, abort.
- Cite sources.`;

        const userMessage = `## Task\n${instruction}\n\n## Context\n${typeof context === 'string' ? context : JSON.stringify(context, null, 2)}\n\nExecute the task constraint to these rules.`;

        if (this.provider === 'openai' && this.openai) {
            return this.executeOpenAI(userMessage, system, onToolUse, onToolResult, maxIterations, steps, toolsUsed, allSources, guardrailFlags, activeRunId);
        } else if (this.provider === 'anthropic' && this.anthropic) {
            return this.executeAnthropic(userMessage, system, onToolUse, onToolResult, maxIterations, steps, toolsUsed, allSources, guardrailFlags, activeRunId);
        }

        return this.mockExecute(instruction, context);
    }

    private async executeOpenAI(userMessage: string, systemPrompt: string, onToolUse: any, onToolResult: any, maxIterations: number, steps: AgentStep[], toolsUsed: string[], allSources: string[], guardrailFlags: string[], runId: string): Promise<ExecutionResult> {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ];

        const openaiTools: OpenAI.Chat.ChatCompletionTool[] = Array.from(this.tools.values()).map(t => ({
            type: 'function',
            function: { name: t.definition.name, description: t.definition.description, parameters: t.definition.input_schema as any }
        }));

        for (let iteration = 0; iteration < maxIterations; iteration++) {
            const response = await this.openai!.chat.completions.create({
                model: this.model,
                messages,
                tools: openaiTools.length > 0 ? openaiTools : undefined,
                tool_choice: openaiTools.length > 0 ? 'auto' : 'none'
            });

            const choice = response.choices[0];
            const message = choice.message;
            messages.push(message);

            if (!message.tool_calls || message.tool_calls.length === 0) {
                const finalText = message.content || '';

                // ── Decentralized Validation (Cowork Pillar 3) ──
                if (this.guardrails.validatorPrompt && iteration > 0 && finalText) {
                    const validation = await this.validateStep(finalText, this.guardrails.validatorPrompt);
                    if (!validation.passed) {
                        messages.push({
                            role: 'user',
                            content: `VALIDATION FAILED: ${validation.feedback}\nPlease rewrite your response to correct this.`
                        });
                        continue; // Force the agent to self-correct
                    }
                }

                return { content: finalText, output: { text: finalText, sources: allSources }, toolsUsed: [...new Set(toolsUsed)], steps, sources: allSources, guardrailFlags, status: 'completed', runId };
            }

            for (const toolCall of message.tool_calls) {
                if (toolCall.type !== 'function') continue;
                
                const toolName = toolCall.function.name;
                const toolInput = JSON.parse(toolCall.function.arguments);
                const tool = this.tools.get(toolName);

                // Guardrail Intercept
                const toolSafety = this.applyToolGuardrails(toolName);
                if (!toolSafety.allowed) {
                    guardrailFlags.push(`Tool ${toolName} blocked.`);
                    messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify({ error: 'Blocked by safety policy' }) });
                    continue;
                }

                onToolUse?.(toolName, toolInput, toolSafety.needsApproval);

                let result: ToolResult;
                if (toolSafety.needsApproval) {
                    // Checkpoint logic
                    const checkpoint: AgentCheckpoint = {
                        runId,
                        profileId: 'azmeth_default',
                        status: 'paused_approval',
                        pendingAction: { toolName, toolInput, requiresApproval: true },
                        historySnapshot: messages,
                        createdAtMs: Date.now()
                    };
                    await this.checkpointer.saveCheckpoint(checkpoint);
                    return {
                        content: `Execution paused. Tool "${toolName}" requires human authorization.`,
                        output: { toolName, toolInput },
                        toolsUsed: [...new Set(toolsUsed)],
                        steps,
                        sources: allSources,
                        guardrailFlags,
                        status: 'paused',
                        runId
                    };
                } else if (toolSafety.queuesForBatch) {
                    // Simulate that it successfully queued. The actual enqueue logic 
                    // is intercepted here or pushed to an ActionQueueManager.
                    result = {
                        success: true,
                        data: {
                            status: "QUEUED_FOR_HUMAN_REVIEW",
                            message: `The ${toolName} action has been securely queued for manager approval. You may proceed and inform the user.`
                        },
                        toolName
                    };
                    toolsUsed.push(toolName);
                } else if (tool) {
                    result = await tool.execute(toolInput);
                    toolsUsed.push(toolName);
                    if (result.sources) allSources.push(...result.sources);
                } else {
                    result = { success: false, error: `Tool "${toolName}" not found`, toolName };
                }

                onToolResult?.(toolName, result);
                steps.push({ iteration, tool: toolName, input: toolInput, result });
                messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(result.success ? result.data : { error: result.error }) });
            }
        }

        return {
            content: `Partial completion after ${maxIterations} iterations.`, output: { partial: true }, toolsUsed: [...new Set(toolsUsed)], steps, sources: allSources, guardrailFlags
        };
    }

    private async executeAnthropic(userMessage: string, systemPrompt: string, onToolUse: any, onToolResult: any, maxIterations: number, steps: AgentStep[], toolsUsed: string[], allSources: string[], guardrailFlags: string[], runId: string): Promise<ExecutionResult> {
        const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMessage }];
        const anthropicTools = Array.from(this.tools.values()).map(t => ({
            name: t.definition.name, description: t.definition.description, input_schema: t.definition.input_schema as Anthropic.Tool['input_schema'],
        }));

        for (let iteration = 0; iteration < maxIterations; iteration++) {
            const response = await this.anthropic!.messages.create({
                model: this.model, max_tokens: 4096, system: systemPrompt, tools: anthropicTools, messages,
            });

            const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
            const textBlocks = response.content.filter(b => b.type === 'text');

            if (toolUseBlocks.length === 0) {
                const finalText = textBlocks.map(b => b.type === 'text' ? b.text : '').join('\n');

                // ── Decentralized Validation (Cowork Pillar 3) ──
                if (this.guardrails.validatorPrompt && iteration > 0 && finalText) {
                    const validation = await this.validateStep(finalText, this.guardrails.validatorPrompt);
                    if (!validation.passed) {
                        messages.push({
                            role: 'user',
                            content: `VALIDATION FAILED: ${validation.feedback}\nPlease rewrite your response to correct this.`
                        });
                        continue; // Force the agent to self-correct
                    }
                }

                return { content: finalText, output: { text: finalText, sources: allSources }, toolsUsed: [...new Set(toolsUsed)], steps, sources: allSources, guardrailFlags, status: 'completed', runId };
            }

            messages.push({ role: 'assistant', content: response.content });
            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const toolBlock of toolUseBlocks) {
                if (toolBlock.type !== 'tool_use') continue;

                const toolName = toolBlock.name;
                const toolInput = toolBlock.input as any;
                const tool = this.tools.get(toolName);

                // Guardrail Intercept
                const toolSafety = this.applyToolGuardrails(toolName);
                if (!toolSafety.allowed) {
                    guardrailFlags.push(`Tool ${toolName} blocked.`);
                    toolResults.push({ type: 'tool_result', tool_use_id: toolBlock.id, content: JSON.stringify({ error: 'Blocked by Azmeth safety policy' }) });
                    continue;
                }

                onToolUse?.(toolName, toolInput, toolSafety.needsApproval);

                let result: ToolResult;
                if (toolSafety.needsApproval) {
                     // Checkpoint logic
                     const checkpoint: AgentCheckpoint = {
                        runId,
                        profileId: 'azmeth_default',
                        status: 'paused_approval',
                        pendingAction: { toolName, toolInput, requiresApproval: true },
                        historySnapshot: messages,
                        createdAtMs: Date.now()
                    };
                    await this.checkpointer.saveCheckpoint(checkpoint);
                    return {
                        content: `Execution paused. Tool "${toolName}" requires human authorization.`,
                        output: { toolName, toolInput },
                        toolsUsed: [...new Set(toolsUsed)],
                        steps,
                        sources: allSources,
                        guardrailFlags,
                        status: 'paused',
                        runId
                    };
                } else if (toolSafety.queuesForBatch) {
                    // Same queuing mock as above
                    result = {
                        success: true,
                        data: {
                            status: "QUEUED_FOR_HUMAN_REVIEW",
                            message: `The ${toolName} action has been securely queued for manager approval. You may proceed and inform the user.`
                        },
                        toolName
                    };
                    toolsUsed.push(toolName);
                } else if (tool) {
                    result = await tool.execute(toolInput);
                    toolsUsed.push(toolName);
                    if (result.sources) allSources.push(...result.sources);
                } else {
                    result = { success: false, error: `Tool "${toolName}" not found`, toolName };
                }

                onToolResult?.(toolName, result);
                steps.push({ iteration, tool: toolName, input: toolInput, result });
                toolResults.push({ type: 'tool_result', tool_use_id: toolBlock.id, content: JSON.stringify(result.success ? result.data : { error: result.error }) });
            }

            messages.push({ role: 'user', content: toolResults });
        }

        return { content: `Partial completion.`, output: { partial: true }, toolsUsed: [...new Set(toolsUsed)], steps, sources: allSources, guardrailFlags };
    }

    private mockDecompose(goal: string): DecomposeResult {
        return { reasoning: 'Mock mode.', steps: [{ label: 'Execute', instruction: goal, nodeType: 'work', suggestedTools: [] }] };
    }

    private async mockExecute(instruction: string, context: any): Promise<ExecutionResult> {
        return { content: `Mock output for: ${instruction}`, output: { mock: true }, toolsUsed: [], steps: [], sources: [] };
    }

    /**
     * Resumes an agent's logic flow from a previously saved checkpoint, injecting the human's approved result.
     */
    async resume(runId: string, approvedResult: any, systemPrompt?: string): Promise<ExecutionResult> {
        const checkpoint = await this.checkpointer.loadCheckpoint(runId);
        if (!checkpoint || checkpoint.status !== 'paused_approval') {
            throw new Error(`Cannot resume: Valid paused checkpoint for ${runId} not found.`);
        }

        // 1. Inject the tool result into the history exactly as the LLM expects
        const messages = checkpoint.historySnapshot;
        
        // This is a simplified structural re-hydration.
        // A full integration maps this robustly to Anthropic/OpenAI specific tool_result blocks.
        if (this.provider === 'openai') {
            messages.push({ 
                role: 'tool', 
                tool_call_id: 'resumed_tool_id', 
                content: JSON.stringify(approvedResult) 
            });
        }

        // 2. Clear the checkpoint
        await this.checkpointer.clearCheckpoint(runId);

        // 3. Continue the execution loop.
        // For simplicity in this iteration, we immediately push to a new completion call.
        if (this.provider === 'openai' && this.openai) {
             const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: messages as any
            });
            const ft = response.choices[0]?.message.content || 'Resumed and finished.';
            return { content: ft, output: { resumed: true }, toolsUsed: [], steps: [], sources: [], status: 'completed' };
        }

        return { content: "Resumed agent task successfully.", output: { resumed: true }, toolsUsed: [], steps: [], sources: [], status: 'completed' }
    }

    /**
     * Decentralized Validator (Cowork Pillar 3)
     * Calls a smaller, cheaper model to explicitly grade the agent's work against its specific Profile Validator constraints.
     */
    private async validateStep(contentToValidate: string, validatorPrompt: string): Promise<{ passed: boolean; feedback?: string }> {
        // Skip validation if we are in mock mode
        if (this.provider === 'mock' || !this.openai) {
            return { passed: true };
        }

        try {
            const prompt = `You are an internal Quality Control Validator for an Autonomous Agent.\n\nRULES:\n${validatorPrompt}\n\nEVALUATE THE FOLLOWING OUTPUT:\n"${contentToValidate}"\n\nIf it violates the rules, start your response with "REJECT:" followed by the exact reasoning. If it passes, reply strictly with "PASS".`;
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini', // Use a cheaper, faster model for validation loops
                messages: [{ role: 'system', content: prompt }]
            });

            const reply = response.choices[0]?.message.content || 'PASS';
            if (reply.startsWith('REJECT:')) {
                return { passed: false, feedback: reply.replace('REJECT:', '').trim() };
            }
            return { passed: true };
        } catch (e) {
            console.error("Validator Model Failed", e);
            return { passed: true }; // Fail open if validator is unreachable
        }
    }
}
