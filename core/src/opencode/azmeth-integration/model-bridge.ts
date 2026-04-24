/**
 * @file model-bridge.ts
 * @description Azmeth Model Abstraction Bridge
 *
 * Unified multi-provider LLM caller for the OpenCode query.ts loop.
 *
 * Providers:
 *   - azure-kimi  → Kimi K2.5 via Azure AI Services  (DEFAULT)
 *   - azure-openai → GPT-4o via Azure OpenAI          (secondary)
 *   - anthropic    → Claude via Anthropic API           (when key added)
 *   - openai       → OpenAI direct
 *
 * The query.ts loop calls deps.callModel() — this module provides that.
 */

import OpenAI, { AzureOpenAI } from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam, Tool as AnthropicTool } from '@anthropic-ai/sdk/resources/index.mjs'
import type { StreamEvent, AssistantMessage } from '../types/message.js'

export type SupportedProvider = 'azure-kimi' | 'azure-openai' | 'kimi' | 'anthropic' | 'openai' | 'gemini' | 'bedrock'

export interface ModelBridgeConfig {
  provider: SupportedProvider
  model: string
  apiKey?: string
  baseURL?: string
  azureDeployment?: string
  azureApiVersion?: string
  projectId?: string
  region?: string
}

export interface ModelCallParams {
  messages: MessageParam[]
  systemPrompt: { type: string; text: string } | string
  tools?: AnthropicTool[]
  maxOutputTokens?: number
  thinkingConfig?: { type: 'enabled'; budget_tokens: number } | { type: 'disabled' }
  signal?: AbortSignal
  model: string
}

/**
 * Resolves the active model config from environment.
 * DEFAULT: Azure Kimi K2.5
 */
export function resolveModelConfig(modelOverride?: string): ModelBridgeConfig {
  const provider = (process.env.AZMETH_MODEL_PROVIDER ?? 'azure-kimi') as SupportedProvider

  const defaultModel: Record<SupportedProvider, string> = {
    'azure-kimi':   'kimi-K2.5',
    'azure-openai': 'gpt-4o',
    'kimi':         'kimi-k2-0905-preview',
    'anthropic':    'claude-opus-4-5-20251101',
    'openai':       'gpt-4o',
    'gemini':       'gemini-2.0-flash',
    'bedrock':      'anthropic.claude-3-5-sonnet-20241022-v2:0',
  }

  const model = modelOverride ?? process.env.AZMETH_MODEL_ID ?? defaultModel[provider]

  switch (provider) {
    case 'azure-kimi':
      return {
        provider,
        model,
        apiKey: process.env.AZURE_KIMI_API_KEY,
        // OpenAI SDK baseURL for Azure AI Inference: endpoint WITHOUT /chat/completions
        baseURL: process.env.AZURE_KIMI_ENDPOINT ?? 'https://nikam-mn2vv7tk-eastus2.services.ai.azure.com/models',
        azureApiVersion: process.env.AZURE_KIMI_API_VERSION ?? '2024-05-01-preview',
      }
    case 'azure-openai':
      return {
        provider,
        model,
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        baseURL: process.env.AZURE_OPENAI_ENDPOINT,
        azureDeployment: process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o',
        azureApiVersion: process.env.AZURE_OPENAI_API_VERSION ?? '2025-01-01-preview',
      }
    default:
      return {
        provider,
        model,
        apiKey: process.env.MOONSHOT_API_KEY
          ?? process.env.ANTHROPIC_API_KEY
          ?? process.env.OPENAI_API_KEY,
        baseURL: process.env.AZMETH_MODEL_BASE_URL,
      }
  }
}

// ─── Shared streaming helper ──────────────────────────────────────────────────

/**
 * Drives an OpenAI-compatible streaming chat completion and yields
 * Azmeth StreamEvent objects that the query.ts loop understands.
 */
async function* streamOpenAICompatible(
  client: OpenAI | AzureOpenAI,
  model: string,
  systemStr: string,
  params: ModelCallParams,
): AsyncIterable<any> {
  const tools = (params.tools ?? []).map(t => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: typeof t.description === 'string' ? t.description : '',
      parameters: (t.input_schema as any) ?? {},
    },
  }))

  // Normalise message format: Anthropic → OpenAI
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemStr },
    ...(params.messages as any[]).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: Array.isArray(m.content)
        ? m.content
            .map((c: any) => (c.type === 'text' ? c.text : JSON.stringify(c)))
            .join('')
        : String(m.content ?? ''),
    })),
  ]

  const stream = await client.chat.completions.create({
    model,
    max_tokens: params.maxOutputTokens ?? 8192,
    stream: true,
    messages,
    ...(tools.length > 0 && { tools, tool_choice: 'auto' }),
  })

  let accText = ''
  const toolCalls: Record<number, { id: string; name: string; args: string }> = {}

  for await (const chunk of stream) {
    if (params.signal?.aborted) break
    const delta = chunk.choices[0]?.delta
    if (!delta) continue

    if (delta.content) {
      accText += delta.content
      yield {
        type: 'assistant',
        uuid: crypto.randomUUID(),
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: accText }],
          stop_reason: null,
          usage: { input_tokens: 0, output_tokens: 0 },
        },
        apiError: undefined,
      }
    }

    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        if (!toolCalls[tc.index]) toolCalls[tc.index] = { id: tc.id ?? '', name: '', args: '' }
        if (tc.function?.name)      toolCalls[tc.index]!.name += tc.function.name
        if (tc.function?.arguments) toolCalls[tc.index]!.args += tc.function.arguments
      }
    }

    if (chunk.choices[0]?.finish_reason) {
      const toolUseBlocks = Object.values(toolCalls).map(tc => ({
        type: 'tool_use' as const,
        id: tc.id || `tu_${crypto.randomUUID().slice(0, 8)}`,
        name: tc.name,
        input: (() => { try { return JSON.parse(tc.args) } catch { return {} } })(),
      }))

      const content: any[] = []
      if (accText) content.push({ type: 'text', text: accText })
      content.push(...toolUseBlocks)

      yield {
        type: 'assistant',
        uuid: crypto.randomUUID(),
        message: {
          role: 'assistant',
          content,
          stop_reason: toolUseBlocks.length > 0 ? 'tool_use' : 'end_turn',
          usage: { input_tokens: 0, output_tokens: 0 },
        },
        apiError: undefined,
      }
    }
  }
}

// ─── Provider implementations ─────────────────────────────────────────────────

/**
 * Azure AI Services — Kimi K2.5 (DEFAULT provider)
 *
 * Uses the Azure AI Inference endpoint which is OpenAI-SDK compatible.
 * The api-version query param is injected via defaultQuery.
 */
async function* callAzureKimi(
  params: ModelCallParams,
  cfg: ModelBridgeConfig,
): AsyncIterable<any> {
  const client = new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    defaultQuery: { 'api-version': cfg.azureApiVersion ?? '2024-05-01-preview' },
    defaultHeaders: { 'api-key': cfg.apiKey ?? '' },
  })

  const systemStr = typeof params.systemPrompt === 'string'
    ? params.systemPrompt
    : (params.systemPrompt as any).text ?? ''

  console.log(`[ModelBridge] Calling Azure Kimi K2.5 — model: ${cfg.model}`)
  yield* streamOpenAICompatible(client, cfg.model, systemStr, params)
}

/**
 * Azure OpenAI — GPT-4o (secondary provider)
 */
async function* callAzureOpenAI(
  params: ModelCallParams,
  cfg: ModelBridgeConfig,
): AsyncIterable<any> {
  const client = new AzureOpenAI({
    apiKey: cfg.apiKey,
    endpoint: cfg.baseURL,
    deployment: cfg.azureDeployment ?? 'gpt-4o',
    apiVersion: cfg.azureApiVersion ?? '2025-01-01-preview',
  })

  const systemStr = typeof params.systemPrompt === 'string'
    ? params.systemPrompt
    : (params.systemPrompt as any).text ?? ''

  console.log(`[ModelBridge] Calling Azure OpenAI GPT-4o — deployment: ${cfg.azureDeployment}`)
  yield* streamOpenAICompatible(client, cfg.azureDeployment ?? 'gpt-4o', systemStr, params)
}

/**
 * Anthropic — Claude (for when Anthropic key is supplied)
 */
async function* callAnthropic(
  params: ModelCallParams,
  cfg: ModelBridgeConfig,
): AsyncIterable<any> {
  const client = new Anthropic({ apiKey: cfg.apiKey })
  const systemStr = typeof params.systemPrompt === 'string'
    ? params.systemPrompt
    : (params.systemPrompt as any).text ?? ''

  const stream = client.messages.stream({
    model: cfg.model,
    max_tokens: params.maxOutputTokens ?? 8096,
    system: systemStr,
    messages: params.messages,
    tools: params.tools ?? [],
    ...(params.thinkingConfig?.type === 'enabled' && {
      thinking: { type: 'enabled', budget_tokens: params.thinkingConfig.budget_tokens },
    }),
  })

  for await (const event of stream) {
    if (event.type === 'message_stop') {
      const finalMsg = await stream.finalMessage()
      yield {
        type: 'assistant',
        uuid: crypto.randomUUID(),
        message: finalMsg,
        apiError: undefined,
      }
    }
    if (params.signal?.aborted) break
  }
}

// ─── Primary export ───────────────────────────────────────────────────────────

/**
 * Unified model caller — used by the session engine and query deps.
 */
export async function* callModel(
  params: ModelCallParams,
): AsyncIterable<StreamEvent | AssistantMessage> {
  const cfg = resolveModelConfig(params.model)

  switch (cfg.provider) {
    case 'azure-kimi':
      yield* callAzureKimi(params, cfg)
      break
    case 'azure-openai':
      yield* callAzureOpenAI(params, cfg)
      break
    case 'anthropic':
      yield* callAnthropic(params, cfg)
      break
    case 'kimi':
    case 'openai': {
      const client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL })
      const systemStr = typeof params.systemPrompt === 'string'
        ? params.systemPrompt
        : (params.systemPrompt as any).text ?? ''
      yield* streamOpenAICompatible(client, cfg.model, systemStr, params)
      break
    }
    default:
      throw new Error(`[Azmeth ModelBridge] Provider "${(cfg as any).provider}" is not wired.`)
  }
}
