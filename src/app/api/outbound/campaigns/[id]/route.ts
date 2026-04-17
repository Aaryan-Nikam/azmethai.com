/**
 * Campaign management endpoint
 * PATCH /api/outbound/campaigns/[id]  → update status (pause, resume, complete)
 * DELETE /api/outbound/campaigns/[id] → delete campaign + all its leads & messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOutboundClient } from '@/lib/outbound';

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, name } = body;

    if (!id) return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });

    const db = createOutboundClient();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (status) {
      const allowed = ['running', 'paused', 'completed', 'draft'];
      if (!allowed.includes(status)) {
        return NextResponse.json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` }, { status: 400 });
      }
      update.status = status;
    }

    if (name?.trim()) update.name = name.trim();

    const { data, error } = await db
      .from('outbound_campaigns')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    return NextResponse.json({ ok: true, campaign: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : ((err as any)?.message ?? JSON.stringify(err));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });

    const db = createOutboundClient();

    // Delete in cascade order: messages → leads → scraper jobs → campaign
    const steps = [
      { table: 'outbound_messages', col: 'campaign_id' },
      { table: 'outbound_leads',    col: 'campaign_id' },
      { table: 'outbound_scraper_jobs', col: 'campaign_id' },
    ];

    for (const step of steps) {
      const { error } = await db.from(step.table).delete().eq(step.col, id);
      if (error) {
        // Non-fatal if table doesn't have rows — log and continue
        console.warn(`[delete campaign] ${step.table} cleanup warning:`, error.message);
      }
    }

    // Finally delete the campaign itself
    const { error: campErr } = await db
      .from('outbound_campaigns')
      .delete()
      .eq('id', id);

    if (campErr) throw campErr;

    return NextResponse.json({ ok: true, deleted_id: id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : ((err as any)?.message ?? JSON.stringify(err));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const db = createOutboundClient();

    const { data: campaign, error } = await db
      .from('outbound_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    return NextResponse.json({ campaign });
  } catch (err) {
    const msg = err instanceof Error ? err.message : ((err as any)?.message ?? JSON.stringify(err));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
