'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus, Search, MoreHorizontal, X, Rocket, Send, Users,
  TrendingUp, BarChart2, Zap, Play, Pause, RefreshCw,
  ArrowUpRight, CheckCircle2, Clock, AlertCircle, Filter,
  ChevronRight, Target, MessageSquare, Mail
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignStatus = 'running' | 'paused' | 'draft' | 'completed';

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  channels: string[];
  totalLeads: number;
  qualified: number;
  sent: number;
  opened: number;
  replied: number;
  framework: string;
  createdAt: string;
}

// ─── Real Data Hook ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<CampaignStatus, { label: string; dot: string; badge: string }> = {
  running:   { label: '● Running',   dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paused:    { label: '○ Paused',    dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  draft:     { label: '◌ Draft',     dot: 'bg-gray-300',    badge: 'bg-gray-50 text-gray-500 border-gray-200' },
  completed: { label: '✓ Completed', dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  gmail:     <svg key="gmail" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill="#EA4335"/></svg>,
  instantly: <Zap key="ins" size={13} className="text-[#5B4CF5]" />,
  smartlead: <TrendingUp key="sl" size={13} className="text-gray-500" />,
  instagram: <MessageSquare key="ig" size={13} className="text-rose-500" />,
};

// ─── Funnel Bar ───────────────────────────────────────────────────────────────

function FunnelBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({ camp }: { camp: Campaign }) {
  const [menu, setMenu] = useState(false);
  const cfg = STATUS_CFG[camp.status];
  const replyRate = camp.sent > 0 ? Math.round((camp.replied / camp.sent) * 100) : 0;
  const openRate = camp.sent > 0 ? Math.round((camp.opened / camp.sent) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all group"
    >
      {/* Header */}
      <div className="flex items-start gap-4 p-5 pb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Rocket size={18} className="text-rose-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-sm truncate">{camp.name}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${cfg.badge}`}>{cfg.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400">{camp.createdAt}</span>
            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{camp.framework}</span>
            <div className="flex items-center gap-1">
              {camp.channels.map(c => <span key={c}>{CHANNEL_ICONS[c]}</span>)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link href={`/dashboard/outbound/campaigns/${camp.id}`}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-all">
            View Pipeline <ArrowUpRight size={10} />
          </Link>
          <div className="relative">
            <button onClick={() => setMenu(m => !m)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
              <MoreHorizontal size={15} />
            </button>
            {menu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5 w-40">
                {['Pause', 'Edit Settings', 'Duplicate', 'Delete'].map(item => (
                  <button key={item} onClick={() => setMenu(false)}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Funnel Stats */}
      <div className="px-5 pb-5">
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Scraped', val: camp.totalLeads, color: 'text-gray-900' },
            { label: 'Qualified', val: camp.qualified, color: 'text-blue-700' },
            { label: 'Sent', val: camp.sent, color: 'text-gray-900' },
            { label: 'Replied', val: camp.replied, color: 'text-emerald-700' },
          ].map(s => (
            <div key={s.label}>
              <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.val.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
            <span className="w-16">Open rate</span>
            <FunnelBar value={camp.opened} max={camp.sent} color="bg-blue-400" />
            <span className="font-bold text-gray-700">{openRate}%</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
            <span className="w-16">Reply rate</span>
            <FunnelBar value={camp.replied} max={camp.sent} color="bg-emerald-400" />
            <span className="font-bold text-gray-700">{replyRate}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutboundHQPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | CampaignStatus>('all');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch('/api/outbound/campaigns/summary');
        if (res.ok) {
          const json = await res.json();
          setCampaigns(json.campaigns || []);
        }
      } catch (err) {
        console.error('Failed to fetch campaigns', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 5000);
    return () => clearInterval(interval);
  }, []);

  const allLeads    = campaigns.reduce((a, c) => a + c.totalLeads, 0);
  const allSent     = campaigns.reduce((a, c) => a + c.sent, 0);
  const allReplied  = campaigns.reduce((a, c) => a + c.replied, 0);
  const allQual     = campaigns.reduce((a, c) => a + c.qualified, 0);

  const filtered = campaigns.filter(c => {
    const q = search.toLowerCase();
    return (filter === 'all' || c.status === filter) &&
      (c.name.toLowerCase().includes(q) || c.framework.toLowerCase().includes(q));
  });

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa] font-sans">
      <div className="px-8 py-8 space-y-6 pb-24">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                <Rocket size={16} className="text-rose-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Outbound Engine</h1>
            </div>
            <p className="text-sm text-gray-400">Intent-driven B2B outreach — scrape, qualify, personalise, send.</p>
          </div>
          <Link href="/dashboard/systems/outbound-engine"
            className="flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-black transition-colors shadow-sm">
            <Plus size={15} /> New Campaign
          </Link>
        </div>

        {/* Hero KPI block */}
        <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl p-8 text-white relative overflow-hidden border border-gray-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-32 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Outbound Engine — Live</p>
            </div>
            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-5xl font-bold tracking-tight tabular-nums">{allLeads.toLocaleString()}</span>
              <span className="text-gray-400 text-sm">total leads in pipeline</span>
            </div>
            <div className="grid grid-cols-4 gap-8">
              {[
                { label: 'Qualified Leads', val: allQual.toLocaleString(), icon: CheckCircle2, color: 'text-blue-400' },
                { label: 'Emails Sent',     val: allSent.toLocaleString(), icon: Send, color: 'text-white' },
                { label: 'Total Replies',   val: allReplied.toLocaleString(), icon: MessageSquare, color: 'text-emerald-400' },
                { label: 'Reply Rate',      val: allSent > 0 ? `${Math.round((allReplied / allSent) * 100)}%` : '—', icon: TrendingUp, color: 'text-rose-400' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <stat.icon size={13} className={stat.color} />
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{stat.label}</p>
                  </div>
                  <p className={`text-3xl font-bold tabular-nums ${stat.color}`}>{stat.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline stage strip */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Scraped',     val: allLeads, icon: Search,       color: 'text-gray-600',   bg: 'bg-gray-50' },
            { label: 'Qualified',   val: allQual,  icon: CheckCircle2, color: 'text-blue-600',   bg: 'bg-blue-50' },
            { label: 'Personalised',val: allSent,  icon: Target,       color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Sent',        val: allSent,  icon: Send,         color: 'text-gray-600',   bg: 'bg-gray-50' },
            { label: 'Replied',     val: allReplied,icon: MessageSquare,color: 'text-emerald-600',bg: 'bg-emerald-50' },
          ].map((s, i) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon size={16} className={s.color} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 tabular-nums">{s.val.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Command bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search campaigns…"
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 shadow-sm" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400" /></button>}
          </div>
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm gap-0.5">
            {(['all', 'running', 'paused', 'draft', 'completed'] as const).map((v) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filter === v ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign cards */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-4">Live Campaigns ({filtered.length})</h2>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <RefreshCw size={24} className="animate-spin mb-4" />
              <p className="text-sm font-semibold">Syncing outbounds...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map(camp => <CampaignCard key={camp.id} camp={camp} />)}
            </div>
          )}
          
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white border border-gray-200 border-dashed rounded-3xl">
              <Rocket size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No campaigns found</p>
              <Link href="/dashboard/systems/outbound-engine" className="mt-3 inline-block text-xs text-rose-600 font-bold hover:underline">
                + Launch your first campaign
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
