import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, AgentConfig } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const ALLOWED_FIELDS: (keyof AgentConfig)[] = [
  'business_name', 'business_description', 'brand_voice', 'knowledge_base',
  'model_provider', 'model_version', 'temperature', 'max_tokens',
  'system_prompt', 'fallback_message', 'primary_goal', 'strict_boundaries',
  'llm_billing_mode', 'provider_api_key',
];

// ─── GET /api/agent-config ────────────────────────────────────────────────────
export async function GET() {
  try {
    const db = createServerClient();
    const { data, error } = await db.from('sales_agents').select('*').limit(1).single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return NextResponse.json({ config: data || null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── PUT /api/agent-config ────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const db = createServerClient();
    const body = await req.json() as Partial<AgentConfig> & { id?: string };

    // Sanitise
    const patch: Record<string, unknown> = {};
    for (const k of ALLOWED_FIELDS) {
      if (k in body) patch[k] = (body as Record<string, unknown>)[k];
    }
    patch.updated_at = new Date().toISOString();

    let result;
    if (body.id) {
      result = await db.from('sales_agents').update(patch).eq('id', body.id);
    } else {
      // No row yet — insert
      result = await db.from('sales_agents').insert({ ...patch, user_id: '00000000-0000-0000-0000-000000000000' });
    }

    if (result.error) throw result.error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST /api/agent-config — Keep existing chat handler ─────────────────────
const SYSTEM_PROMPT = `You are Azmeth Agent — the embedded AI assistant inside the Azmeth OS platform. 
Azmeth OS is an AI-native operations platform where businesses run autonomous AI Employees across two primary Systems: 
1. Sales Engine — AI-powered outbound pipeline (lead targeting → closed-won deals)
2. Distribution System — Content and ad production + multi-channel distribution

Your job is to help users navigate and configure the platform. When a user wants to go somewhere specific, 
include a special navigation marker at the END of your response using exactly this format on its own line:
[NAV:/dashboard/route-name|Button Label →]

Available routes:
- /dashboard/command-center → Platform overview and dashboard
- /dashboard/employees → AI Employees hub (create/manage agents)
- /dashboard/systems → Sales Engine & Distribution System 
- /dashboard/sandbox → Visual canvas for building workflows
- /dashboard/library → Workflow and tool catalog
- /dashboard/monitoring → Audit logs and analytics
- /dashboard/inbox → Live conversation inbox
- /dashboard/leads → Leads CRM
- /dashboard/analytics → Analytics dashboard

Rules:
- Be concise and direct. Max 3 short paragraphs.
- Only suggest navigation when it genuinely helps the user take action.
- You know the platform inside out. Be confident, not generic.
- If someone asks about a feature that doesn't exist yet, be honest but optimistic.`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set in .env.local' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m: { role: string; text: string }) => ({
            role: m.role === 'agent' ? 'assistant' : 'user',
            content: m.text,
          })),
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `OpenAI error ${response.status}`);
    }

    const data = await response.json();
    const content: string = data.choices[0].message.content;
    const navRegex = /\[NAV:([^|]+)\|([^\]]+)\]/g;
    const actions: { href: string; label: string }[] = [];
    let match;
    while ((match = navRegex.exec(content)) !== null) {
      actions.push({ href: match[1].trim(), label: match[2].trim() });
    }
    const text = content.replace(navRegex, '').trim();
    return NextResponse.json({ text, actions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
