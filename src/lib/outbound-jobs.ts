/**
 * outbound-jobs.ts
 * Background worker: claims jobs from outbound_queue and processes them.
 * Includes retry logic with exponential backoff: 1min → 5min → 15min.
 * After 3 retries, marks as permanently_failed.
 */

import { runResearch, runQualify, runPersonalise } from '@/lib/outbound-service';

export interface OutboundQueueRow {
  id: string;
  type: 'research' | 'qualify' | 'personalise' | 'send';
  lead_id: string;
  campaign_id: string;
  payload: Record<string, unknown>;
  status: string;
  retry_count: number;
  scheduled_for: string | null;
  error?: string;
  created_at: string;
}

// Retry delays in seconds: attempt 1 = 60s, attempt 2 = 300s, attempt 3 = 900s
const RETRY_DELAYS_SECONDS = [60, 300, 900] as const;
const MAX_RETRIES = 3;

export async function processOutboundJob(supabase: any, job: OutboundQueueRow) {
  console.log(`[outbound-worker] Processing job ${job.id} type=${job.type} lead=${job.lead_id} retry=${job.retry_count}`);

  try {
    switch (job.type) {
      case 'research':
        await runResearch(job.lead_id);
        break;
      case 'qualify':
        await runQualify(job.lead_id);
        break;
      case 'personalise':
        await runPersonalise(job.lead_id);
        break;
      default:
        console.warn(`[outbound-worker] Unknown job type: ${job.type}`);
    }

    await supabase
      .from('outbound_queue')
      .update({ status: 'completed' })
      .eq('id', job.id);

    console.log(`[outbound-worker] Completed job ${job.id}`);
  } catch (err: any) {
    const retryCount = (job.retry_count || 0);
    const errorMsg = err?.message ?? 'Unknown error';

    console.error(`[outbound-worker] Failed job ${job.id} (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, errorMsg);

    if (retryCount < MAX_RETRIES) {
      // Schedule retry with exponential backoff
      const delaySeconds = RETRY_DELAYS_SECONDS[retryCount] ?? RETRY_DELAYS_SECONDS[RETRY_DELAYS_SECONDS.length - 1];
      const scheduledFor = new Date(Date.now() + delaySeconds * 1000).toISOString();

      await supabase
        .from('outbound_queue')
        .update({
          status: 'pending',        // Back to pending so claim function picks it up
          retry_count: retryCount + 1,
          scheduled_for: scheduledFor,
          error: errorMsg,
        })
        .eq('id', job.id);

      console.log(`[outbound-worker] Job ${job.id} scheduled for retry at ${scheduledFor} (delay: ${delaySeconds}s)`);
    } else {
      // Max retries exceeded — mark as permanently failed
      await supabase
        .from('outbound_queue')
        .update({
          status: 'permanently_failed',
          error: `Max retries (${MAX_RETRIES}) exceeded. Last error: ${errorMsg}`,
        })
        .eq('id', job.id);

      console.error(`[outbound-worker] Job ${job.id} permanently failed after ${MAX_RETRIES + 1} attempts.`);
    }
  }
}
