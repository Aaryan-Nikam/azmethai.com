export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, ChatLead, ChatMessage } from '@/lib/supabase';

// ─── GET /api/inbox ───────────────────────────────────────────────────────────
// Returns all active threads with the last message previewed.
export async function GET() {
  try {
    const db = createServerClient();

    // Fetch all leads sorted by most recent activity
    const { data: leads, error: leadsError } = await db
      .from('chat_leads')
      .select('*')
      .order('last_seen', { ascending: false });

    if (leadsError) throw leadsError;

    // For each lead, fetch the last 2 messages to build a preview
    const threads = await Promise.all(
      (leads as ChatLead[]).map(async (lead) => {
        const { data: msgs } = await db
          .from('n8n_chat_histories')
          .select('id, session_id, message')
          .eq('session_id', lead.lead_id)
          .order('id', { ascending: false })
          .limit(2);

        const messages = ((msgs as ChatMessage[]) || []).reverse();
        const lastMsg = messages[messages.length - 1];
        return {
          ...lead,
          lastMessage: lastMsg?.message?.content?.slice(0, 120) || '',
          messageCount: messages.length,
        };
      })
    );

    return NextResponse.json({ threads });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── GET /api/inbox?lead_id=xxx ───────────────────────────────────────────────
// Handled by GET above with optional query param:
// If lead_id provided, returns full message history for that thread.
export async function POST(req: NextRequest) {
  try {
    const db = createServerClient();
    const { lead_id, text } = await req.json() as { lead_id: string; text: string };

    if (!lead_id || !text?.trim()) {
      return NextResponse.json({ error: 'lead_id and text required' }, { status: 400 });
    }

    // 1. Persist manual message to n8n_chat_histories
    const { error: insertErr } = await db.from('n8n_chat_histories').insert({
      session_id: lead_id,
      message: {
        type: 'human',
        content: text.trim(),
        additional_kwargs: { manual: true },
        response_metadata: {},
      },
    });
    if (insertErr) throw insertErr;

    // 2. Update lead's last_seen
    await db.from('chat_leads').update({ last_seen: new Date().toISOString() }).eq('lead_id', lead_id);

    // 3. Forward to n8n webhook to let the pipeline route the reply
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl) {
      try {
        await fetch(`${n8nUrl}/manual-reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id, message: text.trim(), source: 'dashboard_manual' }),
          signal: AbortSignal.timeout(4000), // non-blocking, 4s timeout
        });
      } catch {
        // n8n unavailable — message is still persisted; don't fail the request
        console.warn('[inbox] n8n webhook unavailable, message saved locally only');
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
