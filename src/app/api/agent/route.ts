/**
 * /api/agent — Azmeth Agent with tool-call loop + clarification interrupts
 *
 * POST: Chat with the agent — tool calls execute automatically against live data
 * GET:  Fetch agent config
 * PUT:  Update agent config
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, AgentConfig } from '@/lib/supabase';
import { agentTools } from '@/lib/agent-tools';
import { executeToolEnvelope } from '@/lib/tool-executor';

export const dynamic = 'force-dynamic';

const MAX_ITERATIONS = 8; // Cap tool-call chains to prevent runaway loops
const TIMEOUT_MS = 45000;

const SYSTEM_PROMPT = `You are Azmeth Agent — an embedded AI operations assistant inside the Azmeth OS platform.

Your job is to operate systems directly through tools, step-by-step, and keep the user in control.

Core behavior:
1. For operational requests, call tools instead of describing what you could do.
2. If any required detail is missing (workflow_id, campaign_id, approval_id, API key, etc.), ask a concise clarification question.
3. Keep responses concise and execution-focused.
4. Never fabricate metrics or IDs — use tool results only.
5. Never reveal secret values (API keys, tokens, runtime secrets) back to the user.

Navigation format (use only when useful, at end):
[NAV:/dashboard/route|Button Label →]

Routes:
- /dashboard/command-center
- /dashboard/agent
- /dashboard/sandbox
- /dashboard/inbox
- /dashboard/leads
- /dashboard/outbound
- /dashboard/analytics`;

interface IncomingMessage {
  role?: string;
  text?: string;
  content?: string;
}

interface RuntimeInputPayload {
  key?: string;
  value?: string;
  sensitive?: boolean;
}

interface AgentTraceEvent {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'clarification' | 'final';
  iteration: number;
  tool?: string;
  status?: string;
  summary?: string;
  args?: Record<string, unknown>;
  question?: string;
}

interface RequiredInputPayload {
  key: string;
  label: string;
  question: string;
  sensitive?: boolean;
  expected_format?: string;
  reason?: string;
  source_tool: string;
}

function asText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function safeJsonParse(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string' || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function normalizeMessages(raw: unknown): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!Array.isArray(raw)) return [];

  const output: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const item of raw as IncomingMessage[]) {
    const role = item?.role === 'user' ? 'user' : 'assistant';
    const content = asText(item?.text ?? item?.content ?? '');
    if (!content) continue;
    output.push({ role, content });
  }

  return output;
}

function hydrateToolArgs(
  toolName: string,
  args: Record<string, unknown>,
  runtimeSecrets: Record<string, string>
): Record<string, unknown> {
  const hydrated = { ...args };

  if (toolName === 'scrape_leads_from_url' && !hydrated.apify_api_key && runtimeSecrets.APIFY_API_KEY) {
    hydrated.apify_api_key = runtimeSecrets.APIFY_API_KEY;
  }

  if (toolName === 'set_agent_api_key' && !hydrated.api_key && runtimeSecrets.OPENAI_API_KEY) {
    hydrated.api_key = runtimeSecrets.OPENAI_API_KEY;
  }

  return hydrated;
}

function maskTraceArgs(args: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (/key|token|secret|password/i.test(key)) {
      masked[key] = '[REDACTED]';
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

function summarizeToolResult(result: unknown): string {
  if (!result || typeof result !== 'object') return 'Tool completed';

  const obj = result as Record<string, unknown>;

  if (typeof obj.error === 'string' && obj.error) {
    return `Error: ${obj.error}`;
  }

  if (obj.ok === true) {
    return 'Completed successfully';
  }

  if (Array.isArray(obj.leads)) return `Returned ${obj.leads.length} leads`;
  if (Array.isArray(obj.agents)) return `Returned ${obj.agents.length} agents`;
  if (Array.isArray(obj.nodes)) return `Workflow has ${obj.nodes.length} nodes`;

  return 'Tool completed';
}

function parseNavActions(content: string): { cleaned: string; actions: { href: string; label: string }[] } {
  const actions: { href: string; label: string }[] = [];
  const navRegex = /\[NAV:([^|]+)\|([^\]]+)\]/g;

  let match;
  while ((match = navRegex.exec(content)) !== null) {
    actions.push({ href: match[1].trim(), label: match[2].trim() });
  }

  return {
    cleaned: content.replace(navRegex, '').trim(),
    actions,
  };
}

// ─── POST — Agent chat with tool-call loop ────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as {
      messages?: unknown;
      runtime_input?: RuntimeInputPayload;
      runtime_secrets?: Record<string, string>;
    };

    const normalizedMessages = normalizeMessages(body.messages);

    const runtimeSecrets: Record<string, string> = {};
    if (body.runtime_secrets && typeof body.runtime_secrets === 'object') {
      for (const [k, v] of Object.entries(body.runtime_secrets)) {
        if (typeof v === 'string' && v.trim()) runtimeSecrets[k] = v.trim();
      }
    }

    const runtimeInputKey = asText(body.runtime_input?.key || '');
    const runtimeInputValue = asText(body.runtime_input?.value || '');
    if (runtimeInputKey && runtimeInputValue) {
      runtimeSecrets[runtimeInputKey] = runtimeInputValue;
    }

    const apiKey = runtimeSecrets.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'OPENAI_API_KEY not set. Provide it in environment or pass runtime_secrets.OPENAI_API_KEY.',
      }, { status: 500 });
    }

    const history: Array<{
      role: 'system' | 'user' | 'assistant' | 'tool';
      content: string | null;
      tool_calls?: unknown[];
      tool_call_id?: string;
      name?: string;
    }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'system',
        content: `Internal runtime secrets available: ${Object.keys(runtimeSecrets).length ? Object.keys(runtimeSecrets).join(', ') : 'none'}. Never reveal secret values in responses.`,
      },
      ...normalizedMessages,
    ];

    let iterations = 0;
    let finalText = '';
    const events: AgentTraceEvent[] = [];
    let requiresInput: RequiredInputPayload | null = null;

    const startedAt = Date.now();

    while (iterations < MAX_ITERATIONS) {
      if (Date.now() - startedAt > TIMEOUT_MS) {
        finalText = 'I am taking too long to finish this run. Please retry with a slightly narrower request.';
        break;
      }

      iterations++;
      events.push({ type: 'thinking', iteration: iterations, summary: 'Planning next action' });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: history,
          tools: agentTools,
          tool_choice: 'auto',
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `OpenAI error ${response.status}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const assistantMsg = choice?.message || {};

      history.push({
        role: 'assistant',
        content: typeof assistantMsg.content === 'string' ? assistantMsg.content : null,
        tool_calls: assistantMsg.tool_calls,
      });

      const toolCalls = Array.isArray(assistantMsg.tool_calls) ? assistantMsg.tool_calls : [];

      // No tool calls means final natural-language response
      if (choice?.finish_reason === 'stop' || !toolCalls.length) {
        const rawContent = typeof assistantMsg.content === 'string' ? assistantMsg.content : '';
        const parsed = parseNavActions(rawContent);
        finalText = parsed.cleaned || 'Done.';
        events.push({ type: 'final', iteration: iterations, summary: 'Response ready' });

        return NextResponse.json({
          text: finalText,
          actions: parsed.actions,
          iterations,
          events,
          requires_input: null,
          runtime_secret_keys: Object.keys(runtimeSecrets),
        });
      }

      // Execute tool calls sequentially so we can pause cleanly at first clarification request
      for (const toolCall of toolCalls) {
        const toolName = asText(toolCall?.function?.name || '');
        const rawArgs = safeJsonParse(toolCall?.function?.arguments);
        const args = hydrateToolArgs(toolName, rawArgs, runtimeSecrets);

        events.push({
          type: 'tool_call',
          iteration: iterations,
          tool: toolName,
          args: maskTraceArgs(args),
        });

        const envelope = await executeToolEnvelope(toolName, args);

        events.push({
          type: 'tool_result',
          iteration: iterations,
          tool: toolName,
          status: envelope.status,
          summary: envelope.status === 'needs_user_input'
            ? envelope.request?.question || 'Need user input'
            : envelope.error || summarizeToolResult(envelope.result),
        });

        history.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: JSON.stringify(envelope),
        });

        if (envelope.status === 'needs_user_input' && envelope.request) {
          requiresInput = {
            key: envelope.request.key,
            label: envelope.request.label,
            question: envelope.request.question,
            sensitive: envelope.request.sensitive,
            expected_format: envelope.request.expected_format,
            reason: envelope.request.reason,
            source_tool: toolName,
          };
          break;
        }
      }

      if (requiresInput) {
        events.push({
          type: 'clarification',
          iteration: iterations,
          tool: requiresInput.source_tool,
          question: requiresInput.question,
        });

        finalText = `${requiresInput.question}\n\nReply in chat and I will continue from this exact step.`;
        break;
      }
    }

    if (!finalText) {
      finalText = 'I ran several actions but hit the iteration limit. Please narrow the request and I will continue.';
    }

    return NextResponse.json({
      text: finalText,
      actions: [],
      iterations,
      events,
      requires_input: requiresInput,
      runtime_secret_keys: Object.keys(runtimeSecrets),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── GET — agent config ───────────────────────────────────────────────────────

export async function GET() {
  try {
    const db = createServerClient();
    const { data, error } = await db.from('sales_agents').select('*').limit(1).maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return NextResponse.json({ config: data || null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── PUT — update agent config ────────────────────────────────────────────────

const ALLOWED_FIELDS: (keyof AgentConfig)[] = [
  'business_name', 'business_description', 'brand_voice', 'knowledge_base',
  'model_provider', 'model_version', 'temperature', 'max_tokens',
  'system_prompt', 'fallback_message', 'primary_goal', 'strict_boundaries',
  'llm_billing_mode', 'provider_api_key',
];

export async function PUT(req: NextRequest) {
  try {
    const db = createServerClient();
    const body = await req.json() as Partial<AgentConfig> & { id?: string };

    const patch: Record<string, unknown> = {};
    for (const k of ALLOWED_FIELDS) {
      if (k in body) patch[k] = (body as Record<string, unknown>)[k];
    }
    patch.updated_at = new Date().toISOString();

    let result;
    if (body.id) {
      result = await db.from('sales_agents').update(patch).eq('id', body.id);
    } else {
      const { data: { user } } = await db.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
      }
      result = await db.from('sales_agents').insert({ ...patch, user_id: user.id });
    }

    if (result.error) throw result.error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
