/**
 * outbound-jobs.ts
 * Background worker: claims jobs from outbound_queue and processes them
 * by calling the pure service functions directly — no HTTP round-trips.
 */

import { runResearch, runQualify, runPersonalise } from '@/lib/outbound-service';

export interface OutboundQueueRow {
  id: string;
  type: 'research' | 'qualify' | 'personalise' | 'send';
  lead_id: string;
  campaign_id: string;
  payload: Record<string, unknown>;
  status: string;
  error?: string;
  created_at: string;
}

export async function processOutboundJob(supabase: any, job: OutboundQueueRow) {
  console.log(`[outbound-worker] Processing job ${job.id} type=${job.type} lead=${job.lead_id}`);

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
    console.error(`[outbound-worker] Failed job ${job.id}:`, err);
    await supabase
      .from('outbound_queue')
      .update({ status: 'failed', error: err?.message ?? 'Unknown error' })
      .eq('id', job.id);
  }
}

