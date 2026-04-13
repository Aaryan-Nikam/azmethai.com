'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown, ChevronRight, Plus, Search, MoreHorizontal, X,
  Zap, BarChart2, Play, Pause, Settings, ExternalLink,
  CheckCircle2, AlertCircle, Clock, Circle,
  Bot, GitBranch, Wrench, Shield, Send, Users, FileText,
  Camera, Hash, Mail, Link2, TrendingUp, RefreshCw,
  Video, Megaphone, Layers, Package, SlidersHorizontal,
  ArrowUpRight, Activity, Inbox, Star, Cpu,
  BrainCircuit, Filter, PenTool, SearchCheck, Rocket
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Health = 'healthy' | 'warning' | 'error' | 'paused' | 'soon';
type SysStatus = 'active' | 'building' | 'planned';

interface Comp {
  id: string;
  name: string;
  type: string;
  icon: React.ElementType;
  health: Health;
  lastRun: string;
  metric: string;
  metricLabel: string;
  href?: string;
  tags: string[];
  progress?: number; // 0-100, for "building" items
}

interface System {
  id: string;
  name: string;
  tagline: string;
  icon: React.ElementType;
  status: SysStatus;
  railColor: string;   // left border accent
  iconBg: string;
  iconColor: string;
  badgeColor: string;
  components: Comp[];
  kpis: { label: string; value: string; trend?: string; up?: boolean }[];
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const SYSTEMS: System[] = [
  {
    id: 'ai-setter',
    name: 'AI Setter',
    tagline: 'Multichannel outbound engine — cold prospect to booked call, fully automated.',
    icon: Zap,
    status: 'active',
    railColor: 'bg-blue-500',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    badgeColor: 'text-green-700 bg-green-50 border-green-200',
    kpis: [
      { label: 'Pipeline', value: '$142.5k', trend: '+14%', up: true },
      { label: 'Meetings', value: '36', trend: '+8', up: true },
      { label: 'Reply Rate', value: '34%', trend: '+2.1%', up: true },
      { label: 'Avg Cost/Lead', value: '$0.003', trend: '-12%', up: true },
    ],
    components: [
      { id: 'sdr-alpha', name: 'SDR Alpha', type: 'Lead Agent', icon: Bot, health: 'healthy', lastRun: '2m ago', metric: '1,840', metricLabel: 'messages sent', href: '/dashboard/agent', tags: ['gpt-4o', 'multichannel'] },
      { id: 'email-setter', name: 'Email Setter', type: 'Sub-Agent', icon: Mail, health: 'healthy', lastRun: '12m ago', metric: '920', metricLabel: 'messages sent', tags: ['claude-3-5', 'email'] },
      { id: 'linkedin-bot', name: 'LinkedIn Connector', type: 'Sub-Agent', icon: Link2, health: 'paused', lastRun: '2d ago', metric: '340', metricLabel: 'messages sent', tags: ['gpt-4o', 'linkedin'] },
      { id: 'inbox', name: 'Live Inbox', type: 'Inbox', icon: Inbox, health: 'healthy', lastRun: 'Live', metric: '4', metricLabel: 'active threads', href: '/dashboard/inbox', tags: ['realtime'] },
      { id: 'crm', name: 'Leads CRM', type: 'Database', icon: Users, health: 'healthy', lastRun: 'Live', metric: '1,000', metricLabel: 'leads tracked', href: '/dashboard/leads', tags: ['realtime'] },
      { id: 'workflows', name: 'Outreach Workflows', type: 'Automation', icon: GitBranch, health: 'healthy', lastRun: '1h ago', metric: '5', metricLabel: 'active flows', tags: ['n8n'] },
      { id: 'analytics', name: 'Analytics', type: 'Dashboard', icon: BarChart2, health: 'healthy', lastRun: 'Live', metric: '34%', metricLabel: 'conv. rate', href: '/dashboard/analytics', tags: ['realtime'] },
      { id: 'compliance', name: 'Compliance Engine', type: 'Compliance', icon: Shield, health: 'healthy', lastRun: 'Auto', metric: '100%', metricLabel: 'TCPA enforced', tags: ['auto'] },
    ],
  },
  {
    id: 'outbound-engine',
    name: 'Outbound Engine',
    tagline: 'Intent-driven B2B outbound — scrape, research, personalise, and send at scale.',
    icon: Rocket,
    status: 'active',
    railColor: 'bg-rose-500',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    badgeColor: 'text-green-700 bg-green-50 border-green-200',
    kpis: [
      { label: 'Leads Scraped', value: '0', trend: '', up: true },
      { label: 'Qualified', value: '0', trend: '', up: true },
      { label: 'Emails Sent', value: '0', trend: '', up: true },
      { label: 'Reply Rate', value: '—', trend: '', up: true },
    ],
    components: [
      { id: 'lead-scraper', name: 'Lead Scraper', type: 'Scraper Agent', icon: SearchCheck, health: 'healthy', lastRun: '—', metric: '0', metricLabel: 'leads imported', href: '/dashboard/outbound', tags: ['apify', 'crunchbase'] },
      { id: 'research-agent', name: 'Research Agent', type: 'AI Agent', icon: BrainCircuit, health: 'healthy', lastRun: '—', metric: '0', metricLabel: 'profiles researched', href: '/dashboard/outbound', tags: ['gpt-4o'] },
      { id: 'qualification-engine', name: 'Qualification Engine', type: 'Logic', icon: Filter, health: 'healthy', lastRun: '—', metric: '0', metricLabel: 'leads qualified', href: '/dashboard/outbound', tags: ['rules'] },
      { id: 'personalisation-agent', name: 'Personalisation Agent', type: 'AI Agent', icon: PenTool, health: 'healthy', lastRun: '—', metric: '0', metricLabel: 'copies written', href: '/dashboard/outbound', tags: ['claude-3-5'] },
      { id: 'outbound-sender', name: 'Outbound Sender', type: 'Delivery', icon: Send, health: 'healthy', lastRun: '—', metric: '0', metricLabel: 'emails sent', href: '/dashboard/outbound', tags: ['gmail', 'instantly'] },
    ],
  },
  {
    id: 'outbound-connector',
    name: 'Outbound Connector',
    tagline: 'High-volume cold sequencing, reply routing, and domain health management at scale.',
    icon: Activity,
    status: 'building',
    railColor: 'bg-violet-500',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    badgeColor: 'text-violet-700 bg-violet-50 border-violet-200',
    kpis: [
      { label: 'Build Progress', value: '34%' },
      { label: 'ETA', value: 'Q2 2026' },
    ],
    components: [
      { id: 'sequencer', name: 'Cold Sequencer', type: 'Engine', icon: Send, health: 'soon', lastRun: '—', metric: '—', metricLabel: 'sequences', tags: [], progress: 60 },
      { id: 'reply-router', name: 'Reply Router', type: 'Automation', icon: RefreshCw, health: 'soon', lastRun: '—', metric: '—', metricLabel: 'replies routed', tags: [], progress: 30 },
      { id: 'domain-health', name: 'Domain Monitor', type: 'Monitor', icon: AlertCircle, health: 'soon', lastRun: '—', metric: '—', metricLabel: 'domains tracked', tags: [], progress: 10 },
    ],
  },
  {
    id: 'distribution',
    name: 'Distribution System',
    tagline: 'AI-powered creative production pipeline that auto-distributes content across every channel.',
    icon: Megaphone,
    status: 'planned',
    railColor: 'bg-orange-400',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    badgeColor: 'text-orange-700 bg-orange-50 border-orange-200',
    kpis: [
      { label: 'On Roadmap', value: 'Q3 2026' },
    ],
    components: [
      { id: 'production', name: 'Production Engine', type: 'Creative AI', icon: Video, health: 'soon', lastRun: '—', metric: '—', metricLabel: 'assets/week', tags: [], progress: 0 },
      { id: 'publisher', name: 'Channel Publisher', type: 'Distribution', icon: Layers, health: 'soon', lastRun: '—', metric: '—', metricLabel: 'channels', tags: [], progress: 0 },
      { id: 'ad-manager', name: 'Ad Manager', type: 'Paid Ads', icon: TrendingUp, health: 'soon', lastRun: '—', metric: '—', metricLabel: 'campaigns', tags: [], progress: 0 },
      { id: 'asset-lib', name: 'Asset Library', type: 'Storage', icon: Package, health: 'soon', lastRun: '—', metric: '—', metricLabel: 'assets', tags: [], progress: 0 },
    ],
  },
];

// ─── Config Maps ───────────────────────────────────────────────────────────────

const HEALTH_CFG: Record<Health, { label: string; dot: string; text: string; ring: string }> = {
  healthy: { label: 'Healthy',     dot: 'bg-emerald-400', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  warning: { label: 'Warning',     dot: 'bg-yellow-400',  text: 'text-yellow-600',  ring: 'ring-yellow-100' },
  error:   { label: 'Error',       dot: 'bg-red-400',     text: 'text-red-600',     ring: 'ring-red-100' },
  paused:  { label: 'Paused',      dot: 'bg-gray-300',    text: 'text-gray-500',    ring: 'ring-gray-100' },
  soon:    { label: 'Coming Soon', dot: 'bg-gray-200',    text: 'text-gray-400',    ring: 'ring-gray-50' },
};

const STATUS_CFG: Record<SysStatus, { label: string; color: string }> = {
  active:   { label: '● Active',      color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  building: { label: '◐ Building',    color: 'text-violet-700 bg-violet-50 border-violet-200' },
  planned:  { label: '○ Planned',     color: 'text-gray-500 bg-gray-50 border-gray-200' },
};

// ─── Context Menu ─────────────────────────────────────────────────────────────

function ContextMenu({ items, onClose }: { items: string[]; onClose: () => void }) {
  return (
    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 py-1.5 w-44 animate-in fade-in slide-in-from-top-1 duration-100">
      {items.map(item => (
        <button key={item} onClick={onClose}
          className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl">
          {item}
        </button>
      ))}
    </div>
  );
}

// ─── Component Row ─────────────────────────────────────────────────────────────

function CompRow({ comp }: { comp: Comp }) {
  const [menu, setMenu] = useState(false);
  const hcfg = HEALTH_CFG[comp.health];
  const Icon = comp.icon;
  const isSoon = comp.health === 'soon';
  const isPaused = comp.health === 'paused';

  return (
    <div className={`group relative grid items-center border-b border-gray-100 last:border-0 transition-all
      ${isSoon ? 'opacity-55' : 'hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-transparent'}`}
      style={{ gridTemplateColumns: '2fr 1.2fr 0.9fr 0.9fr 1fr 0.9fr 100px' }}>

      {/* Name */}
      <div className="flex items-center gap-3 py-3.5 pl-12 pr-4 min-w-0">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border
          ${isSoon ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 shadow-sm group-hover:border-gray-300'} transition-all`}>
          <Icon size={14} className={isSoon ? 'text-gray-300' : 'text-gray-600'} />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${isSoon ? 'text-gray-400' : 'text-gray-900'}`}>{comp.name}</p>
          <p className="text-[10px] text-gray-400 font-medium">{comp.type}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="py-3.5 pr-4 flex items-center gap-1 flex-wrap">
        {comp.tags.slice(0, 2).map(t => (
          <span key={t} className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">{t}</span>
        ))}
        {comp.progress !== undefined && !isSoon && (
          <div className="flex items-center gap-2 w-full mt-1">
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-400 rounded-full transition-all" style={{ width: `${comp.progress}%` }} />
            </div>
            <span className="text-[10px] text-gray-400 font-mono">{comp.progress}%</span>
          </div>
        )}
      </div>

      {/* Health */}
      <div className="py-3.5 pr-4">
        <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${hcfg.text}`}>
          <div className={`w-2 h-2 rounded-full ${hcfg.dot} ${comp.health === 'healthy' ? 'animate-pulse' : ''} ring-2 ${hcfg.ring}`} />
          {hcfg.label}
        </div>
      </div>

      {/* Last Run */}
      <div className="py-3.5 pr-4">
        <span className={`text-xs ${comp.lastRun === 'Live' ? 'text-emerald-600 font-semibold' : 'text-gray-500'}`}>
          {comp.lastRun === 'Live' && <span className="mr-1 inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />}
          {comp.lastRun}
        </span>
      </div>

      {/* Metric */}
      <div className="py-3.5 pr-4">
        <p className={`text-sm font-bold ${isSoon ? 'text-gray-300' : 'text-gray-900'}`}>{comp.metric}</p>
        <p className="text-[10px] text-gray-400">{comp.metricLabel}</p>
      </div>

      {/* Status pill */}
      <div className="py-3.5 pr-4">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border
          ${comp.health === 'healthy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : comp.health === 'paused' ? 'bg-gray-50 text-gray-500 border-gray-200'
          : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
          {comp.health === 'healthy' ? '● Running' : comp.health === 'paused' ? '○ Paused' : '◌ Soon'}
        </span>
      </div>

      {/* Actions */}
      <div className="py-3.5 pr-3 flex items-center justify-end gap-1">
        {comp.href && !isSoon ? (
          <Link href={comp.href}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-all">
            Open <ArrowUpRight size={10} />
          </Link>
        ) : (
          <div className="w-16" />
        )}
        <div className="relative">
          <button onClick={e => { e.stopPropagation(); setMenu(!menu); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-700 transition-all">
            <MoreHorizontal size={14} />
          </button>
          {menu && <ContextMenu items={['Configure', 'View Logs', 'Restart', isPaused ? 'Enable' : 'Pause', 'Remove']} onClose={() => setMenu(false)} />}
        </div>
      </div>
    </div>
  );
}

// ─── System Section ────────────────────────────────────────────────────────────

function SystemSection({ sys }: { sys: System }) {
  const [open, setOpen] = useState(sys.status === 'active');
  const [menu, setMenu] = useState(false);
  const Icon = sys.icon;
  const badge = STATUS_CFG[sys.status];
  const healthy = sys.components.filter(c => c.health === 'healthy').length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group/card">

      {/* Colored left rail */}
      <div className={`absolute left-0 top-0 w-1 h-full ${sys.railColor} group/card rounded-l-2xl`} />

      {/* ── HEADER ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpen(v => !v)}
        className="relative flex items-center gap-4 px-6 py-4 cursor-pointer select-none hover:bg-gray-50/70 transition-colors">

        {/* Chevron */}
        <div className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>
          <ChevronRight size={16} />
        </div>

        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sys.iconBg} border border-gray-200 shadow-sm`}>
          <Icon size={18} className={sys.iconColor} />
        </div>

        {/* Name + tagline + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-0.5">
            <h2 className="text-base font-bold text-gray-900">{sys.name}</h2>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>{badge.label}</span>
          </div>
          <p className="text-xs text-gray-400 truncate">{sys.tagline}</p>
        </div>

        {/* KPIs */}
        <div className="flex items-center gap-6 mr-4 shrink-0">
          {sys.kpis.map(kpi => (
            <div key={kpi.label} className="text-right">
              <p className="text-sm font-bold text-gray-900 leading-tight flex items-center justify-end gap-1">
                {kpi.value}
                {kpi.trend && (
                  <span className="text-[10px] font-semibold text-emerald-500">{kpi.trend}</span>
                )}
              </p>
              <p className="text-[10px] text-gray-400 whitespace-nowrap">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Health dots */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex -space-x-0.5">
            {sys.components.slice(0, 6).map((c, i) => (
              <div key={i} title={c.name}
                className={`w-3 h-3 rounded-full border-2 border-white ${HEALTH_CFG[c.health].dot} shadow-sm`} />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-500 tabular-nums">{healthy}<span className="text-gray-300">/{sys.components.length}</span></span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          {sys.status === 'active' && (
            <Link href={`/dashboard/systems/${sys.id}`}
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors ${sys.iconBg} ${sys.iconColor} border border-gray-200 hover:border-gray-300`}>
              Launch <ArrowUpRight size={12} />
            </Link>
          )}
          <div className="relative">
            <button onClick={() => setMenu(!menu)}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors">
              <MoreHorizontal size={15} />
            </button>
            {menu && <ContextMenu items={['Settings', 'Duplicate', 'Archive', 'Delete']} onClose={() => setMenu(false)} />}
          </div>
        </div>
      </div>

      {/* ── EXPANDED COMPONENT TABLE ── */}
      {open && (
        <div className="border-t border-gray-100">

          {/* Table head */}
          <div className="grid bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest"
            style={{ gridTemplateColumns: '2fr 1.2fr 0.9fr 0.9fr 1fr 0.9fr 100px' }}>
            <div className="py-2.5 pl-12 pr-4">Component</div>
            <div className="py-2.5 pr-4">Stack / Progress</div>
            <div className="py-2.5 pr-4">Health</div>
            <div className="py-2.5 pr-4">Last Run</div>
            <div className="py-2.5 pr-4">Output</div>
            <div className="py-2.5 pr-4">Status</div>
            <div className="py-2.5 pr-3 text-right">Actions</div>
          </div>

          {/* Rows */}
          {sys.components.map(comp => (
            <CompRow key={comp.id} comp={comp} />
          ))}

          {/* Add row */}
          {sys.status === 'active' && (
            <button className="w-full flex items-center gap-2.5 pl-12 pr-6 py-3 text-xs font-semibold text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all border-t border-dashed border-gray-200 group/add">
              <Plus size={13} className="group-hover/add:text-blue-500 transition-colors" />
              Add Component
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SystemsHubPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | SysStatus>('all');

  const filtered = SYSTEMS.filter(s => {
    const q = search.toLowerCase();
    const matchQ = s.name.toLowerCase().includes(q) || s.tagline.toLowerCase().includes(q);
    const matchF = filter === 'all' || s.status === filter;
    return matchQ && matchF;
  });

  const totalHealthy = SYSTEMS.flatMap(s => s.components).filter(c => c.health === 'healthy').length;
  const totalComps = SYSTEMS.flatMap(s => s.components).length;

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa] font-sans">
      <div className="px-8 py-8 space-y-6 pb-24">

        {/* Title */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Systems Hub</h1>
            <p className="text-sm text-gray-400 mt-0.5">AI engines powering your revenue operations — configure, monitor, and launch.</p>
          </div>
          <button className="flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
            <Plus size={15} /> New System
          </button>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Systems Deployed',  val: `${SYSTEMS.filter(s => s.status === 'active').length} of ${SYSTEMS.length}`, icon: Cpu,          bg: 'bg-blue-50',   ic: 'text-blue-600' },
            { label: 'Components Running', val: `${totalHealthy} / ${totalComps}`,                                          icon: CheckCircle2,  bg: 'bg-emerald-50', ic: 'text-emerald-600' },
            { label: 'Pipeline This Month', val: '$142.5k',                                                                 icon: TrendingUp,    bg: 'bg-indigo-50',  ic: 'text-indigo-600' },
            { label: 'In Development',      val: `${SYSTEMS.filter(s => s.status === 'building').length} system`,          icon: RefreshCw,     bg: 'bg-violet-50',  ic: 'text-violet-600' },
          ].map(t => (
            <div key={t.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${t.bg}`}>
                <t.icon size={19} className={t.ic} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{t.val}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{t.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Command bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search systems, components, or tags…"
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 shadow-sm" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={13} className="text-gray-400 hover:text-gray-700" />
              </button>
            )}
          </div>
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm gap-0.5">
            {([['all', 'All'], ['active', 'Active'], ['building', 'Building'], ['planned', 'Planned']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                  ${filter === v ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Systems list */}
        <div className="space-y-3 relative">
          {filtered.map(sys => (
            <div key={sys.id} className="relative">
              {/* Left color rail */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${sys.railColor} z-10`} />
              <SystemSection sys={sys} />
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No systems match &quot;{search}&quot;</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 pt-2 border-t border-gray-100">
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Health:</span>
          {Object.entries(HEALTH_CFG).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${v.dot}`} />
              <span className="text-[11px] text-gray-500 font-medium">{v.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
