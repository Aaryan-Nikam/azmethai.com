/**
 * POST /api/outbound/research
 * Stage 2 — Research Agent dispatcher.
 * Immediately enqueues a research job and returns 200.
 * Actual AI work runs asynchronously via the cron worker (outbound-jobs.ts).
 *
 * Body: { lead_id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOutboundClient, triggerStage } from '@/lib/outbound';

export async function POST(req: NextRequest) {
  try {
    const { lead_id } = await req.json() as { lead_id: string };
    if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 });

    const db = createOutboundClient();
    const { data: lead } = await db.from('outbound_leads').select('stage').eq('id', lead_id).single();

    // Skip if already past research
    const doneStages = ['researched', 'qualified', 'personalised', 'sent', 'replied'];
    if (lead && doneStages.includes(lead.stage)) {
      return NextResponse.json({ ok: true, skipped: true, stage: lead.stage });
    }

    await triggerStage('research', lead_id);
    return NextResponse.json({ ok: true, status: 'queued', lead_id });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[research]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

