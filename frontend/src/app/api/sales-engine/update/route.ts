import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();
    const db = createServerClient();

    // ── Map UI formData fields → sales_agents DB columns ─────────────────────
    // UI sends: { channels, integrations, identity, framework, knowledge_files, workflows, tools }
    const payload = {
      // identity → brand_voice (the selected sales persona role)
      brand_voice: formData.identity || 'consultative',

      // knowledge_files → knowledge_base (stored as comma-separated file names)
      knowledge_base: Array.isArray(formData.knowledge_files)
        ? formData.knowledge_files.join(', ')
        : '',

      // Compose system_prompt from framework + workflows + tools + channels
      system_prompt: [
        `Framework: ${formData.framework || 'react'}`,
        `Channels: ${(formData.channels || []).join(', ') || 'none'}`,
        `Integrations: ${(formData.integrations || []).join(', ') || 'none'}`,
        `Workflows: ${(formData.workflows || []).join(', ') || 'none'}`,
        `Tools: ${(formData.tools || []).join(', ') || 'none'}`,
      ].join('\n'),

      // primary_goal defaults to lead_generation for the AI Setter
      primary_goal: 'lead_generation',

      updated_at: new Date().toISOString(),
    };

    // Singleton row design — upsert against existing agent row
    const { data: existingAgents, error: selErr } = await db
      .from('sales_agents')
      .select('id')
      .limit(1);

    if (selErr) throw selErr;

    if (existingAgents && existingAgents.length > 0) {
      const agentId = existingAgents[0].id;
      const { error: upErr } = await db
        .from('sales_agents')
        .update(payload)
        .eq('id', agentId);
      if (upErr) throw upErr;
      return NextResponse.json({ ok: true, id: agentId });
    } else {
      const { data, error: insErr } = await db
        .from('sales_agents')
        .insert(payload)
        .select('id')
        .single();
      if (insErr) throw insErr;
      return NextResponse.json({ ok: true, id: data.id });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to update sales_agents config:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
