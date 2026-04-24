/**
 * POST /api/outbound/send
 * Stage 5 — Outbound Sender (Gmail or SMTP via Nodemailer).
 * Sends a personalised draft email and updates the message + lead stage.
 *
 * Body: { message_id?: string, lead_id?: string, dry_run?: boolean }
 *
 * Setup:
 *   1. Enable 2FA on your Gmail account
 *   2. Go to myaccount.google.com/apppasswords
 *   3. Generate an "App Password" for "Mail"
 *   4. Add to .env.local:
 *      GMAIL_USER=yoursender@gmail.com
 *      GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 *
 * Install: npm install nodemailer @types/nodemailer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOutboundClient } from '@/lib/outbound';
import { resolveLatestDraftMessageIdForLead, sendOutboundMessageById } from '@/lib/outbound-email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as {
      message_id?: string;
      lead_id?: string;
      dry_run?: boolean;
    };

    let messageId = typeof body.message_id === 'string' ? body.message_id.trim() : '';
    const leadId = typeof body.lead_id === 'string' ? body.lead_id.trim() : '';
    if (!messageId && !leadId) {
      return NextResponse.json({ error: 'message_id or lead_id required' }, { status: 400 });
    }

    if (!messageId && leadId) {
      const resolved = await resolveLatestDraftMessageIdForLead(leadId);
      if (!resolved) {
        return NextResponse.json({ error: 'No draft message found for this lead' }, { status: 404 });
      }
      messageId = resolved;
    }

    const result = await sendOutboundMessageById(messageId, { dryRun: Boolean(body.dry_run) });
    return NextResponse.json(result);

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[send]', msg);

    if (msg.toLowerCase().includes('not configured')) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (msg.toLowerCase().includes('daily limit')) {
      return NextResponse.json({ error: msg }, { status: 429 });
    }
    if (msg.toLowerCase().includes('not found')) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    if (msg.toLowerCase().includes('no email address') || msg.toLowerCase().includes('no subject or body')) {
      return NextResponse.json({ error: msg }, { status: 422 });
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/outbound/send?campaign_id=xxx
 * Returns sent messages for a campaign with basic stats.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campaign_id = searchParams.get('campaign_id');

    const db = createOutboundClient();
    const query = db
      .from('outbound_messages')
      .select('id, lead_id, channel, subject, status, sent_at, framework')
      .order('sent_at', { ascending: false });

    if (campaign_id) query.eq('campaign_id', campaign_id);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ messages: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
