import { NextRequest, NextResponse } from "next/server";
import { MetaAdapter } from "@/core/agent/channels/meta";
import { createServerClient } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

const DEPLOY_VERSION = "2026-04-16-v3";

async function dbInsert(data: Record<string, unknown>): Promise<{ ok: boolean; error: string | null }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from('webhook_queue').insert(data);
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HMAC-SHA256 Signature Verification (Web Crypto — Edge compatible)
// ─────────────────────────────────────────────────────────────────────────────
async function verifySignature(rawBody: string, secret: string, header: string | null): Promise<boolean> {
  if (!header) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = "sha256=" + Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  return header === expected;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Webhook challenge verification
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const mode      = sp.get("hub.mode");
  const token     = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (!VERIFY_TOKEN) {
    return NextResponse.json({ error: "Server Configuration Error: Verify Token missing" }, { status: 500 });
  }

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Receive Meta webhook events
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const ts      = Date.now();

  // ── 1. Signature check ────────────────────────────────────────────────────
  const appSecret = process.env.META_APP_SECRET;
  if (appSecret) {
    const sigHeader = request.headers.get("x-hub-signature-256");
    const valid = await verifySignature(rawBody, appSecret, sigHeader);
    if (!valid) {
      // Log the failure so we can diagnose — but still return 200
      await dbInsert({
        message_id: `sig-fail-${ts}`,
        platform:   "unknown",
        page_id:    "sig_failure",
        lead_id:    "sig_failure",
        status:     "failed",
        error_log:  `Signature mismatch. Received header: ${sigHeader ?? "MISSING"}. Deploy: ${DEPLOY_VERSION}`,
        raw_payload: { body_preview: rawBody.slice(0, 300) },
      });
      // Return 200 so Meta doesn't stop sending
      return NextResponse.json({ received: true, deploy: DEPLOY_VERSION }, { status: 200 });
    }
  }

  // ── 2. Parse JSON ─────────────────────────────────────────────────────────
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── 3. Always log raw payload (BEFORE format-specific processing) ─────────
  // status: "debug" so the cron job never tries to process these audit rows
  await dbInsert({
    message_id: `raw-${ts}-${Math.random().toString(36).slice(2, 6)}`,
    platform:   String(body?.object ?? "unknown"),
    page_id:    "raw_capture",
    lead_id:    "raw_capture",
    status:     "debug",
    raw_payload: body,
  });

  const payloads = MetaAdapter.parsePayload(body);

  for (const p of payloads) {
    const platform = body.object === "instagram" ? "instagram" : "facebook";
    
    await dbInsert({
      message_id: p.message_id,
      platform,
      page_id:    String(p.raw?.recipient?.id || body?.entry?.[0]?.id || ""),
      lead_id:    p.lead_id,
      status:     "pending",
      raw_payload: p.raw,
    });
  }

  return NextResponse.json({ received: true, deploy: DEPLOY_VERSION }, { status: 200 });
}
