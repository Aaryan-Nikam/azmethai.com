import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, ChatLead, LeadStatus } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = createServerClient();
    const { data, error } = await db
      .from('chat_leads')
      .select('*')
      .order('last_seen', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ leads: data as ChatLead[] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = createServerClient();
    const body = await req.json();
    const { lead_id, ...updates } = body as { lead_id: string } & Partial<ChatLead>;

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id required' }, { status: 400 });
    }

    // Sanitise: only allow safe fields to be updated
    const allowed: (keyof ChatLead)[] = ['status', 'starred', 'paused', 'agent_name', 'company_name', 'role_title'];
    const patch: Record<string, unknown> = {};
    for (const k of allowed) {
      if (k in updates) patch[k] = (updates as Record<string, unknown>)[k];
    }

    const { error } = await db.from('chat_leads').update(patch).eq('lead_id', lead_id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
