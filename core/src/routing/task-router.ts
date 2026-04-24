import Anthropic from '@anthropic-ai/sdk';

export class TaskRouter {
    private anthropic: Anthropic;

    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key'
        });
    }

    /**
     * Categorizes a task as 'simple' or 'complex'.
     * 'simple' tasks can bypass the full orchestrator and stream directly to UI using a single expert.
     * 'complex' tasks require the Orchestrator, Decomposition, and Validator.
     */
    async route(taskCommand: string): Promise<'simple' | 'complex'> {
        try {
            if (process.env.ANTHROPIC_API_KEY === 'dummy_key' || !process.env.ANTHROPIC_API_KEY) {
                // Mock behavior for testing: string length heuristic
                return taskCommand.length < 50 ? 'simple' : 'complex';
            }

            const response = await this.anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 10,
                temperature: 0,
                system: `You are a system router. Determine if the user's task is simple (single question, quick web search, basic formatting) or complex (multi-step workflow, requires coding + testing, deep research + synthesis). Respond with EXACTLY ONE WORD: either "simple" or "complex".`,
                messages: [{
                    role: 'user',
                    content: taskCommand
                }]
            });

            const text = response.content.find(block => block.type === 'text')?.text?.toLowerCase().trim();
            return text === 'simple' ? 'simple' : 'complex';
        } catch (err) {
            console.error('[TaskRouter] Routing failed, defaulting to complex:', err);
            return 'complex'; // Safe fallback
        }
    }
}

export const taskRouter = new TaskRouter();
