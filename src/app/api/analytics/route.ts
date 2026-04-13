import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const db = createServerClient();

    // Parallel queries for all metrics
    const [
      { data: leads },
      { data: webhooks },
      { data: approvals },
      { data: agentConfig },
    ] = await Promise.all([
      db.from('chat_leads').select('channel, status, latest_score, paused, last_seen'),
      db.from('webhook_queue').select('status, platform, created_at').order('created_at', { ascending: false }).limit(200),
      db.from('approval_queue').select('status, created_at').order('created_at', { ascending: false }).limit(50),
      db.from('sales_agents').select('business_name, model_version').limit(1),
    ]);

    const allLeads = leads || [];
    const allWebhooks = webhooks || [];

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const totalLeads = allLeads.length;
    const qualifiedLeads = allLeads.filter((l: Record<string, unknown>) => ['qualified', 'meeting_set'].includes(l.status as string)).length;
    const meetingsBooked = allLeads.filter((l: Record<string, unknown>) => l.status === 'meeting_set').length;
    const avgScore = totalLeads > 0
      ? Math.round(allLeads.reduce((s: number, l: Record<string, unknown>) => s + ((l.latest_score as number) || 0), 0) / totalLeads)
      : 0;

    // Reply rate = leads that have received at least one AI response
    // Approx: leads where paused=false and last_seen is not null
    const repliedLeads = allLeads.filter((l: Record<string, unknown>) => l.last_seen).length;
    const replyRate = totalLeads > 0 ? Math.round((repliedLeads / totalLeads) * 100) : 0;

    // ── Channel Breakdown ─────────────────────────────────────────────────────
    const channelCounts: Record<string, number> = {};
    for (const l of allLeads) {
      const ch = (l as Record<string, unknown>).channel as string || 'unknown';
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;
    }

    // ── Status Funnel ─────────────────────────────────────────────────────────
    const funnel = {
      new: allLeads.filter((l: Record<string, unknown>) => l.status === 'new').length,
      contacted: allLeads.filter((l: Record<string, unknown>) => l.status === 'contacted').length,
      qualified: qualifiedLeads,
      meeting_set: meetingsBooked,
      disqualified: allLeads.filter((l: Record<string, unknown>) => l.status === 'disqualified').length,
    };

    // ── Webhook Activity (volume by day last 7 days) ───────────────────────────
    const dayMap: Record<string, number> = {};
    const now = Date.now();
    for (const wh of allWebhooks) {
      const ts = new Date((wh as Record<string, unknown>).created_at as string).getTime();
      if (now - ts > 7 * 24 * 60 * 60 * 1000) continue;
      const day = new Date(ts).toLocaleDateString('en-US', { weekday: 'short' });
      dayMap[day] = (dayMap[day] || 0) + 1;
    }
    const weeklyActivity = Object.entries(dayMap).map(([day, count]) => ({ day, count }));

    // ── Approvals ─────────────────────────────────────────────────────────────
    const pendingApprovals = (approvals || []).filter((a: Record<string, unknown>) => a.status === 'pending').length;

    return NextResponse.json({
      kpis: {
        totalLeads,
        meetingsBooked,
        replyRate,
        avgScore,
        pendingApprovals,
        agentModel: (agentConfig?.[0] as Record<string, unknown>)?.model_version || 'gpt-4o-mini',
      },
      channelBreakdown: channelCounts,
      funnel,
      weeklyActivity,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
