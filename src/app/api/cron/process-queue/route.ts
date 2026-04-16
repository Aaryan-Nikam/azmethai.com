import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processWebhookJob, WebhookQueueRow } from "@/core/agent/engine";
import { processOutboundJob, OutboundQueueRow } from "@/lib/outbound-jobs";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // ── Cron secret guard ──────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Atomically claim pending webhook jobs
    const webhookRes = await supabase.rpc('claim_webhook_jobs', { batch_size: 5 });
    
    // 2. Atomically claim pending outbound AI jobs
    const outboundRes = await supabase.rpc('claim_outbound_jobs', { batch_size: 5 });

    let webhookCount = 0;
    let outboundCount = 0;

    const allPromises: Promise<any>[] = [];

    // Process webhook jobs
    if (webhookRes.data && webhookRes.data.length > 0) {
      webhookCount = webhookRes.data.length;
      allPromises.push(
        ...webhookRes.data.map((job: WebhookQueueRow) => processWebhookJob(supabase, job))
      );
    }

    // Process outbound jobs
    if (outboundRes.data && outboundRes.data.length > 0) {
      outboundCount = outboundRes.data.length;
      allPromises.push(
        ...outboundRes.data.map((job: OutboundQueueRow) => processOutboundJob(supabase, job))
      );
    }

    // Await all concurrent executions
    if (allPromises.length > 0) {
      await Promise.allSettled(allPromises);
    }

    return NextResponse.json({ 
      success: true, 
      processed: {
        webhooks: webhookCount,
        outbound: outboundCount
      }
    }, { status: 200 });

  } catch (err: any) {
    console.error("Cron processing error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

