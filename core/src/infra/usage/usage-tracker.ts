
import { UsageEvent, UsageEventType, LLMUsageDetails, ScrapeUsageDetails } from './types.js';
import * as fs from 'fs';
import * as path from 'path';

// Cost table (USD per 1M tokens) - approximate
const LLM_COSTS: Record<string, { input: number, output: number }> = {
    // Anthropic via OpenRouter
    'anthropic/claude-3-opus': { input: 15.0, output: 75.0 },
    'anthropic/claude-3.5-sonnet': { input: 3.0, output: 15.0 },
    'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
    // OpenAI via OpenRouter
    'openai/gpt-4o': { input: 5.0, output: 15.0 },
    'openai/gpt-4o-mini': { input: 0.15, output: 0.60 },
    // Fallback
    'default': { input: 1.0, output: 1.0 }
};

export class UsageTracker {
    private static instance: UsageTracker;
    private logFile: string;

    private constructor() {
        this.logFile = path.resolve(process.cwd(), 'usage.jsonl');
    }

    public static getInstance(): UsageTracker {
        if (!UsageTracker.instance) {
            UsageTracker.instance = new UsageTracker();
        }
        return UsageTracker.instance;
    }

    private logEvent(event: UsageEvent) {
        const line = JSON.stringify(event) + '\n';
        fs.appendFile(this.logFile, line, (err) => {
            if (err) console.error('Failed to write usage log:', err);
        });
    }

    public trackLLM(
        clientId: string,
        agentId: string,
        model: string,
        inputTokens: number,
        outputTokens: number,
        provider: 'openrouter' | 'anthropic' | 'openai' = 'openrouter'
    ): void {
        const costConfig = LLM_COSTS[model] || LLM_COSTS['default'];
        const costUSD = (
            (inputTokens / 1_000_000) * costConfig.input +
            (outputTokens / 1_000_000) * costConfig.output
        );

        const details: LLMUsageDetails = {
            provider,
            model,
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens
        };

        const event: UsageEvent = {
            id: crypto.randomUUID(),
            clientId,
            agentId,
            timestamp: Date.now(),
            type: 'llm',
            costUSD,
            metadata: {},
            details
        };

        console.log(`[UsageTracker] LLM: ${model} | Cost: $${costUSD.toFixed(6)}`);
        this.logEvent(event);
    }

    public trackScrape(
        clientId: string,
        agentId: string,
        provider: 'apify' | 'custom',
        toolName: string,
        urls: string[],
        costUSD: number, // Scrapers often have fixed cost per run or unit
        metadata: Record<string, any> = {}
    ): void {
        const details: ScrapeUsageDetails = {
            provider,
            toolName,
            urls,
            units: 1
        };

        const event: UsageEvent = {
            id: crypto.randomUUID(),
            clientId,
            agentId,
            timestamp: Date.now(),
            type: 'scrape',
            costUSD,
            metadata,
            details
        };

        console.log(`[UsageTracker] Scrape: ${toolName} | Cost: $${costUSD.toFixed(6)}`);
        this.logEvent(event);
    }
}
