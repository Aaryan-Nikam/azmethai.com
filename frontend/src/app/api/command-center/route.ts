/**
 * GET /api/command-center
 * Aggregates live data from Supabase for the Command Center dashboard:
 * - KPI tiles (leads, meetings booked, outbound volume, approval queue)
 * - System health (sales agent config, webhook queue stats)
 * - Recent activity log (last 10 approval queue entries)
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = createServerClient();

    const [
      chatLeadsRes,
      outboundLeadsRes,
      approvalQueueRes,
      webhookQueueRes,
      salesAgentRes,
      outboundCampaignsRes,
    ] = await Promise.all([
      db.from('chat_leads').select('status, channel, latest_score, paused, last_seen'),
      db.from('outbound_leads').select('stage, qualification_status, created_at'),
      db.from('approval_queue').select('status, created_at').order('created_at', { ascending: false }).limit(20),
      db.from('webhook_queue').select('status, platform, created_at').order('created_at', { ascending: false }).limit(200),
      db.from('sales_agents').select('business_name, model_version').limit(1),
      db.from('outbound_campaigns').select('status, name, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const chatLeads = chatLeadsRes.data || [];
    const outboundLeads = outboundLeadsRes.data || [];
    const approvals = approvalQueueRes.data || [];
    const webhooks = webhookQueueRes.data || [];
    const salesAgent = salesAgentRes.data?.[0] || null;
    const campaigns = outboundCampaignsRes.data || [];

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const totalLeads = chatLeads.length + outboundLeads.length;
    const meetingsBooked = chatLeads.filter(l => l.status === 'meeting_set').length;
    const pendingApprovals = approvals.filter(a => a.status === 'pending').length;

    // Webhook queue: active in last 24h
    const oneDayAgo = Date.now() - 86400000;
    const recentWebhooks = webhooks.filter(w => new Date(w.created_at).getTime() > oneDayAgo);
    const webhookHealth = recentWebhooks.length > 0
      ? `${recentWebhooks.filter(w => w.status === 'processed').length}/${recentWebhooks.length} processed`
      : 'No recent activity';

    // Outbound volume (all-time sends)
    const outboundSent = outboundLeads.filter(l => l.stage === 'sent' || l.stage === 'contacted').length;

    // ── Channel breakdown ─────────────────────────────────────────────────────
    const channelCounts: Record<string, number> = {};
    for (const lead of chatLeads) {
      const ch = lead.channel || 'unknown';
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;
    }

    // ── Recent activity log ───────────────────────────────────────────────────
    const activityLog = approvals.slice(0, 10).map(a => ({
      action: a.status === 'approved' ? 'Approval processed' : a.status === 'pending' ? 'Awaiting approval' : 'Rejected',
      status: a.status,
      time: a.created_at,
    }));

    // ── System health ─────────────────────────────────────────────────────────
    const systems = [
      {
        name: 'AI Setter (Sales Engine)',
        status: salesAgent ? 'operational' : 'not_configured',
        detail: salesAgent ? `${salesAgent.business_name || 'Unnamed'} · ${salesAgent.model_version}` : 'No agent configured',
        agent: salesAgent?.business_name || null,
      },
      {
        name: 'Outbound Engine',
        status: campaigns.some(c => c.status === 'running') ? 'operational' : campaigns.length > 0 ? 'paused' : 'idle',
        detail: campaigns.length > 0 ? `${campaigns.filter(c => c.status === 'running').length} running · ${campaigns.length} total` : 'No campaigns',
      },
      {
        name: 'Webhook Queue',
        status: recentWebhooks.length > 0 ? 'operational' : 'idle',
        detail: webhookHealth,
      },
    ];

    return NextResponse.json({
      kpis: {
        totalLeads,
        meetingsBooked,
        pendingApprovals,
        outboundSent,
        activeChannels: Object.keys(channelCounts).length,
      },
      channelCounts,
      systems,
      activityLog,
      campaigns: campaigns.slice(0, 3).map(c => ({ name: c.name, status: c.status, created_at: c.created_at })),
      agentName: salesAgent?.business_name || null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : ((err as any)?.message ?? JSON.stringify(err));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
