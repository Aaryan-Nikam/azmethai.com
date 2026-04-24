import { FacebookAdsApi as FacebookAdsAPI, Campaign, AdSet, Ad } from 'facebook-nodejs-business-sdk';
import { Tool, ToolDefinition, ToolResult } from '../../types/mantis';
import { streamingManager } from '../../streaming/streaming-manager';

export interface FacebookAPIInput {
    action: 'create_campaign' | 'create_adset' | 'create_ad' | 'get_insights';
    params: any;
}

export class FacebookAPITool implements Tool {
    name = 'facebook_api';
    private api: any; // Using any for the FacebookAdsAPI instance temporarily to bypass tight type restrictions
    private accessToken: string;
    private adAccountId: string;

    definition: ToolDefinition = {
        name: 'facebook_api',
        description: 'Create and manage Facebook ad campaigns, ad sets, and ads using the official Marketing API',
        input_schema: {
            type: 'object',
            properties: {
                action: {
                    type: 'string',
                    enum: ['create_campaign', 'create_adset', 'create_ad', 'get_insights'],
                    description: 'The Facebook Ads action to perform'
                },
                params: {
                    type: 'object',
                    description: 'Parameters for the action (campaign name, objective, budget, etc.)'
                }
            },
            required: ['action', 'params']
        }
    };

    constructor() {
        this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN || 'dummy_token';
        this.adAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID || 'dummy_account_id';

        // Initialize Facebook API
        this.api = FacebookAdsAPI.init(this.accessToken);
    }

    async execute(input: FacebookAPIInput, sessionId?: string): Promise<ToolResult> {
        try {
            const { action, params } = input;

            let result: any;

            if (sessionId) {
                streamingManager.streamAPICall(sessionId, 'Facebook Marketing API', 'POST', `/${action}`, params);
            }

            switch (action) {
                case 'create_campaign':
                    result = await this.createCampaign(params);
                    break;

                case 'create_adset':
                    result = await this.createAdSet(params);
                    break;

                case 'create_ad':
                    result = await this.createAd(params);
                    break;

                case 'get_insights':
                    result = await this.getInsights(params);
                    break;

                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            if (sessionId) {
                streamingManager.streamAPIResponse(sessionId, 'Facebook Marketing API', result);
            }

            return {
                success: true,
                data: result,
                sources: ['Facebook Marketing API'],
                toolName: 'facebook_api'
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                toolName: 'facebook_api'
            };
        }
    }

    private async createCampaign(params: any): Promise<any> {
        const {
            name,
            objective = 'CONVERSIONS',
            status = 'PAUSED', // Start paused for safety
            special_ad_categories = []
        } = params;

        // Mock the actual API call for now if real keys aren't present
        if (this.accessToken === 'dummy_token') {
            return {
                campaign_id: 'mock_camp_123',
                name,
                objective,
                status,
                message: 'Campaign created mockly (paused).'
            };
        }

        const campaign = new Campaign(null, this.adAccountId);

        const campaignData = await campaign.create({
            name,
            objective,
            status,
            special_ad_categories
        });

        return {
            campaign_id: campaignData.id,
            name: campaignData.name,
            objective: campaignData.objective,
            status: campaignData.status,
            message: 'Campaign created (paused). Review in Ads Manager before launching.'
        };
    }

    private async createAdSet(params: any): Promise<any> {
        const {
            campaign_id,
            name,
            daily_budget,
            targeting,
            billing_event = 'IMPRESSIONS',
            optimization_goal = 'CONVERSIONS',
            bid_amount
        } = params;

        if (this.accessToken === 'dummy_token') {
            return {
                adset_id: 'mock_adset_123',
                name,
                daily_budget,
                targeting,
                status: 'PAUSED'
            };
        }

        const adset = new AdSet(null, this.adAccountId);

        const adsetData = await adset.create({
            campaign_id,
            name,
            daily_budget: daily_budget * 100, // Convert to cents
            billing_event,
            optimization_goal,
            bid_amount: bid_amount ? bid_amount * 100 : undefined,
            targeting,
            status: 'PAUSED'
        });

        return {
            adset_id: adsetData.id,
            name: adsetData.name,
            daily_budget: daily_budget,
            targeting: targeting,
            status: 'PAUSED'
        };
    }

    private async createAd(params: any): Promise<any> {
        const {
            adset_id,
            name,
            creative
        } = params;

        if (this.accessToken === 'dummy_token') {
            return {
                ad_id: 'mock_ad_123',
                name,
                status: 'PAUSED',
                preview_url: `https://www.facebook.com/ads/manager/preview/mock_ad_123`
            };
        }

        const ad = new Ad(null, this.adAccountId);

        const adData = await ad.create({
            adset_id,
            name,
            creative,
            status: 'PAUSED'
        });

        return {
            ad_id: adData.id,
            name: adData.name,
            status: 'PAUSED',
            preview_url: `https://www.facebook.com/ads/manager/preview/${adData.id}`
        };
    }

    private async getInsights(params: any): Promise<any> {
        // Implementation for getting campaign insights
        // This would use the Insights API
        return {
            message: 'Insights retrieval not yet implemented'
        };
    }
}
