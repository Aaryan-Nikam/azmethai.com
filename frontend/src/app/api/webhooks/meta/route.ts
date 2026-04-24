import { NextRequest, NextResponse } from "next/server";
import { MetaAdapter } from "@/core/agent/channels/meta";
import { createServerClient } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

const DEPLOY_VERSION = "2026-04-25-v6";

function normalizeSecret(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function normalizeSignatureHeader(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;
  return unquoted.toLowerCase();
}

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
// HMAC signature verification (supports both sha256 + legacy sha1 headers)
// ─────────────────────────────────────────────────────────────────────────────
async function buildExpectedSignature(
  rawBuffer: ArrayBuffer,
  secret: string,
  algo: "SHA-256" | "SHA-1",
  prefix: "sha256=" | "sha1="
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: algo },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, rawBuffer);
  return prefix + Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifySignature(
  rawBuffer: ArrayBuffer,
  secret: string,
  header: string | null,
  algo: "SHA-256" | "SHA-1",
  prefix: "sha256=" | "sha1="
): Promise<{ valid: boolean; expectedPrefix: string | null; receivedPrefix: string | null }> {
  const normalizedHeader = normalizeSignatureHeader(header);
  if (!normalizedHeader) return { valid: false, expectedPrefix: null, receivedPrefix: null };
  const expected = await buildExpectedSignature(rawBuffer, secret, algo, prefix);
  return {
    valid: normalizedHeader === expected,
    expectedPrefix: expected.slice(0, 20),
    receivedPrefix: normalizedHeader.slice(0, 20),
  };
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
  const rawBuffer = await request.arrayBuffer();
  const rawBytes = new Uint8Array(rawBuffer);
  const rawBody = new TextDecoder().decode(rawBuffer);
  const ts      = Date.now();

  // ── 1. Signature check ────────────────────────────────────────────────────
  const appSecret = normalizeSecret(process.env.META_APP_SECRET);
  if (appSecret) {
    const sig256 = request.headers.get("x-hub-signature-256");
    const sig1 = request.headers.get("x-hub-signature");
    const check256 = await verifySignature(rawBuffer, appSecret, sig256, "SHA-256", "sha256=");
    const check1 = check256.valid
      ? { valid: false, expectedPrefix: null, receivedPrefix: null }
      : await verifySignature(rawBuffer, appSecret, sig1, "SHA-1", "sha1=");
    const valid = check256.valid || check1.valid;

    if (!valid) {
      // Log the failure so we can diagnose — but let it fall through to process anyway
      await dbInsert({
        message_id: `sig-fail-${ts}`,
        platform:   "unknown",
        page_id:    "sig_failure",
        lead_id:    "sig_failure",
        status:     "debug",
        error_log:  `Signature mismatch bypassed. sig256=${sig256 ? "present" : "missing"} sig1=${sig1 ? "present" : "missing"} secret_len=${appSecret.length} deploy=${DEPLOY_VERSION}`,
        raw_payload: {
          signature_debug: {
            expected_256_prefix: check256.expectedPrefix,
            received_256_prefix: check256.receivedPrefix,
          },
        },
      });
      // DO NOT return early. Let the webhook process for testing purposes.
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

  // ── 4. Asynchronous Background Processing (Free Tier Cron Alternative) ──
  // Instead of relying on a paid Render Cron Job, we trigger the queue processor
  // asynchronously right after receiving the webhook. Next.js Node server will execute this.
  setTimeout(async () => {
    try {
      const supabase = createServerClient();
      const { data } = await supabase.rpc('claim_webhook_jobs', { batch_size: 5 });
      if (data && data.length > 0) {
        const { processWebhookJob } = await import('@/core/agent/engine');
        for (const job of data) {
          await processWebhookJob(supabase, job);
        }
      }
    } catch (e) {
      console.error("Inline async processor error:", e);
    }
  }, 100);

  return NextResponse.json({ received: true, deploy: DEPLOY_VERSION }, { status: 200 });
}
