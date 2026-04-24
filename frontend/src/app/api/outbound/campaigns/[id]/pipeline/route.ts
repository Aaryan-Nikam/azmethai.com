import { NextRequest, NextResponse } from 'next/server';
import { createOutboundClient } from '@/lib/outbound';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const db = createOutboundClient();

    // 1. Fetch Campaign
    const { data: campaign, error: campErr } = await db
      .from('outbound_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // 2. Fetch leads distribution
    const { data: leads } = await db
      .from('outbound_leads')
      .select('stage, qualification_status')
      .eq('campaign_id', id);

    // 3. Fetch messages distribution
    const { data: messages } = await db
      .from('outbound_messages')
      .select('status')
      .eq('campaign_id', id);

    // Stats Accumulator
    const stats = {
      totalScraped: (leads || []).length,
      inResearch: 0,
      qualified: 0,
      rejected: 0,
      inPersonalisation: 0,
      readyToSend: 0,
      sent: 0,
      replied: 0
    };

    // Aggregate Leads
    for (const lead of (leads || [])) {
      if (lead.stage === 'researching') stats.inResearch++;
      if (lead.stage === 'personalising') stats.inPersonalisation++;
      if (lead.stage === 'ready_to_send') stats.readyToSend++;

      if (lead.qualification_status === 'qualified') stats.qualified++;
      if (lead.qualification_status === 'rejected') stats.rejected++;
    }

    // Aggregate Messages
    for (const msg of (messages || [])) {
      if (['sent', 'opened', 'replied'].includes(msg.status)) stats.sent++;
      if (msg.status === 'replied') stats.replied++;
    }

    // Map `readyToSend` to personalization queue if needed, or we just count it.
    
    return NextResponse.json({ campaign, stats });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
