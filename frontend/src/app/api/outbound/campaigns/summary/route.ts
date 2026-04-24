import { NextRequest, NextResponse } from 'next/server';
import { createOutboundClient } from '@/lib/outbound';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = createOutboundClient();

    // 1. Fetch campaigns
    const { data: campaigns, error: campErr } = await db
      .from('outbound_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (campErr) throw campErr;

    // 2. We could do precise SQL count joins, but for safety in Next.js without raw SQL we'll fetch exact counts in parallel.
    // If you have massive scale, use an RPC function in Supabase.
    
    const results = await Promise.all((campaigns || []).map(async (camp) => {
      // Leads (Total)
      const { count: totalLeads } = await db.from('outbound_leads')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', camp.id);

      // Qualified
      const { count: qualified } = await db.from('outbound_leads')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', camp.id)
        .eq('qualification_status', 'qualified');

      // Sent Messages
      const { count: sent } = await db.from('outbound_messages')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', camp.id)
        .in('status', ['sent', 'opened', 'replied']); // Assuming 'sent' implies sent.

      // Replied
      const { count: replied } = await db.from('outbound_messages')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', camp.id)
        .eq('status', 'replied');

      return {
        id: camp.id,
        name: camp.name,
        status: camp.status,
        channels: camp.config?.channels || ['gmail'],
        totalLeads: totalLeads || 0,
        qualified: qualified || 0,
        sent: sent || 0,
        opened: 0, // Mocked for now absent tracker pixel
        replied: replied || 0,
        framework: camp.config?.framework || 'Custom',
        createdAt: new Date(camp.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      };
    }));

    return NextResponse.json({ campaigns: results });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
