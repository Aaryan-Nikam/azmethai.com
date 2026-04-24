/**
 * @file WebSearchTool.ts
 * @description Native web search tool powered by Perplexity AI.
 *
 * Gives the agent real-time web intelligence: news, research, company info,
 * competitor analysis, etc. Uses the Perplexity sonar-pro model which is
 * optimised for factual, citation-backed answers.
 *
 * Risk level: LOW (read-only, no side effects)
 */

export interface WebSearchInput {
  query: string
  focus?: 'web' | 'news' | 'research' | 'finance'
  max_results?: number
}

export interface WebSearchResult {
  answer: string
  citations: Array<{ url: string; title?: string }>
  model: string
}

export class WebSearchTool {
  static readonly toolName = 'web_search'

  static get definition() {
    return {
      type: 'function' as const,
      function: {
        name: WebSearchTool.toolName,
        description:
          'Searches the web in real-time using Perplexity AI. Use this to get current information, research companies, find news, check competitor pricing, look up technical documentation, or retrieve any factual data that may not be in your training data. Returns a synthesised answer with citation URLs.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query. Be specific and detailed for better results.',
            },
            focus: {
              type: 'string',
              enum: ['web', 'news', 'research', 'finance'],
              description:
                'Search focus: "web" for general, "news" for recent events, "research" for academic/technical, "finance" for market data. Defaults to "web".',
            },
            max_results: {
              type: 'number',
              description: 'Max number of results to return (1-10). Defaults to 5.',
            },
          },
          required: ['query'],
        },
      },
    }
  }

  static async execute(input: WebSearchInput): Promise<WebSearchResult> {
    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) {
      throw new Error(
        '[WebSearchTool] PERPLEXITY_API_KEY is not set. Add it to core/.env to enable web search.',
      )
    }

    const modelMap: Record<string, string> = {
      web: 'llama-3.1-sonar-large-128k-online',
      news: 'llama-3.1-sonar-large-128k-online',
      research: 'llama-3.1-sonar-large-128k-online',
      finance: 'llama-3.1-sonar-large-128k-online',
    }

    const model = modelMap[input.focus ?? 'web'] ?? modelMap.web

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a factual research assistant. Provide accurate, well-sourced answers with key data points. Be concise and use bullet points for lists.',
          },
          { role: 'user', content: input.query },
        ],
        max_tokens: 1024,
        return_citations: true,
        return_images: false,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`[WebSearchTool] Perplexity API error ${response.status}: ${errText}`)
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>
      citations?: string[]
      model: string
    }

    const answer = data.choices[0]?.message?.content ?? 'No answer returned.'
    const citations = (data.citations ?? []).map((url: string) => ({ url }))

    return {
      answer,
      citations,
      model: data.model,
    }
  }
}
