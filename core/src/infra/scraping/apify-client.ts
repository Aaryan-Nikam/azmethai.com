
import { ApifyClient as OfficialApifyClient } from 'apify-client';
import { UsageTracker } from '../usage/usage-tracker.js';

// If apify-client is not installed, I might need to add it or use fetch. 
// For now assuming we can add it or use raw HTTP.
// Let's use raw HTTP to avoid dependency hell unless requested.
// Wait, user explicitly said "APIFY's API". A lightweight wrapper is better.

export class ApifyClient {
    private apiToken: string;
    private usageTracker: UsageTracker;
    private clientId: string;
    private agentId: string;

    constructor(clientId: string = 'default-client', agentId: string = 'unknown-agent') {
        this.apiToken = process.env.APIFY_API_TOKEN || '';
        if (!this.apiToken) {
            console.warn("[ApifyClient] Missing APIFY_API_TOKEN.");
        }
        this.usageTracker = UsageTracker.getInstance();
        this.clientId = clientId;
        this.agentId = agentId;
    }

    async runActor(actorId: string, input: Record<string, any>, costEstimateUSD: number = 0.05): Promise<any[]> {
        console.log(`[ApifyClient] Running actor ${actorId}...`);

        // 1. Start Run
        const run = await this.fetchApi(`acts/${actorId}/runs`, 'POST', input);
        const runId = run.data.id;
        console.log(`[ApifyClient] Run started: ${runId}`);

        // 2. Poll for finish
        let status = run.data.status;
        while (status !== 'SUCCEEDED' && status !== 'FAILED' && status !== 'ABORTED') {
            await new Promise(r => setTimeout(r, 5000)); // Wait 5s
            const check = await this.fetchApi(`actor-runs/${runId}`);
            status = check.data.status;
            console.log(`[ApifyClient] Status: ${status}`);
        }

        if (status === 'FAILED' || status === 'ABORTED') {
            throw new Error(`Apify run ${runId} failed with status ${status}`);
        }

        // 3. Get Results
        const datasetId = run.data.defaultDatasetId;
        const results = await this.fetchApi(`datasets/${datasetId}/items`);

        // 4. Track Usage
        // Note: Real cost fetching requires another API call to `actor-runs/${runId}/chargeable-event`.
        // For v1 we can use the estimate passed in or a default.
        this.usageTracker.trackScrape(
            this.clientId,
            this.agentId,
            'apify',
            actorId,
            [`Actor Run: ${runId}`],
            costEstimateUSD, // TODO: Fetch real cost
            { runId }
        );

        return results;
    }

    /**
     * Searches the Apify Store for actors matching a query.
     * Enables "Unhinged" mode where agents find their own tools.
     */
    async searchActors(query: string, limit: number = 3): Promise<any[]> {
        console.log(`[ApifyClient] Searching store for: "${query}"...`);
        // Endpoint: https://api.apify.com/v2/store/acts?search=...
        // Note: This is a public endpoint, generic token usually works or no token?
        // Let's use the token we have.
        try {
            const data = await this.fetchApi(`store/acts?search=${encodeURIComponent(query)}&limit=${limit}&desc=true&sortBy=popularity`);
            return data.data.items || [];
        } catch (e) {
            console.warn(`[ApifyClient] Store search failed: ${e}`);
            return [];
        }
    }

    private async fetchApi(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
        const url = `https://api.apify.com/v2/${endpoint}?token=${this.apiToken}`;
        const headers: any = { 'Content-Type': 'application/json' };

        const options: RequestInit = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        };

        const res = await fetch(url, options);
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Apify API Error ${res.status}: ${txt}`);
        }
        return await res.json();
    }
}
