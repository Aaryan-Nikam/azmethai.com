/**
 * Unified webhook handler for all inbound platforms.
 * Route: POST /api/webhooks/[platform]
 * GET is used for Meta webhook verification (WhatsApp & Instagram)
 *
 * Flow:
 *   1. Normalize platform-specific payload → IncomingMessage
 *   2. Verify signature (Meta platforms)
 *   3. Insert into message_queue
 *   4. Kick off async processing (classify → route → draft reply)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { classifyIntent } from '@/lib/intent-classifier';
import { routeToAgent, generateAgentReply } from '@/lib/agent-router';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

type Platform = 'whatsapp' | 'instagram' | 'email' | string;

interface IncomingMessage {
  platform: Platform;
  external_id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  metadata: Record<string, unknown>;
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeMetaPayload(platform: 'whatsapp' | 'instagram', body: unknown): IncomingMessage | null {
  try {
    const b = body as Record<string, unknown>;
    const entry = (b.entry as unknown[])?.[0] as Record<string, unknown>;
    const changes = (entry?.changes as unknown[])?.[0] as Record<string, unknown>;
    const value = changes?.value as Record<string, unknown>;
    const messages = value?.messages as unknown[];
    if (!messages?.length) return null;

    const msg = messages[0] as Record<string, unknown>;
    const contacts = value?.contacts as unknown[];
    const contact = contacts?.[0] as Record<string, unknown>;

    return {
      platform,
      external_id: msg.id as string,
      sender_id: msg.from as string,
      sender_name: (contact?.profile as Record<string, unknown>)?.name as string || msg.from as string,
      body: (msg.text as Record<string, unknown>)?.body as string || (msg.caption as string) || '',
      metadata: { entry: entry?.id, phone_number_id: (value?.metadata as Record<string, unknown>)?.phone_number_id },
    };
  } catch {
    return null;
  }
}

function normalizeEmailPayload(body: unknown): IncomingMessage | null {
  try {
    const b = body as Record<string, unknown>;
    const from = b.from as string;
    const emailMatch = from?.match(/<(.+)>/) || [null, from];
    const nameMatch = from?.match(/^([^<]+)</) || [null, null];

    return {
      platform: 'email',
      external_id: b['Message-Id'] as string || b.message_id as string || crypto.randomUUID(),
      sender_id: emailMatch[1] || from,
      sender_name: nameMatch[1]?.trim() || emailMatch[1] || from,
      body: b.text as string || b.plain as string || '',
      metadata: { subject: b.subject, to: b.to },
    };
  } catch {
    return null;
  }
}

// ─── Meta signature verification ──────────────────────────────────────────────

function verifyMetaSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return true; // Skip in dev if not configured
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ''));
}

// ─── Message Processor (async — runs after response is sent) ─────────────────

async function processMessage(queueId: string, incoming: IncomingMessage): Promise<void> {
  const db = createServerClient();

  try {
    // Get context window (last 3 messages from this sender)
    const { data: prior } = await db
      .from('message_queue')
      .select('body, final_reply')
      .eq('sender_id', incoming.sender_id)
      .eq('platform', incoming.platform)
      .not('final_reply', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3);

    const contextWindow = (prior || [])
      .reverse()
      .flatMap(m => [m.body, m.final_reply].filter(Boolean) as string[]);

    // 1. Classify intent (with context)
    const { intent, confidence } = await classifyIntent(incoming.body, contextWindow);

    // 1b. Resolve tenant user_id from platform_connections
    const { data: connection } = await db
      .from('platform_connections')
      .select('user_id')
      .eq('platform', incoming.platform)
      .limit(1)
      .maybeSingle();

    const userId: string = connection?.user_id ?? '';

    // 2. Route to appropriate agent
    const agent = await routeToAgent(intent, userId, db);
    if (!agent) {
      await db.from('message_queue').update({ status: 'failed', processed_at: new Date().toISOString() }).eq('id', queueId);
      return;
    }

    // 3. Generate draft reply
    const historyFormatted = (prior || []).reverse().flatMap(m => [
      { role: 'user' as const, content: m.body },
      ...(m.final_reply ? [{ role: 'assistant' as const, content: m.final_reply }] : []),
    ]);

    const draftReply = await generateAgentReply(agent, historyFormatted, incoming.body);

    // 4. Update message_queue with results
    await db.from('message_queue').update({
      status: 'done',
      classified_intent: intent,
      assigned_agent_id: agent.id,
      draft_reply: draftReply,
      final_reply: draftReply, // Auto-send (no approval needed for caught intents with high confidence)
      context_window: contextWindow,
      processed_at: new Date().toISOString(),
    }).eq('id', queueId);

    // 5. Upsert lead into chat_leads for tracking
    await db.from('chat_leads').upsert({
      lead_id: `${incoming.platform}_${incoming.sender_id}`,
      channel: incoming.platform,
      sender_contact: incoming.sender_id,
      sender_name: incoming.sender_name,
      last_seen: new Date().toISOString(),
      status: 'contacted',
      last_intent: intent,
    }, { onConflict: 'lead_id', ignoreDuplicates: false });

  } catch (err) {
    console.error('[webhook processor] error:', err);
    await db.from('message_queue').update({ status: 'failed' }).eq('id', queueId);
  }
}

// ─── GET — Meta webhook verification ─────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: { platform: string } }) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (!verifyToken) {
    return NextResponse.json({ error: 'Server Configuration Error: Verify Token missing' }, { status: 500 });
  }

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// ─── POST — Receive webhook ───────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: { platform: string } }) {
  const platform = params.platform as Platform;
  const rawBody = await req.text();

  // Signature verification for Meta platforms
  if (platform === 'whatsapp' || platform === 'instagram') {
    const sig = req.headers.get('x-hub-signature-256') || '';
    if (!verifyMetaSignature(rawBody, sig)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let incoming: IncomingMessage | null = null;

  try {
    const body = JSON.parse(rawBody);

    if (platform === 'whatsapp') {
      incoming = normalizeMetaPayload('whatsapp', body);
    } else if (platform === 'instagram') {
      incoming = normalizeMetaPayload('instagram', body);
    } else if (platform === 'email') {
      incoming = normalizeEmailPayload(body);
    } else {
      // Generic platform — treat raw body as message
      incoming = {
        platform,
        external_id: crypto.randomUUID(),
        sender_id: (body.sender_id as string) || 'unknown',
        sender_name: (body.sender_name as string) || 'Unknown',
        body: (body.message || body.text || body.body || '') as string,
        metadata: body,
      };
    }
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Ignore non-message events (status updates, etc.)
  if (!incoming || !incoming.body?.trim()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const db = createServerClient();

  // Dedup check — insert into queue (ignores if external_id already exists)
  const { data: queued, error } = await db
    .from('message_queue')
    .insert({
      platform: incoming.platform,
      external_id: incoming.external_id,
      sender_id: incoming.sender_id,
      sender_name: incoming.sender_name,
      body: incoming.body,
      metadata: incoming.metadata,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    // If it's a unique constraint violation (dedup), just return OK
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, deduped: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return 200 immediately — process async (don't block the webhook response)
  // Using waitUntil pattern via background processing
  const queueId = queued.id;
  processMessage(queueId, incoming).catch(err =>
    console.error('[webhook] async processing error:', err)
  );

  return NextResponse.json({ ok: true, queued: queueId });
}
