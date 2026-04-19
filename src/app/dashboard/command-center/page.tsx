'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Users, BarChart2, Activity,
  Zap, ArrowUpRight, ChevronDown, RefreshCw, Check, AlertTriangle,
  Rocket, MessageSquare, CheckCircle, Clock, AlertCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommandCenterData {
  kpis: {
    totalLeads: number;
    meetingsBooked: number;
    pendingApprovals: number;
    outboundSent: number;
    activeChannels: number;
  };
  channelCounts: Record<string, number>;
  systems: Array<{
    name: string;
    status: 'operational' | 'paused' | 'idle' | 'not_configured';
    detail: string;
    agent?: string | null;
  }>;
  activityLog: Array<{
    action: string;
    status: string;
    time: string;
  }>;
  campaigns: Array<{ name: string; status: string; created_at: string }>;
  agentName: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_COLOR = {
  operational:    'bg-emerald-400',
  paused:         'bg-amber-400',
  idle:           'bg-gray-300',
  not_configured: 'bg-red-400',
};

const STATUS_LABEL = {
  operational:    '● Operational',
  paused:         '○ Paused',
  idle:           '◌ Idle',
  not_configured: '✕ Not Configured',
};

// ─── Dropdown ─────────────────────────────────────────────────────────────────

function Dropdown({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 hover:border-gray-300 transition-colors shadow-sm font-medium">
        <span className="text-gray-400">{label}:</span>
        <span className="font-semibold text-gray-900">{value}</span>
        <ChevronDown size={12} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[130px]">
          {options.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${value === opt ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, icon: Icon, action, children }: {
  title: string; subtitle?: string; icon?: React.ElementType;
  action?: { label: string; href: string }; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            {Icon && <div className="p-1.5 bg-gray-50 border border-gray-100 rounded-lg"><Icon size={13} className="text-gray-500" /></div>}
            <p className="text-sm font-bold text-gray-900">{title}</p>
          </div>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5 ml-0.5">{subtitle}</p>}
        </div>
        {action && (
          <Link href={action.href} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
            {action.label} <ArrowUpRight size={12} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommandCenterPage() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/command-center?t=${Date.now()}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load command center');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const kpis = data ? [
    {
      label: 'Total Leads',
      val: data.kpis.totalLeads.toLocaleString(),
      sub: 'across all channels',
      icon: Users,
      accent: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Meetings Booked',
      val: data.kpis.meetingsBooked.toString(),
      sub: 'status: meeting_set',
      icon: CheckCircle,
      accent: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Outbound Sent',
      val: data.kpis.outboundSent.toLocaleString(),
      sub: 'total touches',
      icon: Rocket,
      accent: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      label: 'Pending Approvals',
      val: data.kpis.pendingApprovals.toString(),
      sub: 'waiting for review',
      icon: Zap,
      accent: 'text-orange-500',
      bg: 'bg-orange-50',
    },
  ] : [];

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa] font-sans">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 pb-16">

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">
              {error ? (
                <span className="text-red-500">⚠ {error}</span>
              ) : data ? (
                <>All systems monitored · <span className="text-emerald-600 font-semibold">● Live</span></>
              ) : (
                'Loading...'
              )}
            </p>
            {lastUpdated && (
              <p className="text-[10px] text-gray-300 mt-0.5">
                Last updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={13} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <Link href="/dashboard/systems/ai-setter"
              className="flex items-center gap-1.5 h-9 px-4 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors shadow-sm">
              AI Setter <ArrowUpRight size={12} />
            </Link>
            <Link href="/dashboard/outbound"
              className="flex items-center gap-1.5 h-9 px-4 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm">
              Outbound <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-4 gap-5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-2.5 w-32" />
              </div>
            ))
          ) : kpis.map(kpi => (
            <div key={kpi.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">{kpi.label}</p>
                <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={14} className={kpi.accent} /></div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{kpi.val}</p>
              <div className="flex items-center gap-1">
                <TrendingUp size={11} className="text-green-500" />
                <p className="text-xs text-gray-500 font-medium">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Systems + Activity */}
        <div className="grid grid-cols-3 gap-5">
          {/* Systems Health */}
          <div>
            <SectionCard title="System Health" subtitle="Live operational status" icon={Zap}
              action={{ label: 'All Systems', href: '/dashboard/systems' }}>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                      <Skeleton className="w-3 h-3 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : (data?.systems || []).map(sys => (
                  <div key={sys.name} className="flex items-center gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="relative shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLOR[sys.status]}`} />
                      {sys.status === 'operational' && (
                        <div className={`absolute inset-0 rounded-full animate-ping opacity-50 ${STATUS_COLOR[sys.status]}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{sys.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{sys.detail}</p>
                    </div>
                    <span className={`text-[10px] font-bold shrink-0
                      ${sys.status === 'operational' ? 'text-emerald-600' : sys.status === 'paused' ? 'text-amber-600' : 'text-gray-400'}`}>
                      {STATUS_LABEL[sys.status]}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Activity Log */}
          <div className="col-span-2">
            <SectionCard title="Activity Log" subtitle="Recent actions across all systems" icon={Activity}
              action={{ label: 'Approvals', href: '/dashboard/monitoring' }}>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-2.5 w-3/4" />
                        <Skeleton className="h-2 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (data?.activityLog || []).length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {(data?.activityLog || []).map((log, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 hover:bg-gray-50/70 px-1 rounded-xl transition-colors">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0
                        ${log.status === 'approved' ? 'bg-green-50 text-green-600'
                          : log.status === 'pending' ? 'bg-amber-50 text-amber-600'
                          : 'bg-red-50 text-red-500'}`}>
                        {log.status === 'approved'
                          ? <Check size={11} strokeWidth={3} />
                          : log.status === 'pending'
                          ? <Clock size={11} />
                          : <AlertTriangle size={11} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{log.action}</p>
                        <p className="text-[10px] text-gray-400">{relativeTime(log.time)}</p>
                      </div>
                      <span className={`text-[10px] font-bold capitalize shrink-0
                        ${log.status === 'approved' ? 'text-green-600' : log.status === 'pending' ? 'text-amber-600' : 'text-red-500'}`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Activity size={24} className="mb-2 opacity-30" />
                  <p className="text-xs font-medium">No recent activity</p>
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* Recent Campaigns */}
        {!loading && data && data.campaigns.length > 0 && (
          <SectionCard title="Recent Campaigns" subtitle="Latest outbound campaigns" icon={Rocket}
            action={{ label: 'View All', href: '/dashboard/outbound' }}>
            <div className="grid grid-cols-3 gap-4">
              {data.campaigns.map(camp => (
                <Link href="/dashboard/outbound" key={camp.name}
                  className="flex items-center gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-300 hover:bg-white transition-all">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0
                    ${camp.status === 'running' ? 'bg-emerald-400 animate-pulse' : camp.status === 'paused' ? 'bg-amber-400' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{camp.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{camp.status} · {relativeTime(camp.created_at)}</p>
                  </div>
                  <ArrowUpRight size={13} className="text-gray-300 shrink-0" />
                </Link>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Channel Breakdown */}
        {!loading && data && Object.keys(data.channelCounts).length > 0 && (
          <SectionCard title="Channel Overview" subtitle="Lead volume per inbound channel" icon={BarChart2}>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(Object.keys(data.channelCounts).length, 5)}, 1fr)` }}>
              {Object.entries(data.channelCounts).map(([ch, count]) => {
                const total = Object.values(data.channelCounts).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                const colors: Record<string, string> = {
                  instagram: 'bg-pink-400', whatsapp: 'bg-green-500',
                  email: 'bg-blue-500', linkedin: 'bg-blue-700', voice: 'bg-purple-500',
                };
                return (
                  <div key={ch} className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                    <div className={`w-9 h-9 rounded-xl ${colors[ch] || 'bg-gray-400'} mx-auto mb-3`} />
                    <p className="text-xs font-bold text-gray-900 capitalize mb-1">{ch}</p>
                    <p className="text-xl font-bold text-gray-900">{count}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{pct}% of total</p>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

      </div>
    </div>
  );
}
