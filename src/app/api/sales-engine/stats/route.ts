import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = createServerClient();

    // 1. Fetch Inbound Leads
    const { data: chatLeads, error: chatErr } = await db.from('chat_leads').select('status, channel');
    if (chatErr) throw chatErr;

    // 2. Fetch Outbound Leads
    const { data: outLeads, error: outErr } = await db.from('outbound_leads').select('qualification_status');
    if (outErr) throw outErr;

    // 3. Fetch Outbound Messages
    const { data: messages, error: msgErr } = await db.from('outbound_messages').select('status');
    if (msgErr) throw msgErr;

    // 4. Fetch Campaigns for unique channels
    const { data: campaigns, error: campErr } = await db.from('outbound_campaigns').select('config');
    if (campErr) throw campErr;

    const totalLeads = (chatLeads?.length || 0) + (outLeads?.length || 0);
    // Arbitrary $1,500 pipeline per lead for demo visual:
    const pipelineSum = totalLeads * 1500; 

    // Calculate meetings
    let meetingsBooked = 0;
    chatLeads?.forEach(l => { if (l.status === 'meeting_set') meetingsBooked++; });
    outLeads?.forEach(l => { if (l.qualification_status === 'qualified') meetingsBooked++; });

    // Calculate volume
    const outboundVolume = messages?.length || 0;

    // Calculate active channels
    const channels = new Set<string>();
    chatLeads?.forEach(l => { if (l.channel) channels.add(l.channel); });
    campaigns?.forEach(c => {
      const campChannels = c.config?.channels || [];
      campChannels.forEach((ch: string) => channels.add(ch));
    });

    return NextResponse.json({
      pipelineGenerated: pipelineSum,
      meetingsBooked,
      outboundVolume,
      activeChannels: Array.from(channels)
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
