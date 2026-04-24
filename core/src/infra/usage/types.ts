
export type UsageEventType = 'llm' | 'scrape' | 'enrichment' | 'intent';

export interface UsageEventBase {
    id: string;
    clientId: string; // The customer/org ID
    agentId: string; // "growth-agent", "outbound-agent", etc.
    timestamp: number;
    type: UsageEventType;
    costUSD: number; // Calculated cost
    metadata: Record<string, any>;
}

export interface LLMUsageDetails {
    provider: 'openrouter' | 'anthropic' | 'openai';
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}

export interface ScrapeUsageDetails {
    provider: 'apify' | 'custom';
    toolName: string; // e.g. "instagram-scraper", "fb-ad-library"
    urls: string[];
    units: number; // Compute units or credits used
}

export interface EnrichmentUsageDetails {
    provider: string; // "apollo", "hunter", etc.
    action: string; // "find-email", "verify-email"
    recordsProcessed: number;
}

export interface UsageEvent extends UsageEventBase {
    details: LLMUsageDetails | ScrapeUsageDetails | EnrichmentUsageDetails | any;
}
