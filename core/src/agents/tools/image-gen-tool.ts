import OpenAI from 'openai';
import { Tool, ToolDefinition, ToolResult } from '../../types/mantis';

export interface ImageGenInput {
    prompt: string;
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
}

export class ImageGenTool implements Tool {
    name = 'image_gen';
    private openai: OpenAI;

    definition: ToolDefinition = {
        name: 'image_gen',
        description: 'Generate images using DALL-E 3. Useful for creating ad creatives, mockups, illustrations.',
        input_schema: {
            type: 'object',
            properties: {
                prompt: {
                    type: 'string',
                    description: 'Detailed description of the image to generate'
                },
                size: {
                    type: 'string',
                    enum: ['1024x1024', '1792x1024', '1024x1792'],
                    description: 'Image dimensions',
                    default: '1024x1024'
                },
                quality: {
                    type: 'string',
                    enum: ['standard', 'hd'],
                    description: 'Image quality level',
                    default: 'standard'
                },
                style: {
                    type: 'string',
                    enum: ['vivid', 'natural'],
                    description: 'Visual style',
                    default: 'natural'
                }
            },
            required: ['prompt']
        }
    };

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'dummy_key'
        });
    }

    async execute(input: ImageGenInput, sessionId?: string): Promise<ToolResult> {
        try {
            const {
                prompt,
                size = '1024x1024',
                quality = 'standard',
                style = 'natural'
            } = input;

            if (process.env.OPENAI_API_KEY === 'dummy_key' || !process.env.OPENAI_API_KEY) {
                return {
                    success: true,
                    data: {
                        image_url: 'https://via.placeholder.com/1024',
                        revised_prompt: prompt,
                        original_prompt: prompt,
                        size,
                        quality
                    },
                    sources: ['Mock Image'],
                    toolName: 'image_gen'
                }
            }

            const response = await this.openai.images.generate({
                model: 'dall-e-3',
                prompt,
                size,
                quality,
                style,
                n: 1
            });

            const imageUrl = response.data[0].url!;
            const revisedPrompt = response.data[0].revised_prompt;

            return {
                success: true,
                data: {
                    image_url: imageUrl,
                    revised_prompt: revisedPrompt,
                    original_prompt: prompt,
                    size,
                    quality
                },
                sources: ['DALL-E 3'],
                toolName: 'image_gen'
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                toolName: 'image_gen'
            };
        }
    }
}
