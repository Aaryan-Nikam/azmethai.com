export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// ─── GET /api/inbox/messages?lead_id=xxx ─────────────────────────────────────
// Returns paginated message history for a specific lead thread.
export async function GET(req: NextRequest) {
  try {
    const db = createServerClient();
    const leadId = req.nextUrl.searchParams.get('lead_id');

    if (!leadId) {
      return NextResponse.json({ error: 'lead_id query param required' }, { status: 400 });
    }

    const { data, error } = await db
      .from('n8n_chat_histories')
      .select('id, session_id, message')
      .eq('session_id', leadId)
      .order('id', { ascending: true })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ messages: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
