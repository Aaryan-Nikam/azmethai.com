import Anthropic from '@anthropic-ai/sdk';
import { AzmethAgent, ExecutionResult } from './azmeth-agent.js';
import { NodeValidator, ValidationResult } from './node-validator.js';
import { ExperienceStore, Experience } from '../memory/experience-store.js';

export interface AutoResearchResult {
    finalOutput: ExecutionResult;
    validation: ValidationResult;
    attempts: number;
    wasRefined: boolean;
}

/**
 * AutoResearchEngine - The autonomous self-improvement loop.
 * 
 * Based on Andrej Karpathy's AutoResearch concept:
 * 1. Run inference (AgentExecutor)
 * 2. Evaluate metrics (NodeValidator)
 * 3. Hypothesis generation (Claude reflects on failure and suggests fixes)
 * 4. Mutate & Retry (Rerun execution with mutated instructions)
 * 5. Memorize (Store success/failure in episodic memory)
 */
export class AutoResearchEngine {
    private anthropic: Anthropic;
    private memory: ExperienceStore;

    constructor(
        private executor: AzmethAgent,
        private validator: NodeValidator,
        apiKey: string = process.env.ANTHROPIC_API_KEY || 'dummy_key'
    ) {
        this.anthropic = new Anthropic({ apiKey });
        this.memory = new ExperienceStore();
    }

    /**
     * Determine if a validation result is considered a "Pass".
     * A pass requires accurate data, no hallucinations, and safety.
     * Sources are required only if research tools were used.
     */
    private isPassing(v: ValidationResult): boolean {
        return v.dataAccurate && v.noHallucinations && v.safetyPassed && v.sourcesCited;
    }

    /**
     * Executes a task with an autonomous reflection loop.
     * If validation fails, it generates a hypothesis on why, mutates the instruction,
     * and retries up to `maxRetries` times.
     */
    async executeWithReflection(
        instruction: string,
        context: any,
        systemPrompt?: string,
        onToolUse?: (toolName: string, input: any) => void,
        onToolResult?: (toolName: string, result: any) => void,
        maxRetries: number = 2
    ): Promise<AutoResearchResult> {
        
        // 1. Pull relevant memory
        const memoryContext = this.memory.formatLessonsForPrompt(instruction);
        let currentInstruction = instruction + (memoryContext ? `\n\n${memoryContext}` : '');
        let currentSystemContext = systemPrompt;

        let attempt = 1;
        let lastResult: ExecutionResult | null = null;
        let lastValidation: ValidationResult | null = null;
        let wasRefined = false;

        // AutoResearch Loop
        while (attempt <= maxRetries + 1) {
            console.log(`\n[AutoResearch] Attempt ${attempt}/${maxRetries + 1} for: ${instruction.substring(0, 50)}...`);

            // Execute
            const executionResult = await this.executor.execute(
                currentInstruction,
                context,
                currentSystemContext,
                onToolUse,
                onToolResult
            );

            // Mock nodes (without a real LLM) bypass rigorous validation in this setup
            if (!this.executor.isLive) {
                return {
                    finalOutput: executionResult,
                    validation: { sourcesCited: true, dataAccurate: true, noHallucinations: true, safetyPassed: true },
                    attempts: 1,
                    wasRefined: false
                };
            }

            // Evaluate
            const validation = await this.validator.validate({
                id: 'temp', type: 'work', label: 'temp', content: executionResult.content,
                output: executionResult.output, status: 'complete', toolsUsed: executionResult.toolsUsed,
                input: {}, parentId: null, children: [], validation: null, data: {}, agent: 'System', 
                createdAt: Date.now(), updatedAt: Date.now()
            } as any as import('./workflow-engine.js').WorkflowNode);

            lastResult = executionResult;
            lastValidation = validation;

            if (this.isPassing(validation)) {
                console.log(`[AutoResearch] Validation passed! Recording success to memory.`);
                this.recordWin(instruction, executionResult);
                
                return {
                    finalOutput: executionResult,
                    validation,
                    attempts: attempt,
                    wasRefined
                };
            }

            console.log(`[AutoResearch] Validation failed on Attempt ${attempt}. Reflecting...`, validation);

            if (attempt <= maxRetries) {
                // Generate Hypothesis & Mutate
                wasRefined = true;
                const { refinedInstruction, reflection } = await this.reflectAndMutate(
                    instruction,
                    executionResult.content,
                    validation
                );

                console.log(`[AutoResearch] Hypothesis: ${reflection}`);
                console.log(`[AutoResearch] Mutating instruction and retrying...`);
                
                // Keep the original instruction as the core, but append the urgent corrections
                currentInstruction = `${instruction}\n\nURGENT CORRECTION FROM PREVIOUS ATTEMPT:\n${refinedInstruction}`;
            }

            attempt++;
        }

        // Loop exhausted without perfect validation. Log the failure.
        console.log(`[AutoResearch] Max retries exhausted. Recording failure to memory.`);
        if (lastResult && lastValidation) {
            this.recordFailure(instruction, lastResult, lastValidation);
        }

        return {
            finalOutput: lastResult!,
            validation: lastValidation!,
            attempts: maxRetries + 1,
            wasRefined
        };
    }

    /**
     * LLM generates a hypothesis on why the execution failed validation,
     * and mutates the instruction to prevent the error on the next try.
     */
    private async reflectAndMutate(
        originalInstruction: string,
        failedContent: string,
        validation: ValidationResult
    ): Promise<{ refinedInstruction: string, reflection: string }> {
        
        const failureReasons = [];
        if (!validation.sourcesCited) failureReasons.push("Failed to cite sources for claims made.");
        if (!validation.noHallucinations) failureReasons.push("Contained contradictory statements, extreme hedging (lack of confidence), or falsely claimed to search the web without using tools.");
        if (!validation.dataAccurate) failureReasons.push("Data appears inaccurate or inconsistent.");
        if (!validation.safetyPassed) failureReasons.push("Failed safety guidelines (harmful/PII/etc).");

        const prompt = `You are the AutoResearch reflection engine. An agent attempted a task, but its output failed validation.

Original Task:
${originalInstruction}

Failed Output:
${failedContent}

Validation Failures:
${failureReasons.join('\n')}

Analyze exactly why the output failed based on the validation reasons.
Then, rewrite a strict, mutated set of instructions to append to the task to ensure the agent does not make this mistake again on its next attempt.

Return your response as a JSON object:
{
    "reflection": "Your analysis of why it failed",
    "refinedInstruction": "The strict instructions to append (e.g. 'DO NOT hedge. You MUST use the web_search tool and cite specific URLs.')"
}`;

        const response = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: "You are an expert root-cause analysis engine.",
            messages: [{ role: 'user', content: prompt }]
        });

        const text = response.content.find(b => b.type === 'text')?.text || "{}";
        
        try {
            const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
            return {
                reflection: parsed.reflection || "Failed to parse reflection.",
                refinedInstruction: parsed.refinedInstruction || "Please try again and be more careful about validation rules."
            };
        } catch {
            return {
                reflection: "JSON parsing failed.",
                refinedInstruction: `Critical failures detected: ${failureReasons.join(', ')}. Ensure you use the right tools and cite sources.`
            };
        }
    }

    private async recordWin(taskPrompt: string, result: ExecutionResult) {
        // LLM synthesizes the core lesson learned
        const prompt = `An agent successfully completed the following task.
        
Task: ${taskPrompt}
Output: ${result.content.substring(0, 500)}...
Tools Used: ${result.toolsUsed.join(', ')}

What is the 1-sentence key lesson or strategy to remember for tackling tasks like this in the future?`;

        // If mock mode, don't burn tokens on memory creation
        let lesson = "Successfully executed standard workflow.";
        if (this.executor.isLive) {
            try {
                const res = await this.anthropic.messages.create({
                    model: 'claude-3-haiku-20240307', // Use fast/cheap model for memory synthesis
                    max_tokens: 150,
                    messages: [{ role: 'user', content: prompt }]
                });
                lesson = res.content.find(b => b.type === 'text')?.text || lesson;
            } catch (e) {
               // ignore
            }
        }

        this.memory.addExperience({
            taskPrompt,
            success: true,
            toolsUsed: result.toolsUsed,
            lessonsLearned: lesson,
            antiPatterns: []
        });
    }

    private async recordFailure(taskPrompt: string, result: ExecutionResult, validation: ValidationResult) {
        let antiPattern = "Unknown execution failure.";
        if (!validation.sourcesCited) antiPattern = "Making claims without invoking research tools.";
        if (!validation.noHallucinations) antiPattern = "Generating content with high uncertainty or fabricating tool usage.";
        
        this.memory.addExperience({
            taskPrompt,
            success: false,
            toolsUsed: result.toolsUsed,
            lessonsLearned: "Task proved too complex or lacked precise tool grounding.",
            antiPatterns: [antiPattern]
        });
    }
}
