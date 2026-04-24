import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();
    const db = createServerClient();

    // Map UI data schema to the sales_agents table
    const payload = {
      business_name: formData.businessName || '',
      business_description: formData.businessContext || '',
      brand_voice: formData.voice || '',
      knowledge_base: formData.calendlyUrl || '', // Treat Calendly as a literal knowledge/config link for now
      system_prompt: `Framework: ${formData.framework}\\nWorkflows: ${formData.workflows?.join(', ') || ''}\\nTools: ${formData.tools?.join(', ') || ''}`,
      primary_goal: formData.objective || '',
      updated_at: new Date().toISOString()
    };

    // Sales Agent configuration usually uses a singleton row in a single-tenant design.
    // We check if a row exists, else insert
    const { data: existingAgents, error: selErr } = await db.from('sales_agents').select('id').limit(1);
    
    if (selErr) throw selErr;

    if (existingAgents && existingAgents.length > 0) {
      const agentId = existingAgents[0].id;
      const { error: upErr } = await db.from('sales_agents').update(payload).eq('id', agentId);
      if (upErr) throw upErr;
      return NextResponse.json({ ok: true, id: agentId });
    } else {
      const { data, error: insErr } = await db.from('sales_agents').insert(payload).select('id').single();
      if (insErr) throw insErr;
      return NextResponse.json({ ok: true, id: data.id });
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to update sales_agents config:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
