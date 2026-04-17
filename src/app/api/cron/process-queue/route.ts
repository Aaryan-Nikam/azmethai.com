import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { processWebhookJob, WebhookQueueRow } from "@/core/agent/engine";
import { processOutboundJob, OutboundQueueRow } from "@/lib/outbound-jobs";

export const dynamic = 'force-dynamic';

const TIMEOUT_MS = 60000; // 60 seconds

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Job execution timed out')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

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
    const supabase = createServerClient();


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
        ...webhookRes.data.map((job: WebhookQueueRow) => 
          withTimeout(processWebhookJob(supabase, job), TIMEOUT_MS)
        )
      );
    }

    // Process outbound jobs
    if (outboundRes.data && outboundRes.data.length > 0) {
      outboundCount = outboundRes.data.length;
      allPromises.push(
        ...outboundRes.data.map((job: OutboundQueueRow) => 
          withTimeout(processOutboundJob(supabase, job), TIMEOUT_MS)
        )
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

