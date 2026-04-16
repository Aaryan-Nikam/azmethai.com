/**
 * POST /api/outbound/scrape/callback
 * Apify webhook — called when an actor run finishes.
 * Fetches the dataset, normalises items into outbound_leads, then
 * auto-triggers the research pipeline for each lead.
 *
 * Apify sends a POST with the run result in the body.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createOutboundClient,
  fetchApifyDataset,
  normaliseLead,
  triggerStage,
} from '@/lib/outbound';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      eventType: string;
      eventData: {
        actorId: string;
        actorRunId: string;
        status: string;
        defaultDatasetId: string;
      };
      resource: {
        id: string;
        status: string;
        defaultDatasetId: string;
        // We embed these in the input_config
        _azmeth_job_id?: string;
        _azmeth_campaign_id?: string;
      };
    };

    const runId = body.resource?.id ?? body.eventData?.actorRunId;
    const runStatus = body.resource?.status ?? body.eventData?.status;

    const db = createOutboundClient();

    // Find the scraper job by Apify run ID
    const { data: job } = await db
      .from('outbound_scraper_jobs')
      .select('*')
      .eq('apify_run_id', runId)
      .single();

    if (!job) {
      // Gracefully ignore — might be a test webhook
      return NextResponse.json({ ok: true, note: 'job not found, ignoring' });
    }

    // If the run failed, mark job as failed
    if (runStatus === 'FAILED' || runStatus === 'ABORTED') {
      await db
        .from('outbound_scraper_jobs')
        .update({ status: 'failed' })
        .eq('id', job.id);

      return NextResponse.json({ ok: true, status: 'marked_failed' });
    }

    // Fetch the full dataset from Apify
    const items = await fetchApifyDataset(runId);

    if (!items.length) {
      await db
        .from('outbound_scraper_jobs')
        .update({ status: 'finished', leads_imported: 0 })
        .eq('id', job.id);

      return NextResponse.json({ ok: true, leads_imported: 0 });
    }

    // Normalise + insert leads into outbound_leads
    const leads = items.map(item => ({
      ...normaliseLead(item),
      campaign_id: job.campaign_id,
      source: 'apify' as const,
      stage: 'scraped',
      qualification_status: 'pending',
    }));

    // Batch insert (Supabase handles up to 1000 rows at once)
    const chunks = chunkArray(leads, 200);
    let totalInserted = 0;
    const insertedIds: string[] = [];

    for (const chunk of chunks) {
      const { data: inserted, error } = await db
        .from('outbound_leads')
        .insert(chunk)
        .select('id');

      if (error) {
        console.error('Lead insert error:', error.message);
        continue;
      }

      totalInserted += inserted.length;
      insertedIds.push(...inserted.map((r: { id: string }) => r.id));
    }

    // Update scraper job as finished
    await db
      .from('outbound_scraper_jobs')
      .update({ status: 'finished', leads_imported: totalInserted })
      .eq('id', job.id);

    // Auto-trigger research for each lead (fire-and-forget, staggered to avoid rate limits)
    // We trigger up to 10 concurrently, then the rest queue naturally via Supabase
    const batch = insertedIds.slice(0, 10);
    await Promise.allSettled(
      batch.map(leadId => triggerStage('research', leadId)),
    );

    // For remaining leads, trigger sequentially via the batch runner
    if (insertedIds.length > 10) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
      fetch(`${appUrl}/api/outbound/campaign/${job.campaign_id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'research', skip_first: 10 }),
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      leads_imported: totalInserted,
      pipeline_triggered: Math.min(10, insertedIds.length),
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[scrape/callback]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}
