import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, ChatLead, ChatMessage } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ─── GET /api/inbox ───────────────────────────────────────────────────────────
// Returns all active threads with the last message previewed.
export async function GET() {
  try {
    const db = createServerClient();

    // Fetch all leads sorted by most recent activity
    const { data: leads, error: leadsError } = await db
      .from('chat_leads')
      .select('*')
      .order('last_seen', { ascending: false })
      .limit(50); // Pagination scale

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
        
        // P2-4: Properly flatten the JSON nested content for the preview
        const contentStr = lastMsg?.message?.content || 
                           (lastMsg?.message as any)?.message?.content || '';
        
        return {
          ...lead,
          lastMessage: contentStr.slice(0, 120),
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

    // 3. Forward to channel
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl) {
      // Use existing n8n pipeline if configured
      try {
        await fetch(`${n8nUrl}/manual-reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id, message: text.trim(), source: 'dashboard_manual' }),
          signal: AbortSignal.timeout(4000), // non-blocking, 4s timeout
        });
      } catch {
        console.warn('[inbox] n8n webhook unavailable, message saved locally only');
      }
    } else {
      // P2-2: Fallback to Meta API directly using platform_connections
      try {
        const platform = lead_id.startsWith('ig_') ? 'instagram' : 'whatsapp';
        // Note: For a true production app you'd fetch the specific page/number associated with the lead.
        // For this fallback, we get the first active connection.
        const { data: conn } = await db.from('platform_connections')
                                       .select('access_token, page_id')
                                       .eq('platform', platform)
                                       .eq('is_active', true)
                                       .single();
        if (conn && conn.access_token) {
          const apiVersion = process.env.META_API_VERSION || 'v20.0';
          const recipientId = lead_id.replace(/^ig_|^wa_/, ''); // Strip prefix
          
          let endpoint = '';
          let body = {};
          
          if (platform === 'instagram') {
            endpoint = `https://graph.facebook.com/${apiVersion}/${conn.page_id}/messages?access_token=${conn.access_token}`;
            body = { recipient: { id: recipientId }, message: { text: text.trim() } };
          } else {
            // WhatsApp business API
            endpoint = `https://graph.facebook.com/${apiVersion}/${conn.page_id}/messages`;
            body = {
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: recipientId,
              type: 'text',
              text: { body: text.trim() }
            };
          }
          
          await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(platform === 'whatsapp' ? { 'Authorization': `Bearer ${conn.access_token}` } : {})
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(4000)
          });
        }
      } catch (err) {
        console.warn('[inbox] Meta Graph API fallback delivery failed: ', err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
