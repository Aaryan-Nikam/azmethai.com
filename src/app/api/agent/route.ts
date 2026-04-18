/**
 * /api/agent — Azmeth Agent with full tool-call loop
 * 
 * POST: Chat with the agent — tool calls execute automatically against live data
 * GET:  Fetch agent config
 * PUT:  Update agent config
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, AgentConfig } from '@/lib/supabase';
import { agentTools } from '@/lib/agent-tools';
import { executeTool } from '@/lib/tool-executor';

export const dynamic = 'force-dynamic';

const MAX_ITERATIONS = 8; // Cap tool-call chains to prevent runaway loops

const SYSTEM_PROMPT = `You are Azmeth Agent — an embedded AI operations assistant inside the Azmeth OS platform.

Azmeth OS is an AI-native sales operations platform with two core systems:
1. AI Setter (Sales Engine) — AI-powered inbound qualification: qualifies leads from Instagram, WhatsApp, Email, LinkedIn, Voice → books meetings
2. Outbound Engine — Intent-driven B2B outreach: scrape → qualify → personalize → send → reply

You have access to live tools that let you query and control the platform in real time. Use them proactively — don't just describe what you could check, actually check it.

When a user asks "how many leads today?" → call get_setter_stats.
When a user says "create a campaign for SaaS companies" → call create_campaign.
When a user says "show me who replied" → call get_inbox_threads with the right filters.

Navigation format (use when genuinely helpful, at end of response):
[NAV:/dashboard/route|Button Label →]

Available routes:
- /dashboard/command-center → Platform overview
- /dashboard/employees → AI Employees
- /dashboard/systems → Sales & Distribution Systems  
- /dashboard/sandbox → Workflow canvas
- /dashboard/inbox → Live conversation inbox
- /dashboard/leads → Unified leads CRM
- /dashboard/outbound → Outbound campaigns
- /dashboard/analytics → Analytics

Rules:
- Be concise. Use tools before answering data questions.
- Show numbers from actual tool results, not estimates.
- When you create something (campaign, node, agent), confirm it with the tool response.`;

// ─── POST — Agent chat with tool-call loop ────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });
  }

  try {
    const { messages } = await req.json();

    // Build initial message history in OpenAI format
    const history: Array<{
      role: 'system' | 'user' | 'assistant' | 'tool';
      content: string | null;
      tool_calls?: unknown[];
      tool_call_id?: string;
      name?: string;
    }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; text: string }) => ({
        role: m.role === 'agent' ? 'assistant' as const : 'user' as const,
        content: m.text,
      })),
    ];

    let iterations = 0;
    let finalText = '';
    const actions: { href: string; label: string }[] = [];

    // Tool-call loop — runs until finish_reason === 'stop' or cap reached
    while (iterations < MAX_ITERATIONS) {
      iterations++;

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
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `OpenAI error ${response.status}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      const assistantMsg = choice.message;

      // Add assistant's message (with or without tool calls) to history
      history.push({
        role: 'assistant',
        content: assistantMsg.content,
        tool_calls: assistantMsg.tool_calls,
      });

      // If no tool calls → final response
      if (choice.finish_reason === 'stop' || !assistantMsg.tool_calls?.length) {
        const content: string = assistantMsg.content || '';
        const navRegex = /\[NAV:([^|]+)\|([^\]]+)\]/g;
        let match;
        while ((match = navRegex.exec(content)) !== null) {
          actions.push({ href: match[1].trim(), label: match[2].trim() });
        }
        finalText = content.replace(navRegex, '').trim();
        break;
      }

      // Execute all tool calls in parallel
      const toolResults = await Promise.all(
        assistantMsg.tool_calls.map(async (toolCall: { id: string; function: { name: string; arguments: string } }) => {
          const args = JSON.parse(toolCall.function.arguments || '{}');
          const result = await executeTool(toolCall.function.name, args);
          return {
            role: 'tool' as const,
            content: result,
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
          };
        })
      );

      // Append tool results to history and loop
      history.push(...toolResults);
    }

    // Cap hit without stop — return last tool result context
    if (!finalText && iterations >= MAX_ITERATIONS) {
      finalText = 'I ran several checks but hit the iteration limit. Try asking a more specific question.';
    }

    return NextResponse.json({ text: finalText, actions, iterations });
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
      result = await db.from('sales_agents').insert({ ...patch, user_id: '00000000-0000-0000-0000-000000000000' });
    }

    if (result.error) throw result.error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
