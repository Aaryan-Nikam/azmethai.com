import { NextRequest, NextResponse } from "next/server";
import { MetaAdapter } from "@/core/agent/channels/meta";

export const runtime = 'edge';

const DEPLOY_VERSION = "2026-04-16-v3"; // Updated deploy version

// ─────────────────────────────────────────────────────────────────────────────
// Supabase raw fetch helper — service_role only, bypasses all RLS
// ─────────────────────────────────────────────────────────────────────────────
async function dbInsert(data: Record<string, unknown>): Promise<{ ok: boolean; error: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: false, error: "Missing Supabase credentials" };

  const res = await fetch(`${url}/rest/v1/webhook_queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      // return=minimal → no body, just 201/409. ignore-duplicates → silent on dup key
      "Prefer": "return=minimal,resolution=ignore-duplicates",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    return { ok: false, error: await res.text() };
  }
  return { ok: true, error: null };
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

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "azmeth_secure_token";

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
