/**
 * @file session-engine.ts
 * @description Azmeth Session Engine — Full ReAct Loop with Tool Calling
 *
 * Drives the autonomous agent using Kimi K2.5 (Azure AI) with:
 *  - Full ReAct loop: Think → Tool Use → Observe → Think
 *  - Tool execution via the existing ToolBridge (n8n, sandbox, legal, etc.)
 *  - Security gating via ApprovalChain before every tool execution
 *  - Cloud memory from Supabase (graceful fallback in dev)
 *  - Live NodeEvent streaming over WebSocket to the frontend
 *
 * WebSocket NodeEvent protocol:
 *   engine:thinking     → agent is reasoning (text stream)
 *   engine:tool_use     → tool being called (name + input)
 *   engine:observation  → tool result returned
 *   engine:interruption → ApprovalChain blocked execution
 *   engine:complete     → task finished
 *   engine:error        → fatal error
 */

import type WebSocket from 'ws'
import OpenAI from 'openai'
import { loadSessionMemory } from './memory-bridge.js'
import { createPermissionGate } from './permission-gate.js'
import type { InterruptionEvent, AzmethSession } from './permission-gate.js'
import { resolveModelConfig } from './model-bridge.js'
import { ToolBridge } from '../../business/tools/ToolBridge.js'
import type { ToolResult } from '../../business/tools/ToolBridge.js'
import n8nTools from '../../business/tools/n8n-tools.json' with { type: 'json' }
import { WebSearchTool } from '../../business/tools/native/WebSearchTool.js'
import { BrowserbaseTool } from '../../business/tools/native/BrowserbaseTool.js'
import { ExtensionBrowserTool, isExtensionConnected } from '../../business/tools/native/ExtensionBrowserTool.js'

export interface NodeEvent {
  type:
    | 'thinking'
    | 'tool_use'
    | 'observation'
    | 'interruption'
    | 'complete'
    | 'error'
    | 'token_budget'
  content?: string
  toolName?: string
  input?: unknown
  result?: unknown
  riskLevel?: string
  reason?: string
  approvalId?: string
  sessionId: string
  timestamp: string
}

export interface SessionEngineOptions {
  tenantId: string
  roleId: string
  sessionId: string
  workspacePath?: string
  /** Override tools available for this session (defaults to full ToolBridge set) */
  toolOverride?: OpenAI.Chat.ChatCompletionTool[]
}

// ─── Tool Registry ─────────────────────────────────────────────────────────────

/**
 * Builds the full OpenAI-format tool list for the engine.
 * Merges: native tools (execute_javascript) + n8n integration tools
 */
function buildToolDefinitions(): OpenAI.Chat.ChatCompletionTool[] {
  const nativeTools: OpenAI.Chat.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'execute_javascript',
        description:
          'Executes arbitrary Node.js code in a secure sandbox. Use this to call external APIs, ' +
          'scrape websites, or run data transformations. Print results via console.log().',
        parameters: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Raw JavaScript code to execute. Must console.log() final result.',
            },
          },
          required: ['code'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'mark_complete',
        description: 'Call when the user goal is fully achieved. Ends the agent loop.',
        parameters: {
          type: 'object',
          properties: {
            summary: {
              type: 'string',
              description: 'Concise summary of what was accomplished.',
            },
          },
          required: ['summary'],
        },
      },
    },
    // Web search via Perplexity AI
    WebSearchTool.definition,
    // Headless browser via Browserbase (remote)
    BrowserbaseTool.definition,
    // Real browser via Chrome Extension (undetectable)
    ...(isExtensionConnected() ? [ExtensionBrowserTool.definition] : []),
  ]

  // Map n8n tools from JSON to OpenAI format
  const n8nToolDefs: OpenAI.Chat.ChatCompletionTool[] = (n8nTools as any[]).map(t => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }))

  return [...nativeTools, ...n8nToolDefs]
}

// ─── Session Engine ────────────────────────────────────────────────────────────

export class AzmethSessionEngine {
  private ws: WebSocket
  private session: AzmethSession
  private opts: SessionEngineOptions
  private abortController = new AbortController()
  private toolBridge = new ToolBridge()

  constructor(ws: WebSocket, opts: SessionEngineOptions) {
    this.ws = ws
    this.opts = opts
    this.session = {
      sessionId: opts.sessionId,
      tenantId: opts.tenantId,
      roleId: opts.roleId,
    }
    ws.on?.('close', () => this.abortController.abort())
  }

  // ─── WS Emit ──────────────────────────────────────────────────────────────

  private emit(event: Omit<NodeEvent, 'sessionId' | 'timestamp'>): void {
    if (this.ws.readyState === 1) {
      this.ws.send(
        JSON.stringify({
          ...event,
          sessionId: this.opts.sessionId,
          timestamp: new Date().toISOString(),
        } satisfies NodeEvent),
      )
    }
  }

  // ─── Main Entry Point ─────────────────────────────────────────────────────

  async start(userMessage: string): Promise<void> {
    try {
      // 1. Load cloud memory (graceful fallback in dev)
      let memoryContent = ''
      try {
        const memoryFiles = await loadSessionMemory(
          this.opts.tenantId,
          this.opts.roleId,
          this.opts.sessionId,
        )
        memoryContent = (memoryFiles as any[])
          .map((f: any) => `<!-- ${f.type} Memory -->\n${f.content}`)
          .join('\n\n')
      } catch (e) {
        console.warn('[AzmethSessionEngine] Memory skipped:', (e as Error).message)
      }

      // 2. Build permission gate (wired to ApprovalChain)
      const canUseTool = createPermissionGate(this.session, (evt: InterruptionEvent) => {
        this.emit({
          type: 'interruption',
          toolName: evt.toolName,
          input: evt.toolInput,
          riskLevel: evt.riskLevel,
          reason: evt.reason,
          approvalId: evt.approvalId,
        })
      })

      // 3. Build system prompt
      const systemPrompt = [
        'You are an Autonomous AI Employee powered by Azmeth AI.',
        'You operate in a continuous loop: Think → Act → Observe → Think.',
        'Use the tools provided to achieve the user\'s goal completely.',
        'When you need to call external APIs or services without a dedicated tool, use execute_javascript to write and run the integration code.',
        'You MUST call mark_complete when the task is fully done.',
        'Do not ask for permission. Act autonomously. If approval is needed, the system handles it.',
        memoryContent ? `\n## Workspace Memory\n${memoryContent}` : '',
      ]
        .filter(Boolean)
        .join('\n\n')

      // 4. Init Kimi K2.5 client
      const cfg = resolveModelConfig()
      const client = new OpenAI({
        apiKey: cfg.apiKey,
        baseURL: cfg.baseURL,
        defaultQuery: { 'api-version': cfg.azureApiVersion ?? '2024-05-01-preview' },
        defaultHeaders: { 'api-key': cfg.apiKey ?? '' },
      })

      const tools = this.opts.toolOverride ?? buildToolDefinitions()

      // 5. Initialise message history
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ]

      this.emit({ type: 'thinking', content: 'Starting ReAct loop...' })

      let isComplete = false
      let loopCount = 0
      const MAX_LOOPS = 20 // safety brake

      // ─── ReAct Loop ──────────────────────────────────────────────────────
      while (!isComplete && loopCount < MAX_LOOPS) {
        if (this.abortController.signal.aborted) break
        loopCount++

        // ── Think: call Kimi K2.5 (non-streaming for tool call reliability) ──
        const response = await client.chat.completions.create({
          model: cfg.model,
          max_tokens: 8192,
          messages,
          tools,
          tool_choice: 'auto',
        })

        const choice = response.choices[0]
        if (!choice) break

        const assistantMsg = choice.message

        // Normalise and push assistant message to history
        // We must serialize to a plain object — the raw SDK message can contain
        // internal state that breaks on re-use. Also normalise tool_call IDs.
        const rawToolCalls = (assistantMsg.tool_calls ?? []) as Array<{
          id: string | null
          index?: number
          type: string
          function: { name: string; arguments: string; call_id?: string | null }
        }>

        const normalizedToolCalls = rawToolCalls.map((tc, i) => ({
          id: tc.id ?? tc.function?.call_id ?? `tc_${Date.now()}_${i}`,
          type: 'function' as const,
          function: { name: tc.function.name, arguments: tc.function.arguments },
        }))

        const normalizedMsg: OpenAI.Chat.ChatCompletionMessageParam = {
          role: 'assistant',
          content: assistantMsg.content ?? null,
          ...(normalizedToolCalls.length > 0 && { tool_calls: normalizedToolCalls }),
        }
        messages.push(normalizedMsg)

        // Emit reasoning text if present
        if (assistantMsg.content) {
          this.emit({ type: 'thinking', content: assistantMsg.content })
        }

        // ── Check finish ──────────────────────────────────────────────────
        if (choice.finish_reason === 'stop' && !assistantMsg.tool_calls?.length) {
          this.emit({ type: 'complete', content: assistantMsg.content ?? 'Task complete.' })
          isComplete = true
          break
        }

        // ── Act: execute each tool call ───────────────────────────────────
        // Normalise: Azure Kimi sometimes returns null ids — generate fallback
        const toolCalls = ((assistantMsg.tool_calls ?? []) as Array<{
          id: string | null
          type: 'function'
          function: { name: string; arguments: string }
        }>).map((tc, i) => ({
          ...tc,
          id: tc.id ?? `tc_${Date.now()}_${i}`,   // Guaranteed non-null ID
        }))
        if (toolCalls.length === 0) {
          this.emit({ type: 'complete', content: assistantMsg.content ?? 'Done.' })
          isComplete = true
          break
        }

        const toolResults: OpenAI.Chat.ChatCompletionToolMessageParam[] = []

        for (const toolCall of toolCalls) {
          if (this.abortController.signal.aborted) break

          const toolName = toolCall.function.name
          let toolInput: unknown
          try {
            toolInput = JSON.parse(toolCall.function.arguments || '{}')
          } catch {
            toolInput = {}
          }

          // mark_complete → end loop
          if (toolName === 'mark_complete') {
            const summary = (toolInput as { summary: string }).summary
            this.emit({ type: 'complete', content: summary })
            isComplete = true
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: 'Execution complete.',
            })
            break
          }

          // Emit tool_use event to frontend
          this.emit({ type: 'tool_use', toolName, input: toolInput })

          // ── Security gate (ApprovalChain) ──────────────────────────────
          const gateResult = await canUseTool({ name: toolName } as any, toolInput)

          if (gateResult.result === 'reject') {
            // Tool blocked — send error result back to model so it can reason about it
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: `ERROR: Tool execution blocked. ${gateResult.reason}`,
            })
            continue
          }

          // ── Execute via ToolBridge ──────────────────────────────────────
          let result: ToolResult
          try {
            result = await this.toolBridge.execute(
              toolName,
              toolInput,
              this.opts.roleId,
              this.opts.tenantId,
            )
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            result = { output: `ERROR: ${msg}`, error: msg }
          }

          const outputStr =
            typeof result.output === 'string'
              ? result.output
              : JSON.stringify(result.output, null, 2)

          // Emit observation to frontend
          this.emit({ type: 'observation', toolName, result: outputStr })

          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: outputStr,
          })
        }

        // ── Observe: push tool results back into message history ──────────
        if (toolResults.length > 0) {
          messages.push(...toolResults)
        }
      }

      // Safety brake hit
      if (loopCount >= MAX_LOOPS && !isComplete) {
        this.emit({
          type: 'complete',
          content: `Agent reached max loop limit (${MAX_LOOPS}). Last response preserved in history.`,
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[AzmethSessionEngine] Fatal error:', msg)
      this.emit({ type: 'error', content: msg })
    }
  }

  abort(): void {
    this.abortController.abort()
  }
}
