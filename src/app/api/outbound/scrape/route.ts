/**
 * POST /api/outbound/scrape
 * Triggers an Apify actor run for a campaign and registers the scraper job.
 * Supports two modes:
 *   - crunchbase: uses pratikdani/crunchbase-companies-bulk-scraper-no-cookies
 *   - apify: uses a custom actor URL provided in the wizard
 *
 * Body: {
 *   campaign_id:      string
 *   source:           'crunchbase' | 'apify'
 *   crunchbase_urls?: string[]      // list of crunchbase.com/organization/... URLs
 *   max_items?:       number        // per-URL limit (default 100)
 *   actor_url?:       string        // full Apify runs URL (apify mode only)
 *   input_config?:    Record<string, unknown>
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOutboundClient, triggerApifyActor } from '@/lib/outbound';

const CRUNCHBASE_ACTOR_ID =
  process.env.APIFY_CRUNCHBASE_ACTOR_ID ??
  'saswave/crunchbase-search-results';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      campaign_id: string;
      source?: 'crunchbase' | 'apify';
      crunchbase_urls?: string[];
      max_items?: number;
      actor_url?: string;
      input_config?: Record<string, unknown>;
    };

    const { campaign_id } = body;
    const source = body.source ?? 'apify';

    if (!campaign_id) {
      return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    if (source === 'crunchbase' && !body.crunchbase_urls?.length) {
      return NextResponse.json(
        { error: 'crunchbase_urls (with a Crunchbase Search URL) is required for Crunchbase mode' },
        { status: 400 },
      );
    }

    if (source === 'apify' && !body.actor_url) {
      return NextResponse.json({ error: 'actor_url is required for Apify mode' }, { status: 400 });
    }

    const db = createOutboundClient();

    const { data: campaign, error: campErr } = await db
      .from('outbound_campaigns')
      .select('id, name')
      .eq('id', campaign_id)
      .single();

    if (campErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const webhookUrl = `${appUrl}/api/outbound/scrape/callback`;

    // ── Build actor URL + input payload ──────────────────────────────────────
    let actorRunUrl: string;
    let inputPayload: Record<string, unknown>;

    if (source === 'crunchbase') {
      const apiKey = process.env.APIFY_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'APIFY_API_KEY not configured in .env.local' },
          { status: 400 },
        );
      }
      actorRunUrl = `https://api.apify.com/v2/acts/${CRUNCHBASE_ACTOR_ID}/runs`;
      inputPayload = {
        startUrls: [{ url: body.crunchbase_urls[0] }],
        maxItems: body.max_items ?? 100,
        _azmeth_campaign_id: campaign_id,
      };
    } else {
      actorRunUrl = body.actor_url!;
      inputPayload = {
        ...(body.input_config ?? {}),
        _azmeth_campaign_id: campaign_id,
      };
    }

    // Create scraper job record
    const { data: job, error: jobErr } = await db
      .from('outbound_scraper_jobs')
      .insert({
        campaign_id,
        actor_url: actorRunUrl,
        input_config: inputPayload,
        status: 'running',
      })
      .select()
      .single();

    if (jobErr) throw jobErr;

    inputPayload._azmeth_job_id = job.id;

    // Trigger Apify
    let apifyRunId: string | null = null;
    try {
      const run = await triggerApifyActor(actorRunUrl, inputPayload, webhookUrl);
      apifyRunId = run.runId;

      await db
        .from('outbound_scraper_jobs')
        .update({ apify_run_id: apifyRunId })
        .eq('id', job.id);

    } catch (apifyErr) {
      await db
        .from('outbound_scraper_jobs')
        .update({ status: 'failed' })
        .eq('id', job.id);

      const msg = apifyErr instanceof Error ? apifyErr.message : 'Apify trigger failed';
      return NextResponse.json({ error: msg, job_id: job.id }, { status: 502 });
    }

    await db
      .from('outbound_campaigns')
      .update({ status: 'running', updated_at: new Date().toISOString() })
      .eq('id', campaign_id);

    return NextResponse.json({
      ok: true,
      job_id: job.id,
      apify_run_id: apifyRunId,
      source,
      actor: source === 'crunchbase' ? CRUNCHBASE_ACTOR_ID : body.actor_url,
      urls_queued: source === 'crunchbase' ? body.crunchbase_urls?.length : undefined,
      webhook_url: webhookUrl,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campaign_id = searchParams.get('campaign_id');

    const db = createOutboundClient();
    const query = db
      .from('outbound_scraper_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (campaign_id) query.eq('campaign_id', campaign_id);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ jobs: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
