'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Calendar,
  Camera, Hash, Mail, Link2, Phone, ArrowUpRight,
  MessageSquare, Zap, Clock, RefreshCw, AlertCircle
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

// ─── Static fallback chart data ──────────────────────────────────────────────

const WEEKLY_PIPELINE = [28, 41, 35, 55, 63, 71, 86, 91, 78, 95, 110, 142];
const WEEKLY_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  instagram: Camera, whatsapp: Hash, email: Mail, linkedin: Link2, voice: Phone,
};

// ─── Deterministic heatmap data (seeded LCG — no Math.random() in render) ────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
const rng = seededRandom(42);
const HEATMAP_DATA = Array.from({ length: 7 * 24 }, () => rng());

// ─── SparkLine SVG ────────────────────────────────────────────────────────────

function SparkLine({ data, color = '#22c55e' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const h = 48, w = 200;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={h - ((data[data.length-1] - min) / (max - min)) * h} r="3" fill={color} />
    </svg>
  );
}

// ─── Live analytics state ─────────────────────────────────────────────────────

interface AnalyticsData {
  kpis: { totalLeads: number; meetingsBooked: number; replyRate: number; avgScore: number; pendingApprovals: number; agentModel: string };
  channelBreakdown: Record<string, number>;
  funnel: { new: number; contacted: number; qualified: number; meeting_set: number; disqualified: number };
  weeklyActivity: { day: string; count: number }[];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [liveData, setLiveData] = useState<AnalyticsData | null>(null);
  const [loadingLive, setLoadingLive] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingLive(true);
    fetch('/api/analytics')
      .then(r => r.json())
      .then(data => { setLiveData(data); setLiveError(null); })
      .catch(e => setLiveError(e.message))
      .finally(() => setLoadingLive(false));
  }, [range]);

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa] font-sans">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8 pb-16">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-0.5">AI Setter performance across all channels and agents.
              {liveData && <span className="ml-2 text-xs text-emerald-600 font-semibold">● Live</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {liveError && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                <AlertCircle size={12} /> Using cached data
              </div>
            )}
            {loadingLive && <RefreshCw size={14} className="text-gray-400 animate-spin" />}
            <div className="flex items-center p-0.5 bg-white border border-gray-200 rounded-xl shadow-sm">
              {(['7d', '30d', '90d', 'all'] as const).map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize
                    ${range === r ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (!liveData) return;
                const blob = new Blob([JSON.stringify(liveData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `azmeth-analytics-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              disabled={!liveData}
              className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-40">
              <Calendar size={14} /> Export
            </button>
          </div>
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-4 gap-5">
          {[
            {
              label: 'Total Leads',
              val: loadingLive ? '—' : liveData ? liveData.kpis.totalLeads.toString() : '—',
              sub: liveData ? 'across all channels' : 'Loading…',
              trend: 'up', icon: TrendingUp, accent: 'text-green-600'
            },
            {
              label: 'Meetings Booked',
              val: loadingLive ? '—' : liveData ? liveData.kpis.meetingsBooked.toString() : '—',
              sub: liveData ? 'status: meeting_set' : 'Loading…',
              trend: 'up', icon: Calendar, accent: 'text-blue-600'
            },
            {
              label: 'Reply Rate',
              val: loadingLive ? '—' : liveData ? `${liveData.kpis.replyRate}%` : '—',
              sub: liveData ? 'leads with last_seen data' : 'Loading…',
              trend: 'up', icon: MessageSquare, accent: 'text-purple-600'
            },
            {
              label: 'Pending Approvals',
              val: loadingLive ? '—' : liveData ? liveData.kpis.pendingApprovals.toString() : '—',
              sub: liveData ? 'waiting for human review' : 'Loading…',
              trend: 'up', icon: Zap, accent: 'text-orange-500'
            },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                <div className={`p-2 rounded-lg bg-gray-50`}><kpi.icon size={15} className={kpi.accent} /></div>
              </div>
              <p className={`text-3xl font-bold mb-1 ${loadingLive ? 'text-gray-200 animate-pulse' : 'text-gray-900'}`}>{kpi.val}</p>
              <div className="flex items-center gap-1">
                <TrendingUp size={12} className="text-green-500" />
                <p className="text-xs text-gray-500 font-medium">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline Chart + Funnel */}
        <div className="grid grid-cols-3 gap-5">

          {/* Line Chart */}
          <div className="col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Pipeline Generated</h2>
                <p className="text-xs text-gray-400">Total estimated deal value from AI Setter outreach</p>
              </div>
              <span className="text-2xl font-bold text-gray-900">$142.5k <span className="text-sm text-green-500 font-semibold">↑ 14%</span></span>
            </div>
            {/* SVG Bar Chart */}
            <div className="relative h-44">
              <svg width="100%" height="100%" viewBox="0 0 700 160" preserveAspectRatio="none" className="overflow-visible">
                {/* grid lines */}
                {[0, 40, 80, 120, 160].map(y => (
                  <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#f3f4f6" strokeWidth="1" />
                ))}
                {WEEKLY_PIPELINE.map((v, i) => {
                  const barH = (v / 160) * 160;
                  const x = (i / WEEKLY_PIPELINE.length) * 680 + 10;
                  return (
                    <g key={i}>
                      <rect x={x} y={160 - barH} width="44" height={barH} rx="6"
                        fill={i === WEEKLY_PIPELINE.length - 1 ? '#111827' : '#e5e7eb'} />
                    </g>
                  );
                })}
              </svg>
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                {WEEKLY_LABELS.map(l => <span key={l} className="text-[10px] text-gray-400 font-medium">{l}</span>)}
              </div>
            </div>
          </div>

          {/* Funnel — live when available */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-1">Conversion Funnel</h2>
            {liveData ? (() => {
              const stages = [
                { label: 'New',           val: liveData.funnel.new,           pct: 100, color: 'bg-gray-300' },
                { label: 'Active',        val: liveData.funnel.contacted,     pct: liveData.funnel.new > 0 ? Math.round((liveData.funnel.contacted / liveData.funnel.new) * 100) : 0, color: 'bg-blue-400' },
                { label: 'Qualified',     val: liveData.funnel.qualified,     pct: liveData.funnel.new > 0 ? Math.round((liveData.funnel.qualified / liveData.funnel.new) * 100) : 0, color: 'bg-indigo-500' },
                { label: 'Meeting Set',   val: liveData.funnel.meeting_set,   pct: liveData.funnel.new > 0 ? Math.round((liveData.funnel.meeting_set / liveData.funnel.new) * 100) : 0, color: 'bg-purple-600' },
                { label: 'Disqualified', val: liveData.funnel.disqualified,  pct: liveData.funnel.new > 0 ? Math.round((liveData.funnel.disqualified / liveData.funnel.new) * 100) : 0, color: 'bg-red-400' },
              ];
              const total = liveData.funnel.new || 1;
              return (
                <>
                  <p className="text-xs text-gray-400 mb-5">{total} total leads in pipeline</p>
                  <div className="space-y-3">
                    {stages.map(stage => (
                      <div key={stage.label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">{stage.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{stage.val.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-400">{stage.pct}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${stage.color} rounded-full transition-all`} style={{ width: `${stage.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })() : (
              <div className="space-y-3 pt-2">
                {[100, 34, 14, 4].map((pct, i) => (
                  <div key={i}>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden animate-pulse">
                      <div className="h-full bg-gray-200 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Channel Breakdown — live */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-900">Channel Breakdown</h2>
              <p className="text-xs text-gray-400">Lead volume per inbound/outbound channel</p>
            </div>
          </div>
          {liveData && Object.keys(liveData.channelBreakdown).length > 0 ? (() => {
            const total = Object.values(liveData.channelBreakdown).reduce((a, b) => a + b, 0) || 1;
            const CHANNEL_COLORS = {
              instagram: 'bg-pink-400', whatsapp: 'bg-green-500',
              email: 'bg-blue-500', linkedin: 'bg-blue-700', voice: 'bg-purple-500',
            };
            const CHANNEL_LABELS = {
              instagram: 'Instagram', whatsapp: 'WhatsApp',
              email: 'Email', linkedin: 'LinkedIn', voice: 'Voice',
            };
            const entries = Object.entries(liveData.channelBreakdown);
            return (
              <>
                <div className="flex h-3 rounded-full overflow-hidden mb-6 gap-0.5">
                  {entries.map(([ch, ct]) => (
                    <div key={ch} className={`${CHANNEL_COLORS[ch] || 'bg-gray-400'} transition-all`}
                      style={{ width: `${Math.round((ct / total) * 100)}%` }} title={ch} />
                  ))}
                </div>
                <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.min(entries.length, 5)}, 1fr)` }}>
                  {entries.map(([ch, ct]) => {
                    const Icon = CHANNEL_ICONS[ch] || Mail;
                    const pct = Math.round((ct / total) * 100);
                    return (
                      <div key={ch} className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                        <div className={`w-9 h-9 rounded-xl ${CHANNEL_COLORS[ch] || 'bg-gray-400'} flex items-center justify-center mx-auto mb-3`}>
                          <Icon size={16} className="text-white" />
                        </div>
                        <p className="text-xs font-bold text-gray-900 mb-1">{CHANNEL_LABELS[ch] || ch}</p>
                        <p className="text-xl font-bold text-gray-900">{ct}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">leads</p>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-sm font-bold text-blue-600">{pct}%</p>
                          <p className="text-[10px] text-gray-400">of total</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })() : (
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2 animate-pulse">
                  <div className="w-9 h-9 bg-gray-200 rounded-xl mx-auto" />
                  <div className="h-3 bg-gray-200 rounded mx-auto w-16" />
                  <div className="h-5 bg-gray-200 rounded mx-auto w-10" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Performance — live from API */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-900">Agent Performance</h2>
              <p className="text-xs text-gray-400">Output metrics for your deployed AI Sales Agent</p>
            </div>
            <Link href="/dashboard/employees"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View Agent <ArrowUpRight size={12} />
            </Link>
          </div>
          {liveData ? (
            <div className="grid grid-cols-4 gap-5">
              {[
                { label: 'Total Leads', val: liveData.kpis.totalLeads, color: 'text-gray-900', sub: 'across all channels' },
                { label: 'Meetings Booked', val: liveData.kpis.meetingsBooked, color: 'text-purple-700', sub: 'status: meeting_set' },
                { label: 'Qualified', val: liveData.funnel.qualified, color: 'text-blue-700', sub: 'high intent leads' },
                { label: 'Reply Rate', val: `${liveData.kpis.replyRate}%`, color: 'text-emerald-700', sub: 'leads with last_seen' },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                  <p className={`text-3xl font-bold tabular-nums ${s.color} mb-1`}>{s.val.toLocaleString?.() ?? s.val}</p>
                  <p className="text-xs font-bold text-gray-700 mb-0.5">{s.label}</p>
                  <p className="text-[10px] text-gray-400">{s.sub}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3 animate-pulse">
                  <div className="h-7 bg-gray-200 rounded w-16" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Heatmap Placeholder */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-1">Outreach Activity Heatmap</h2>
          <p className="text-xs text-gray-400 mb-5">Message volume by day and hour across all channels</p>
          <div className="grid grid-cols-7 gap-1.5">
            {HEATMAP_DATA.map((intensity, i) => (
              <div
                key={i}
                title={`${Math.round(intensity * 50)} messages`}
                className={`h-3 rounded-sm transition-all cursor-pointer hover:scale-110
                  ${intensity > 0.85 ? 'bg-gray-900'
                  : intensity > 0.65 ? 'bg-gray-600'
                  : intensity > 0.45 ? 'bg-gray-400'
                  : intensity > 0.25 ? 'bg-gray-200'
                  : 'bg-gray-100'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] text-gray-400">Less</span>
            {['bg-gray-100', 'bg-gray-200', 'bg-gray-400', 'bg-gray-600', 'bg-gray-900'].map(c => (
              <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span className="text-[10px] text-gray-400">More</span>
          </div>
        </div>

      </div>
    </div>
  );
}
