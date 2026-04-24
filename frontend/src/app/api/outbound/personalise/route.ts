/**
 * POST /api/outbound/personalise
 * Stage 4 — Personalisation Agent dispatcher.
 * Immediately enqueues a personalise job and returns 200.
 * Actual GPT-4o email generation runs asynchronously via the cron worker.
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
    const { data: lead } = await db
      .from('outbound_leads')
      .select('stage, qualification_status')
      .eq('id', lead_id)
      .single();

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    if (lead.qualification_status !== 'qualified') {
      return NextResponse.json({ ok: false, reason: `Lead is ${lead.qualification_status} — only qualified leads get personalised.` });
    }

    if (['personalised', 'sent', 'replied'].includes(lead.stage)) {
      return NextResponse.json({ ok: true, skipped: true, stage: lead.stage });
    }

    await triggerStage('personalise', lead_id);
    return NextResponse.json({ ok: true, status: 'queued', lead_id });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[personalise]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
