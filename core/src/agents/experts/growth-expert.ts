import Anthropic from '@anthropic-ai/sdk';
import { ExpertAgent } from '../expert-agent-base.js';
import { BrowserTool } from '../tools/browser-tool.js';
import { FacebookAPITool } from '../tools/facebook-api-tool.js';
import { WebSearchTool } from '../tools/web-search-tool.js';
import { ImageGenTool } from '../tools/image-gen-tool.js';
import { streamingManager } from '../../streaming/streaming-manager.js';
import { AgentExecutor } from '../../engine/agent-executor.js';

export class GrowthExpert extends ExpertAgent {
    id = 'growth_expert';
    name = 'Jordan - Growth Marketing Expert';
    type = 'growth';

    capabilities = [
        'product_research',
        'competitor_analysis',
        'campaign_creation',
        'creative_generation',
        'audience_research'
    ];

    protected model = 'claude-3-5-sonnet-20241022';

    protected tools = new Map<string, any>([
        ['browser', new BrowserTool()],
        ['facebook_api', new FacebookAPITool()],
        ['web_search', new WebSearchTool()],
        ['image_gen', new ImageGenTool()]
    ]);

    private executor: AgentExecutor;

    constructor() {
        super();
        this.executor = new AgentExecutor(
            process.env.ANTHROPIC_API_KEY || 'dummy_key',
            this.tools,
            this.model
        );
    }

    protected async run(message: any, context: any, sessionId: string): Promise<any> {
        const textContent = typeof message === 'string' ? message : message?.content || JSON.stringify(message);

        streamingManager.streamThinking(sessionId, 'Consulting Claude for analysis...');

        const result = await this.executor.execute(
            textContent,
            context,
            this.getSystemPrompt(),
            (toolName, input) => {
                streamingManager.streamToolUse(sessionId, toolName, input);
                streamingManager.streamThinking(sessionId, `Using tool: ${toolName}...`);
            },
            (toolName, toolResult) => {
                streamingManager.streamToolResult(sessionId, toolName, toolResult);
            }
        );

        return {
            type: 'text',
            content: result.content
        };
    }

    private getSystemPrompt(): string {
        return `
You are Jordan, a Growth Marketing Expert specializing in B2B SaaS marketing campaigns.

You have access to these tools:
- browser: Navigate websites, research competitors, extract information
- facebook_api: Create Facebook ad campaigns, ad sets, and ads
- web_search: Search for current market information and competitor data
- image_gen: Generate creative assets for ads

Your workflow for creating a Facebook ad campaign:
1. Use browser to visit the client's website and understand their product
2. Use web_search to research competitors and market positioning
3. Use browser to check Facebook Ad Library for competitor ads
4. Use facebook_api to create the campaign (always start PAUSED)
5. Use image_gen to create ad creatives
6. Use facebook_api to create ad sets with targeting
7. Use facebook_api to create ads with the generated creative

Always:
- Start campaigns in PAUSED status for client review
- Extract actual information from websites, don't make assumptions
- Cite sources for all claims
- Be transparent about what you're doing at each step
    `;
    }
}
