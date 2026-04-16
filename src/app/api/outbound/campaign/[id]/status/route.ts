/**
 * GET /api/outbound/campaign/[id]/status
 * Real-time pipeline status for a campaign.
 * Returns per-stage counts and scraper job status.
 * Frontend polls this every 5-10s to update the dashboard live.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOutboundClient } from '@/lib/outbound';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const campaignId = params.id;
    const db = createOutboundClient();

    // Run queries in parallel
    const [leadsResult, campaignResult, jobResult] = await Promise.all([
      // All leads for this campaign
      db
        .from('outbound_leads')
        .select('stage, qualification_status')
        .eq('campaign_id', campaignId),

      // Campaign meta
      db
        .from('outbound_campaigns')
        .select('id, name, status, created_at, updated_at, config')
        .eq('id', campaignId)
        .single(),

      // Latest scraper job
      db
        .from('outbound_scraper_jobs')
        .select('status, leads_imported, created_at, apify_run_id')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
    ]);

    if (campaignResult.error && campaignResult.error.code !== 'PGRST116') {
      throw campaignResult.error;
    }

    const leads = leadsResult.data ?? [];

    // Stage counts
    const counts = {
      total: leads.length,
      scraped:      leads.filter(l => l.stage === 'scraped').length,
      researched:   leads.filter(l => l.stage === 'researched').length,
      qualified:    leads.filter(l => l.stage === 'qualified' && l.qualification_status === 'qualified').length,
      rejected:     leads.filter(l => l.qualification_status === 'rejected').length,
      pending:      leads.filter(l => l.qualification_status === 'pending').length,
      personalised: leads.filter(l => l.stage === 'personalised').length,
      sent:         leads.filter(l => l.stage === 'sent').length,
      replied:      leads.filter(l => l.stage === 'replied').length,
    };

    // Derived rates
    const rates = {
      qualification_rate: counts.total > 0
        ? Math.round((counts.qualified / counts.total) * 100)
        : 0,
      open_rate: 0,   // Updated when reply tracking is wired up
      reply_rate: counts.sent > 0
        ? Math.round((counts.replied / counts.sent) * 100)
        : 0,
    };

    // Pipeline health — what stage is the bottleneck?
    const pipeline_health = (() => {
      if (counts.scraped > 0 && counts.researched === 0) return 'stalled_at_research';
      if (counts.researched > 0 && counts.qualified === 0 && counts.rejected === 0) return 'stalled_at_qualify';
      if (counts.qualified > 0 && counts.personalised === 0) return 'stalled_at_personalise';
      if (counts.personalised > 0 && counts.sent === 0) return 'awaiting_send_approval';
      if (counts.sent > 0) return 'running';
      if (counts.total === 0) return 'empty';
      return 'processing';
    })();

    return NextResponse.json({
      campaign_id: campaignId,
      campaign: campaignResult.data ?? null,
      counts,
      rates,
      pipeline_health,
      scraper_job: jobResult.data ?? null,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
