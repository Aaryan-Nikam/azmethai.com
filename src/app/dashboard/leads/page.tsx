'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Camera, Hash,
  Mail, Link2, Phone, MoreHorizontal,
  ArrowUpRight, Star, StarOff, CircleCheck, Clock,
  Calendar, X, Check, RefreshCw, AlertCircle
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'meeting_set' | 'disqualified';
type Channel = 'instagram' | 'whatsapp' | 'email' | 'linkedin' | 'voice';

interface Lead {
  lead_id: string;
  channel: Channel;
  sender_name: string;
  sender_contact: string;
  latest_score: number;
  last_intent: string | null;
  paused: boolean;
  last_seen: string;
  status: LeadStatus;
  agent_name: string;
  starred: boolean;
  company_name: string | null;
  role_title: string | null;
}

// ─── Config ────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<LeadStatus, { label: string; color: string; icon: React.ElementType }> = {
  new:          { label: 'New',         color: 'bg-gray-100 text-gray-600 border-gray-200',      icon: Clock },
  contacted:    { label: 'Active',      color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: ArrowUpRight },
  qualified:    { label: 'Qualified',   color: 'bg-green-50 text-green-700 border-green-200',    icon: CircleCheck },
  meeting_set:  { label: 'Meeting Set', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Calendar },
  disqualified: { label: "DQ'd",        color: 'bg-red-50 text-red-500 border-red-200',          icon: X },
};

const CHANNEL_MAP: Record<Channel, { icon: React.ElementType; color: string; label: string }> = {
  instagram: { icon: Camera, color: 'text-pink-500',   label: 'Instagram' },
  whatsapp:  { icon: Hash,   color: 'text-green-600',  label: 'WhatsApp' },
  email:     { icon: Mail,   color: 'text-blue-500',   label: 'Email' },
  linkedin:  { icon: Link2,  color: 'text-blue-700',   label: 'LinkedIn' },
  voice:     { icon: Phone,  color: 'text-purple-500', label: 'Voice' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function displayName(lead: Lead): string {
  if (lead.sender_name?.trim()) return lead.sender_name;
  if (lead.sender_contact) return `#${lead.sender_contact.slice(-6)}`;
  return lead.lead_id.split('_').slice(-1)[0]?.slice(-8) || 'Unknown';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-700 bg-green-50' : score >= 50 ? 'text-yellow-700 bg-yellow-50' : 'text-red-600 bg-red-50';
  const icon = score >= 80 ? '🔥' : score >= 50 ? '⚡' : '❄️';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {icon} {score || 0}
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LeadsCRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<Channel | 'all'>('all');
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'recent' | 'name'>('score');

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setLeads(data.leads as Lead[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const patch = async (lead_id: string, updates: Partial<Lead>) => {
    // Optimistic update
    setLeads(p => p.map(l => l.lead_id === lead_id ? { ...l, ...updates } : l));
    setActiveLeadId(prev => prev); // keep drawer open
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id, ...updates }),
    });
  };

  const filtered = leads
    .filter(l => {
      const q = search.toLowerCase();
      const name = displayName(l).toLowerCase();
      const matchSearch = name.includes(q) || (l.company_name || '').toLowerCase().includes(q) || l.channel.includes(q);
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchChannel = channelFilter === 'all' || l.channel === channelFilter;
      return matchSearch && matchStatus && matchChannel;
    })
    .sort((a, b) =>
      sortBy === 'score' ? (b.latest_score || 0) - (a.latest_score || 0)
      : sortBy === 'recent' ? new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
      : displayName(a).localeCompare(displayName(b))
    );

  const activeLead = leads.find(l => l.lead_id === activeLeadId);

  const meetingsBooked = leads.filter(l => l.status === 'meeting_set').length;
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + (l.latest_score || 0), 0) / leads.length) : 0;
  const meetingRate = leads.length > 0 ? Math.round((meetingsBooked / leads.length) * 100) : 0;

  return (
    <div className="flex h-full bg-gray-50 font-sans overflow-hidden">

      {/* ── MAIN TABLE AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Leads CRM</h1>
              <p className="text-sm text-gray-500">{filtered.length} leads · {meetingsBooked} meetings booked</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchLeads} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50" title="Refresh">
                <RefreshCw size={14} className="text-gray-400" />
              </button>
              <button className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
                <Plus size={15} /> Add Lead
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-4">
            {[
              { label: 'Total Leads', val: leads.length.toString(), color: 'text-gray-900' },
              { label: 'Avg. Intent Score', val: avgScore ? `${avgScore}/100` : '—', color: 'text-blue-600' },
              { label: 'Meeting Rate', val: `${meetingRate}%`, color: 'text-green-600' },
              { label: 'Disqualified', val: leads.filter(l => l.status === 'disqualified').length.toString(), color: 'text-red-500' },
            ].map(pill => (
              <div key={pill.label} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{pill.label}</p>
                <p className={`text-lg font-bold ${pill.color}`}>{pill.val}</p>
              </div>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search leads by name, company, or channel…"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as LeadStatus | 'all')}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 appearance-none cursor-pointer">
              <option value="all">All Statuses</option>
              {(Object.entries(STATUS_MAP) as [LeadStatus, typeof STATUS_MAP[LeadStatus]][]).map(([k, v]) =>
                <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={channelFilter} onChange={e => setChannelFilter(e.target.value as Channel | 'all')}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 appearance-none cursor-pointer">
              <option value="all">All Channels</option>
              {(Object.entries(CHANNEL_MAP) as [Channel, typeof CHANNEL_MAP[Channel]][]).map(([k, v]) =>
                <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 appearance-none cursor-pointer">
              <option value="score">Sort: Intent Score</option>
              <option value="recent">Sort: Most Recent</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-6 text-sm text-red-600">
              <AlertCircle size={15} /> {error}
            </div>
          )}
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
              <tr>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-3 w-8" />
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3">Lead</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3">Channel</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3">Status</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3">Intent</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3">Last Active</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3">Agent</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="bg-white">
                    <td className="px-6 py-4"><Skeleton className="w-4 h-4" /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-1.5"><Skeleton className="h-3 w-28" /><Skeleton className="h-2 w-20" /></div>
                      </div>
                    </td>
                    {Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-4"><Skeleton className="h-3 w-16" /></td>)}
                    <td className="px-4 py-4" />
                  </tr>
                ))
              ) : filtered.map(lead => {
                const ChannelIcon = CHANNEL_MAP[lead.channel]?.icon || Mail;
                const StatusCfg = STATUS_MAP[lead.status];
                const StatusIcon = StatusCfg.icon;
                return (
                  <tr key={lead.lead_id}
                    onClick={() => setActiveLeadId(activeLeadId === lead.lead_id ? null : lead.lead_id)}
                    className={`cursor-pointer transition-colors ${activeLeadId === lead.lead_id ? 'bg-blue-50/60' : 'bg-white hover:bg-gray-50/70'}`}>
                    <td className="px-6 py-3.5" onClick={e => { e.stopPropagation(); patch(lead.lead_id, { starred: !lead.starred }); }}>
                      {lead.starred
                        ? <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        : <StarOff size={14} className="text-gray-300 hover:text-gray-400" />}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">
                          {displayName(lead)[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{displayName(lead)}</p>
                          <p className="text-xs text-gray-400">{lead.role_title ? `${lead.role_title} · ` : ''}{lead.company_name || lead.sender_contact}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <ChannelIcon size={14} className={CHANNEL_MAP[lead.channel]?.color || 'text-gray-500'} />
                        <span className="text-xs text-gray-600 capitalize">{CHANNEL_MAP[lead.channel]?.label || lead.channel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${StatusCfg.color}`}>
                        <StatusIcon size={10} /> {StatusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><ScoreBadge score={lead.latest_score} /></td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-medium text-gray-700">{relativeTime(lead.last_seen)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{lead.agent_name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <MoreHorizontal size={15} className="text-gray-400 hover:text-gray-700 cursor-pointer" />
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && !error && (
                <tr><td colSpan={8} className="text-center py-16 text-sm text-gray-400">No leads found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── LEAD DETAIL DRAWER ── */}
      {activeLead && (
        <aside className="w-72 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-y-auto shadow-[-4px_0_15px_rgba(0,0,0,0.03)]">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-base font-bold text-gray-900">{displayName(activeLead)}</p>
                <p className="text-xs text-gray-400">{activeLead.role_title || 'Unknown role'}</p>
                <p className="text-xs font-semibold text-gray-600 mt-0.5">{activeLead.company_name || '—'}</p>
              </div>
              <button onClick={() => setActiveLeadId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={14} className="text-gray-400" /></button>
            </div>
            <ScoreBadge score={activeLead.latest_score} />
          </div>

          <div className="p-5 space-y-3 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Info</p>
            {[
              { label: 'Contact ID', val: activeLead.sender_contact || activeLead.lead_id },
              { label: 'Channel', val: CHANNEL_MAP[activeLead.channel]?.label || activeLead.channel },
              { label: 'Last Intent', val: activeLead.last_intent || 'Unknown' },
              { label: 'Last Active', val: relativeTime(activeLead.last_seen) },
            ].map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="text-xs text-gray-400">{r.label}</span>
                <span className="text-xs font-semibold text-gray-900 text-right max-w-[55%] truncate">{r.val}</span>
              </div>
            ))}
          </div>

          <div className="p-5 space-y-2 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pipeline Stage</p>
            {(Object.entries(STATUS_MAP) as [LeadStatus, typeof STATUS_MAP[LeadStatus]][]).map(([k, v]) => {
              const StatusIcon = v.icon;
              const isActive = activeLead.status === k;
              return (
                <div key={k}
                  onClick={() => { patch(activeLead.lead_id, { status: k }); setActiveLeadId(activeLead.lead_id); }}
                  className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${isActive ? 'bg-gray-50 border border-gray-200' : ''}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-gray-900 bg-gray-900' : 'border-gray-300 hover:border-gray-500'}`}>
                    {isActive && <Check size={9} className="text-white" strokeWidth={3} />}
                  </div>
                  <StatusIcon size={12} className={isActive ? 'text-gray-900' : 'text-gray-400'} />
                  <span className={`text-xs font-semibold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{v.label}</span>
                </div>
              );
            })}
          </div>

          <div className="p-5 space-y-2">
            <button className="w-full py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors">Book Meeting</button>
            <a href={`/dashboard/inbox`} className="block w-full py-2.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors text-center">
              View Conversation
            </a>
            <button onClick={() => patch(activeLead.lead_id, { status: 'disqualified' })}
              className="w-full py-2.5 border border-red-100 text-red-500 text-xs font-bold rounded-xl hover:bg-red-50 transition-colors">
              Disqualify Lead
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
