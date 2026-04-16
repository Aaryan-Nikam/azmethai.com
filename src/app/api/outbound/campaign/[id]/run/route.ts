/**
 * POST /api/outbound/campaign/[id]/run
 * Batch pipeline runner — processes all unprocessed leads in a campaign
 * through the specified stage (or from research onward by default).
 * Used to re-trigger stuck leads or kick off the pipeline for a full campaign.
 *
 * Body: {
 *   stage?: 'research' | 'qualify' | 'personalise'   // default: 'research'
 *   limit?: number                                     // default: 50
 *   skip_first?: number                                // default: 0
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOutboundClient, triggerStage } from '@/lib/outbound';

const STAGE_FILTER: Record<string, string> = {
  research: 'scraped',
  qualify: 'researched',
  personalise: 'qualified',
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id;
    const body = await req.json().catch(() => ({})) as {
      stage?: 'research' | 'qualify' | 'personalise';
      limit?: number;
      skip_first?: number;
    };

    const stage = body.stage ?? 'research';
    const limit = Math.min(body.limit ?? 50, 200); // Max 200 per call
    const skipFirst = body.skip_first ?? 0;

    const db = createOutboundClient();

    // Verify campaign
    const { data: campaign } = await db
      .from('outbound_campaigns')
      .select('id, status')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const requiredStage = STAGE_FILTER[stage];

    // Fetch leads that need processing
    let query = db
      .from('outbound_leads')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('stage', requiredStage)
      .order('created_at', { ascending: true })
      .range(skipFirst, skipFirst + limit - 1);

    // For qualify: also include rejected leads that haven't been scored yet
    // (they may have been through research but not yet scored)
    if (stage === 'qualify') {
      query = db
        .from('outbound_leads')
        .select('id')
        .eq('campaign_id', campaignId)
        .in('stage', ['researched'])
        .eq('qualification_status', 'pending')
        .order('created_at', { ascending: true })
        .range(skipFirst, skipFirst + limit - 1);
    }

    const { data: leads, error } = await query;
    if (error) throw error;

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        ok: true,
        triggered: 0,
        message: `No leads found in stage '${requiredStage}' for this campaign.`,
      });
    }

    // Fire-and-forget triggers in small batches to avoid rate limits
    const BATCH_SIZE = 5;
    let triggered = 0;

    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map((lead: { id: string }) => triggerStage(stage, lead.id)),
      );
      triggered += batch.length;

      // Small delay between batches to be gentle on Kimi/GPT-4o rate limits
      if (i + BATCH_SIZE < leads.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    return NextResponse.json({
      ok: true,
      campaign_id: campaignId,
      stage,
      triggered,
      total_found: leads.length,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
