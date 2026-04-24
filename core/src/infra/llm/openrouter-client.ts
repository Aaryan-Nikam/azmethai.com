
import OpenAI from 'openai';
import { UsageTracker } from '../usage/usage-tracker.js';

export class OpenRouterClient {
    private client: OpenAI;
    private usageTracker: UsageTracker;
    private clientId: string;
    private agentId: string;

    constructor(clientId: string = 'default-client', agentId: string = 'unknown-agent') {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.warn("[OpenRouterClient] Missing OPENROUTER_API_KEY. Calls will fail.");
        }

        this.client = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey,
            defaultHeaders: {
                "HTTP-Referer": "https://mantis.os", // Required by OpenRouter
                "X-Title": "Mantis Agent",
            }
        });

        this.usageTracker = UsageTracker.getInstance();
        this.clientId = clientId;
        this.agentId = agentId;
    }

    /**
     * Generates a completion and tracks usage.
     */
    async complete(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], model: string = "openai/gpt-4o-mini"): Promise<string | null> {
        try {
            const response = await this.client.chat.completions.create({
                model: model,
                messages: messages,
            });

            const content = response.choices[0]?.message?.content || null;
            const usage = response.usage;

            if (usage) {
                this.usageTracker.trackLLM(
                    this.clientId,
                    this.agentId,
                    model,
                    usage.prompt_tokens,
                    usage.completion_tokens,
                    'openrouter'
                );
            }

            return content;
        } catch (error) {
            console.error("[OpenRouterClient] Error generating completion:", error);
            throw error;
        }
    }
}
