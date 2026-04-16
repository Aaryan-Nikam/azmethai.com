/**
 * POST /api/outbound/send
 * Stage 5 — Outbound Sender (Gmail native via Nodemailer).
 * Sends a personalised draft email and updates the message + lead stage.
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD in .env.local.
 *
 * Body: { message_id: string }
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
import nodemailer from 'nodemailer';

// ─── Gmail transporter (singleton per request) ────────────────────────────────

function createGmailTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      'GMAIL_USER and GMAIL_APP_PASSWORD must be set in .env.local. ' +
      'Generate an App Password at myaccount.google.com/apppasswords.',
    );
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { message_id } = await req.json() as { message_id: string };
    if (!message_id) return NextResponse.json({ error: 'message_id required' }, { status: 400 });

    const db = createOutboundClient();

    // Fetch the message with lead data and campaign data joined
    const { data: message, error: msgErr } = await db
      .from('outbound_messages')
      .select('*, outbound_leads!inner(first_name, last_name, email, company, stage), outbound_campaigns!inner(config)')
      .eq('id', message_id)
      .single();

    if (msgErr || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.status === 'sent') {
      return NextResponse.json({ ok: true, skipped: true, note: 'Already sent' });
    }

    const lead = message.outbound_leads as unknown as {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      company: string | null;
      stage: string;
    };

    const campaign = message.outbound_campaigns as unknown as {
      config: { gmail_accounts?: { email: string; password: string }[] };
    };

    if (!lead?.email) {
      return NextResponse.json(
        { error: 'Lead has no email address — cannot send' },
        { status: 422 },
      );
    }

    if (!message.subject || !message.body) {
      return NextResponse.json(
        { error: 'Message has no subject or body — run personalise first' },
        { status: 422 },
      );
    }

    // ── Configure Gmail Transport ─────────────────────────────────────────────
    let user = process.env.GMAIL_USER;
    let pass = process.env.GMAIL_APP_PASSWORD;

    // Use dynamic accounts if available (pick random to distribute load if multiple)
    const accounts = campaign.config?.gmail_accounts ?? [];
    if (accounts.length > 0) {
      const selected = accounts[Math.floor(Math.random() * accounts.length)];
      user = selected.email;
      pass = selected.password;
    }

    if (!user || !pass) {
      return NextResponse.json(
        { error: 'GMAIL_USER and GMAIL_APP_PASSWORD not set in campaign config or .env.local' },
        { status: 400 },
      );
    }

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    const senderName = process.env.GMAIL_SENDER_NAME ?? 'Outbound Engine';

    const mailOptions = {
      from: `"${senderName}" <${user}>`,
      to: lead.email,
      subject: message.subject,
      text: message.body,
      // Nicely formatted HTML version
      html: `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; max-width: 600px;">
${message.body.split('\n').map((line: string) => `<p style="margin: 0 0 12px 0;">${line}</p>`).join('')}
</div>`,
    };

    await transport.sendMail(mailOptions);

    // ── Update message + lead stage ───────────────────────────────────────────
    const sentAt = new Date().toISOString();
    await db
      .from('outbound_messages')
      .update({ status: 'sent', sent_at: sentAt })
      .eq('id', message_id);

    await db
      .from('outbound_leads')
      .update({ stage: 'sent' })
      .eq('id', message.lead_id);

    return NextResponse.json({
      ok: true,
      message_id,
      lead_email: lead.email,
      sent_at: sentAt,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[send]', msg);

    // If it's the "credentials not configured" error, return a helpful 400
    if (msg.includes('GMAIL_USER')) {
      return NextResponse.json({ error: msg }, { status: 400 });
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
