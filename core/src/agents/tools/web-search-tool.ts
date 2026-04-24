import { Tool, ToolDefinition, ToolResult } from '../../types/mantis.js';

export interface WebSearchInput {
    query: string;
    max_results?: number;
}

export class WebSearchTool implements Tool {
    name = 'web_search';
    private perplexityApiKey: string;

    definition: ToolDefinition = {
        name: 'web_search',
        description: 'Search the web for current information using Perplexity AI. Returns sourced, cited results.',
        input_schema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The search query'
                },
                max_results: {
                    type: 'number',
                    description: 'Maximum number of results (default 5)',
                    default: 5
                }
            },
            required: ['query']
        }
    };

    constructor() {
        this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || 'dummy_key';
    }

    async execute(input: WebSearchInput, sessionId?: string): Promise<ToolResult> {
        try {
            const { query, max_results = 5 } = input;

            if (this.perplexityApiKey === 'dummy_key') {
                return {
                    success: true,
                    data: { answer: `Mock Perplexity Response for: ${query}`, citations: [], query },
                    sources: [],
                    toolName: 'web_search'
                };
            }

            // Call Perplexity API
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.perplexityApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{
                        role: 'user',
                        content: query
                    }],
                    max_tokens: 1000,
                    temperature: 0.2,
                    return_citations: true,
                    return_images: false
                })
            });

            const data = await response.json();

            const answer = data.choices[0].message.content;
            const citations = data.citations || [];

            return {
                success: true,
                data: {
                    answer,
                    citations,
                    query
                },
                sources: citations,
                toolName: 'web_search'
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                toolName: 'web_search'
            };
        }
    }
}
