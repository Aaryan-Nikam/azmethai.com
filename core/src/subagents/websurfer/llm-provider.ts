/**
 * LLM Provider for the Agentic Browser
 *
 * Wraps the OpenAI API (GPT-4o) for the agentic browser loop.
 * Supports both text-only and vision (screenshot) prompts.
 *
 * Set OPENAI_API_KEY in your environment or .env file.
 */

import type { AgentLLMFn } from "./agentic-browser.js";

/**
 * Create an LLM function that calls the OpenAI Chat Completions API.
 * Uses GPT-4o for vision (screenshot) support.
 */
export function createOpenAIAgent(apiKey?: string): AgentLLMFn {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
        throw new Error(
            "No OpenAI API key found. Set OPENAI_API_KEY env var or pass the key to createOpenAIAgent().",
        );
    }

    return async (prompt: string, screenshotBase64?: string): Promise<string> => {
        const messages: Array<Record<string, unknown>> = [];

        if (screenshotBase64) {
            // Vision mode — send screenshot with text
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/png;base64,${screenshotBase64}`,
                            detail: "low", // Save tokens — we have text too
                        },
                    },
                ],
            });
        } else {
            messages.push({ role: "user", content: prompt });
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages,
                max_tokens: 500,
                temperature: 0.3,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${text}`);
        }

        const data = (await response.json()) as {
            choices: Array<{ message: { content: string } }>;
        };

        return data.choices[0]?.message?.content ?? "";
    };
}

/**
 * Create an LLM function that calls the Anthropic Messages API.
 * Uses Claude 3.5 Sonnet for vision support.
 */
export function createAnthropicAgent(apiKey?: string): AgentLLMFn {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
        throw new Error(
            "No Anthropic API key found. Set ANTHROPIC_API_KEY env var or pass the key to createAnthropicAgent().",
        );
    }

    return async (prompt: string, screenshotBase64?: string): Promise<string> => {
        const content: Array<Record<string, unknown>> = [];

        if (screenshotBase64) {
            content.push({
                type: "image",
                source: {
                    type: "base64",
                    media_type: "image/png",
                    data: screenshotBase64,
                },
            });
        }
        content.push({ type: "text", text: prompt });

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 500,
                messages: [{ role: "user", content }],
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Anthropic API error (${response.status}): ${text}`);
        }

        const data = (await response.json()) as {
            content: Array<{ type: string; text: string }>;
        };

        return data.content.find((c) => c.type === "text")?.text ?? "";
    };
}
