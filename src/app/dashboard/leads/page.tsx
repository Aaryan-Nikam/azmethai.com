'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Camera, Hash,
  Mail, Link2, Phone, ArrowUpRight,
  Star, StarOff, CircleCheck, Clock,
  Calendar, X, Check, RefreshCw, AlertCircle, MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────────

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'meeting_set' | 'disqualified' | 'sent' | 'replied' | 'personalise' | 'qualify' | 'scraped';
type Channel = 'instagram' | 'whatsapp' | 'email' | 'linkedin' | 'voice' | 'direct';

interface UnifiedLead {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  website: string | null;
  source: 'inbound' | 'outbound';
  channel: Channel | string;
  stage: LeadStatus;
  score: number;
  created_at: string;
  campaign_id: string | null;
  contact_id: string | null;
  role: string | null;
  starred?: boolean; // Client-side addition for now
}

interface SummaryStats {
  total: number;
  inbound: number;
  outbound: number;
  by_stage: Record<string, number>;
  avg_score: number;
}

// ─── Config ────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  new:          { label: 'New',         color: 'bg-gray-100 text-gray-600 border-gray-200',      icon: Clock },
  contacted:    { label: 'Active',      color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: ArrowUpRight },
  qualified:    { label: 'Qualified',   color: 'bg-green-50 text-green-700 border-green-200',    icon: CircleCheck },
  meeting_set:  { label: 'Meeting Set', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Calendar },
  disqualified: { label: "DQ'd",        color: 'bg-red-50 text-red-500 border-red-200',          icon: X },
  // Outbound stages
  scraped:      { label: 'Scraped',     color: 'bg-gray-100 text-gray-600 border-gray-200',      icon: Search },
  qualify:      { label: 'Qualifying',  color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: Clock },
  personalise:  { label: 'Personalising',color: 'bg-indigo-50 text-indigo-700 border-indigo-200',icon: Star },
  sent:         { label: 'Sent',        color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: ArrowUpRight },
  replied:      { label: 'Replied',     color: 'bg-green-50 text-green-700 border-green-200',    icon: Mail },
};

const CHANNEL_MAP: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  instagram: { icon: Camera, color: 'text-pink-500',   label: 'Instagram' },
  whatsapp:  { icon: Hash,   color: 'text-green-600',  label: 'WhatsApp' },
  email:     { icon: Mail,   color: 'text-blue-500',   label: 'Email' },
  linkedin:  { icon: Link2,  color: 'text-blue-700',   label: 'LinkedIn' },
  voice:     { icon: Phone,  color: 'text-purple-500', label: 'Voice' },
  direct:    { icon: Search, color: 'text-gray-500',   label: 'Outbound' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function displayName(lead: UnifiedLead): string {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim();
  if (name && name !== 'Anonymous' && name !== 'Unknown') return name;
  if (lead.email) return lead.email;
  if (lead.contact_id) return `#${lead.contact_id.slice(-6)}`;
  return lead.id.split('_').slice(-1)[0]?.slice(-8) || 'Unknown';
}

function relativeTime(iso: string): string {
  if (!iso) return 'Unknown';
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
  const [leads, setLeads] = useState<UnifiedLead[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [scoreMin, setScoreMin] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (statusFilter !== 'all') params.set('stage', statusFilter);
      if (channelFilter !== 'all') params.set('channel', channelFilter);
      if (scoreMin !== 'all') params.set('score_min', scoreMin);
      if (dateRange !== 'all') {
        const dateParam = new Date();
        dateParam.setDate(dateParam.getDate() - Number(dateRange));
        params.set('date_from', dateParam.toISOString());
      }
      if (search.trim()) params.set('search', search.trim());
      
      const res = await fetch(`/api/leads/unified?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      
      setLeads(data.leads as UnifiedLead[]);
      setSummary(data.summary as SummaryStats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, statusFilter, channelFilter, scoreMin, dateRange, search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { fetchLeads(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  const exportCSV = () => {
    if (!leads.length) return;
    const headers = ["ID", "Name", "Company", "Email", "Role", "Source", "Channel", "Stage", "Score", "Added"];
    const rows = leads.map(l => [
      l.id,
      displayName(l),
      l.company || '',
      l.email || l.contact_id || '',
      l.role || '',
      l.source,
      l.channel,
      l.stage,
      l.score.toString(),
      new Date(l.created_at).toISOString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(field => `"${field}"`).join(","))].join("\\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `azmeth-leads-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const patch = async (id: string, updates: Partial<UnifiedLead>) => {
    // Optimistic array update
    setLeads(p => p.map(l => l.id === id ? { ...l, ...updates } : l));
    setActiveLeadId(prev => prev); // keep drawer open
    
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    if (lead.source === 'inbound') {
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: id, system: 'inbound', ...updates }),
      });
      return;
    }

    const stage = typeof updates.stage === 'string' ? updates.stage : null;
    const outboundTriggerByStage: Record<string, 'research' | 'qualify' | 'personalise' | 'send'> = {
      scraped: 'research',
      qualify: 'qualify',
      qualified: 'personalise',
      personalise: 'personalise',
      sent: 'send',
      replied: 'send',
    };

    if (stage && outboundTriggerByStage[stage]) {
      const trigger = outboundTriggerByStage[stage];
      if (trigger === 'send') {
        await fetch('/api/outbound/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: id }),
        });
      } else {
        await fetch(`/api/outbound/${trigger}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: id }),
        });
      }
    }

    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: id, system: 'outbound', ...updates }),
    });
  };

  const handleAddLead = async () => {
    const fullName = window.prompt('Lead full name');
    if (!fullName?.trim()) return;

    const email = window.prompt('Lead email (required)');
    if (!email?.trim()) return;

    const company = window.prompt('Company name (optional)') || '';
    const role = window.prompt('Role / title (optional)') || '';
    const channel = (window.prompt('Channel: instagram | whatsapp | email | linkedin | voice', 'email') || 'email').toLowerCase();

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'inbound',
          full_name: fullName.trim(),
          email: email.trim(),
          company_name: company.trim() || null,
          role_title: role.trim() || null,
          channel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create lead');

      toast.success('Lead added');
      fetchLeads();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add lead';
      toast.error(msg);
    }
  };

  const handleBookMeeting = async (lead: UnifiedLead) => {
    try {
      if (lead.source === 'inbound') {
        await patch(lead.id, { stage: 'meeting_set' as LeadStatus });
      } else {
        await patch(lead.id, { stage: 'replied' as LeadStatus });
      }
      toast.success('Lead moved to meeting booked state');
      fetchLeads();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update meeting state';
      toast.error(msg);
    }
  };

  const activeLead = leads.find(l => l.id === activeLeadId);

  return (
    <div className="flex h-full bg-gray-50 font-sans overflow-hidden">
      {/* ── MAIN TABLE AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Unified Pipeline</h1>
              <p className="text-sm text-gray-500">{summary?.total || 0} total leads · {(summary?.by_stage?.meeting_set || 0)} meetings booked</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchLeads} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50" title="Refresh">
                <RefreshCw size={14} className="text-gray-400" />
              </button>
              <button onClick={exportCSV} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 text-sm font-semibold pr-4">
                Export CSV
              </button>
              <button onClick={handleAddLead} className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
                <Plus size={15} /> Add Lead
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-4">
            {[
              { label: 'Total Leads', val: (summary?.total || 0).toString(), color: 'text-gray-900' },
              { label: 'Inbound', val: (summary?.inbound || 0).toString(), color: 'text-indigo-600' },
              { label: 'Outbound', val: (summary?.outbound || 0).toString(), color: 'text-orange-600' },
              { label: 'Avg. Score', val: summary?.avg_score ? `${summary.avg_score}/100` : '—', color: 'text-blue-600' },
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
                placeholder="Search leads by name, company, or email…"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200" />
            </div>
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value as any)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 appearance-none cursor-pointer">
              <option value="all">All Sources</option>
              <option value="inbound">Inbound (Chat)</option>
              <option value="outbound">Outbound (Campaigns)</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 appearance-none cursor-pointer">
              <option value="all">All Stages</option>
              {(Object.entries(STATUS_MAP) as [string, typeof STATUS_MAP[string]][]).map(([k, v]) =>
                <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 appearance-none cursor-pointer">
              <option value="all">All Channels</option>
              {(Object.entries(CHANNEL_MAP) as [string, typeof CHANNEL_MAP[string]][]).map(([k, v]) =>
                <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={scoreMin} onChange={e => setScoreMin(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 appearance-none cursor-pointer">
              <option value="all">Any Score</option>
              <option value="50">Score 50+</option>
              <option value="80">Score 80+</option>
              <option value="90">Score 90+</option>
            </select>
            <select value={dateRange} onChange={e => setDateRange(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:border-gray-400 appearance-none cursor-pointer">
              <option value="all">Any Added Date</option>
              <option value="1">Last 24h</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
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
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3">Source</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3">Channel</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3">Stage</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3">Intent Score</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3">Added</th>
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
                    {Array.from({ length: 4 }).map((_, j) => <td key={j} className="px-4 py-4"><Skeleton className="h-3 w-16" /></td>)}
                    <td className="px-4 py-4"><Skeleton className="h-3 w-12" /></td>
                    <td className="px-4 py-4" />
                  </tr>
                ))
              ) : leads.map(lead => {
                const ChannelIcon = CHANNEL_MAP[lead.channel]?.icon || Mail;
                const StatusCfg = STATUS_MAP[lead.stage] || STATUS_MAP['new'];
                const StatusIcon = StatusCfg.icon;
                return (
                  <tr key={lead.id}
                    onClick={() => setActiveLeadId(activeLeadId === lead.id ? null : lead.id)}
                    className={`cursor-pointer transition-colors ${activeLeadId === lead.id ? 'bg-blue-50/60' : 'bg-white hover:bg-gray-50/70'}`}>
                    <td className="px-6 py-3.5" onClick={e => { e.stopPropagation(); patch(lead.id, { starred: !lead.starred }); }}>
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
                          <p className="text-xs text-gray-400">{lead.role ? `${lead.role} · ` : ''}{lead.company || lead.contact_id || lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${lead.source === 'inbound' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                        {lead.source}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <ChannelIcon size={14} className={CHANNEL_MAP[lead.channel]?.color || 'text-gray-500'} />
                        <span className="text-[11px] font-bold text-gray-600 capitalize">{CHANNEL_MAP[lead.channel]?.label || lead.channel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${StatusCfg.color}`}>
                        <StatusIcon size={10} /> {StatusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><ScoreBadge score={lead.score} /></td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-medium text-gray-700">{relativeTime(lead.created_at)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <MoreHorizontal size={15} className="text-gray-400 hover:text-gray-700 cursor-pointer" />
                    </td>
                  </tr>
                );
              })}
              {!loading && leads.length === 0 && !error && (
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
                <p className="text-xs text-gray-400">{activeLead.role || 'Unknown role'}</p>
                <p className="text-xs font-semibold text-gray-600 mt-0.5">{activeLead.company || '—'}</p>
              </div>
              <button onClick={() => setActiveLeadId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={14} className="text-gray-400" /></button>
            </div>
            <ScoreBadge score={activeLead.score} />
          </div>

          <div className="p-5 space-y-3 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Info</p>
            {[
              { label: 'Identifier', val: activeLead.contact_id || activeLead.email || activeLead.id },
              { label: 'Source', val: activeLead.source === 'inbound' ? 'Inbound (Chat)' : 'Outbound (Campaign)' },
              { label: 'Channel', val: CHANNEL_MAP[activeLead.channel]?.label || activeLead.channel },
              { label: 'Added', val: new Date(activeLead.created_at).toLocaleDateString() },
            ].map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="text-xs text-gray-400">{r.label}</span>
                <span className="text-xs font-semibold text-gray-900 text-right max-w-[55%] truncate">{r.val}</span>
              </div>
            ))}
          </div>

          <div className="p-5 space-y-2 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pipeline Stage</p>
            {(Object.entries(STATUS_MAP) as [string, typeof STATUS_MAP[string]][])
              .filter(([k]) => activeLead.source === 'outbound' || ['new', 'contacted', 'qualified', 'meeting_set', 'disqualified'].includes(k))
              .map(([k, v]) => {
              const StatusIcon = v.icon;
              const isActive = activeLead.stage === k;
              return (
                <div key={k}
                  onClick={() => { patch(activeLead.id, { stage: k as any }); setActiveLeadId(activeLead.id); }}
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
            <button onClick={() => handleBookMeeting(activeLead)} className="w-full py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors">Book Meeting</button>
            {activeLead.source === 'inbound' && (
              <a href={`/dashboard/inbox`} className="block w-full py-2.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors text-center">
                View Conversation
              </a>
            )}
            {activeLead.source === 'outbound' && (
              <a href={`/dashboard/outbound/${activeLead.campaign_id}`} className="block w-full py-2.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors text-center">
                View Campaign
              </a>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
