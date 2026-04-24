'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, MoreHorizontal, X, Rocket, Send, Users,
  TrendingUp, BarChart2, Zap, Play, Pause, RefreshCw,
  ArrowUpRight, CheckCircle2, Clock, AlertCircle, Filter,
  ChevronRight, Target, MessageSquare, Mail, Trash2, Copy,
  Settings, StopCircle
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

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<CampaignStatus, { label: string; dot: string; badge: string }> = {
  running:   { label: '● Running',   dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paused:    { label: '○ Paused',    dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  draft:     { label: '◌ Draft',     dot: 'bg-gray-300',    badge: 'bg-gray-50 text-gray-500 border-gray-200' },
  completed: { label: '✓ Done',      dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  gmail:     <svg key="gmail" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill="#EA4335"/></svg>,
  instantly: <Zap key="ins" size={13} className="text-[#5B4CF5]" />,
  smartlead: <TrendingUp key="sl" size={13} className="text-gray-500" />,
  instagram: <MessageSquare key="ig" size={13} className="text-rose-500" />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onCancel }: {
  title: string; message: string; confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-full max-w-sm mx-4"
      >
        <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-black'}`}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold
        ${type === 'success' ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-700'}`}
    >
      {type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {message}
    </motion.div>
  );
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({
  camp,
  onDelete,
  onStatusChange,
  onDuplicate,
}: {
  camp: Campaign;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: CampaignStatus) => void;
  onDuplicate: (camp: Campaign) => void;
}) {
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cfg = STATUS_CFG[camp.status];
  const replyRate = camp.sent > 0 ? Math.round((camp.replied / camp.sent) * 100) : 0;
  const openRate  = camp.sent > 0 ? Math.round((camp.opened  / camp.sent) * 100) : 0;

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleStatusToggle = async () => {
    setMenu(false);
    setBusy(true);
    const next = camp.status === 'running' ? 'paused' : 'running';
    await onStatusChange(camp.id, next);
    setBusy(false);
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    setBusy(true);
    await onDelete(camp.id);
    setBusy(false);
  };

  const menuItems = [
    {
      label: camp.status === 'running' ? 'Pause Campaign' : 'Resume Campaign',
      icon: camp.status === 'running' ? Pause : Play,
      action: handleStatusToggle,
      color: 'text-amber-700',
    },
    {
      label: 'Mark as Completed',
      icon: StopCircle,
      action: () => { setMenu(false); onStatusChange(camp.id, 'completed'); },
      color: 'text-blue-700',
      hidden: camp.status === 'completed',
    },
    {
      label: 'Duplicate Campaign',
      icon: Copy,
      action: () => { setMenu(false); onDuplicate(camp); },
      color: 'text-gray-700',
    },
    {
      label: 'Delete Campaign',
      icon: Trash2,
      action: () => { setMenu(false); setConfirmDelete(true); },
      color: 'text-red-600',
      danger: true,
    },
  ].filter(i => !i.hidden);

  return (
    <>
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmModal
            title="Delete Campaign?"
            message={`This will permanently delete "${camp.name}" and all its leads, messages, and scraper jobs. This cannot be undone.`}
            confirmLabel="Delete"
            danger
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className={`bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all group ${busy ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-5 pb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform
            ${camp.status === 'running' ? 'bg-emerald-50' : camp.status === 'paused' ? 'bg-amber-50' : 'bg-rose-50'}`}>
            <Rocket size={18} className={camp.status === 'running' ? 'text-emerald-600' : camp.status === 'paused' ? 'text-amber-600' : 'text-rose-600'} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 text-sm truncate">{camp.name}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${cfg.badge}`}>{cfg.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-400">{camp.createdAt}</span>
              {camp.framework && (
                <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{camp.framework}</span>
              )}
              <div className="flex items-center gap-1">
                {camp.channels.map(c => <span key={c}>{CHANNEL_ICONS[c]}</span>)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Link href={`/dashboard/outbound/campaigns/${camp.id}`}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-all">
              View <ArrowUpRight size={10} />
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenu(m => !m)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                disabled={busy}
              >
                {busy ? <RefreshCw size={14} className="animate-spin" /> : <MoreHorizontal size={15} />}
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-9 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5 w-48"
                  >
                    {menuItems.map(item => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-2.5 hover:bg-gray-50 transition-colors ${item.color} ${item.danger ? 'border-t border-gray-100 mt-1 pt-2.5' : ''}`}
                      >
                        <item.icon size={13} />
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Funnel Stats */}
        <div className="px-5 pb-5">
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Scraped',   val: camp.totalLeads, color: 'text-gray-900' },
              { label: 'Qualified', val: camp.qualified,  color: 'text-blue-700' },
              { label: 'Sent',      val: camp.sent,       color: 'text-gray-900' },
              { label: 'Replied',   val: camp.replied,    color: 'text-emerald-700' },
            ].map(s => (
              <div key={s.label}>
                <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.val.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
              <span className="w-16">Reply rate</span>
              <FunnelBar value={camp.replied} max={camp.sent} color="bg-emerald-400" />
              <span className="font-bold text-gray-700">{replyRate}%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── New Campaign Modal ───────────────────────────────────────────────────────

function NewCampaignModal({ onClose, onCreated, showToast }: { onClose: () => void, onCreated: () => void, showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [name, setName] = useState('');
  const [framework, setFramework] = useState('AIDA');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/outbound/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          config: { framework, channels: ['gmail'] },
          icp: {}
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create campaign');
      showToast('Campaign created successfully', 'success');
      onCreated();
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg">New Campaign</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Campaign Name</label>
            <input autoFocus required value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Q4 Enterprise SaaS Leads"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Copywriting Framework</label>
            <select value={framework} onChange={e => setFramework(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white">
              <option value="AIDA">AIDA (Attention, Interest, Desire, Action)</option>
              <option value="PAS">PAS (Problem, Agitation, Solution)</option>
              <option value="BAB">BAB (Before, After, Bridge)</option>
              <option value="Custom">Custom Direct</option>
            </select>
          </div>
          <div className="pt-2 flex justify-end">
            <button type="submit" disabled={busy || !name.trim()}
              className="px-5 py-2 text-sm font-bold bg-gray-900 text-white rounded-xl hover:bg-black transition-colors disabled:opacity-50">
              {busy ? 'Creating...' : 'Launch Campaign'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutboundHQPage() {
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState<'all' | CampaignStatus>('all');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`/api/outbound/campaigns/summary?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        setCampaigns(json.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 5000);
    return () => clearInterval(interval);
  }, [fetchCampaigns]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/outbound/campaigns/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Delete failed');
      }
      setCampaigns(prev => prev.filter(c => c.id !== id));
      showToast('Campaign deleted');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete campaign', 'error');
    }
  };

  // ── Status change (pause / resume / complete) ─────────────────────────────
  const handleStatusChange = async (id: string, status: CampaignStatus) => {
    try {
      const res = await fetch(`/api/outbound/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Update failed');
      }
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      const labels: Record<CampaignStatus, string> = {
        running: 'Campaign resumed ▶',
        paused: 'Campaign paused ⏸',
        completed: 'Campaign marked complete ✓',
        draft: 'Campaign set to draft',
      };
      showToast(labels[status] || 'Status updated');
    } catch (err: any) {
      showToast(err.message || 'Failed to update campaign', 'error');
    }
  };

  // ── Duplicate ─────────────────────────────────────────────────────────────
  const handleDuplicate = async (camp: Campaign) => {
    try {
      const res = await fetch('/api/outbound/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${camp.name} (copy)`,
          config: { framework: camp.framework, channels: camp.channels },
          icp: {},
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Duplicate failed');
      }
      showToast('Campaign duplicated ✓');
      fetchCampaigns();
    } catch (err: any) {
      showToast(err.message || 'Failed to duplicate campaign', 'error');
    }
  };

  const allLeads   = campaigns.reduce((a, c) => a + c.totalLeads, 0);
  const allSent    = campaigns.reduce((a, c) => a + c.sent, 0);
  const allReplied = campaigns.reduce((a, c) => a + c.replied, 0);
  const allQual    = campaigns.reduce((a, c) => a + c.qualified, 0);

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
          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-black transition-colors shadow-sm">
            <Plus size={15} /> New Campaign
          </button>
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
                { label: 'Qualified Leads', val: allQual.toLocaleString(),    icon: CheckCircle2,  color: 'text-blue-400' },
                { label: 'Emails Sent',     val: allSent.toLocaleString(),    icon: Send,          color: 'text-white' },
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
            { label: 'Scraped',      val: allLeads,   icon: Search,        color: 'text-gray-600',   bg: 'bg-gray-50' },
            { label: 'Qualified',    val: allQual,    icon: CheckCircle2,  color: 'text-blue-600',   bg: 'bg-blue-50' },
            { label: 'Personalised', val: allSent,    icon: Target,        color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Sent',         val: allSent,    icon: Send,          color: 'text-gray-600',   bg: 'bg-gray-50' },
            { label: 'Replied',      val: allReplied, icon: MessageSquare, color: 'text-emerald-600',bg: 'bg-emerald-50' },
          ].map(s => (
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
            {(['all', 'running', 'paused', 'draft', 'completed'] as const).map(v => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filter === v ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={fetchCampaigns} title="Refresh"
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Campaign cards */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-4">
            {filter === 'all' ? 'All Campaigns' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Campaigns`}
            <span className="ml-2 text-gray-400 font-normal">({filtered.length})</span>
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <RefreshCw size={24} className="animate-spin mb-4" />
              <p className="text-sm font-semibold">Loading campaigns...</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="grid grid-cols-2 gap-4">
                {filtered.map(camp => (
                  <CampaignCard
                    key={camp.id}
                    camp={camp}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white border border-gray-200 border-dashed rounded-3xl">
              <Rocket size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">
                {search || filter !== 'all' ? 'No campaigns match your filter' : 'No campaigns yet'}
              </p>
              <Link href="/dashboard/systems/outbound-engine" className="mt-3 inline-block text-xs text-rose-600 font-bold hover:underline">
                + Launch your first campaign
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* Modals & Toast */}
      <AnimatePresence>
        {showNewModal && (
          <NewCampaignModal 
            onClose={() => setShowNewModal(false)}
            onCreated={fetchCampaigns}
            showToast={showToast}
          />
        )}
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
