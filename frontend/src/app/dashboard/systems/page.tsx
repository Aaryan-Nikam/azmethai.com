'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart2,
  Bot,
  Cpu,
  Filter,
  GitBranch,
  Inbox,
  Layers,
  Link2,
  Mail,
  Megaphone,
  Package,
  Pen,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Shield,
  TrendingUp,
  Users,
  Video,
  Wrench,
  Zap,
} from 'lucide-react';

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
  progress?: number;
}

interface System {
  id: string;
  name: string;
  tagline: string;
  icon: React.ElementType;
  status: SysStatus;
  components: Comp[];
  kpis: { label: string; value: string; trend?: string }[];
}

const SYSTEMS: System[] = [
  {
    id: 'ai-setter',
    name: 'AI Setter',
    tagline: 'Multichannel outbound engine from first touch to booked meeting.',
    icon: Zap,
    status: 'active',
    kpis: [
      { label: 'Pipeline', value: '$142.5k', trend: '+14%' },
      { label: 'Meetings', value: '36', trend: '+8' },
      { label: 'Reply Rate', value: '34%', trend: '+2.1%' },
      { label: 'Cost / Lead', value: '$0.003', trend: '-12%' },
    ],
    components: [
      { id: 'sdr-alpha', name: 'SDR Alpha', type: 'Lead Agent', icon: Bot, health: 'healthy', lastRun: '2m ago', metric: '1,840', metricLabel: 'messages sent', href: '/dashboard/agent', tags: ['gpt-4o', 'multichannel'] },
      { id: 'email-setter', name: 'Email Setter', type: 'Sub-Agent', icon: Mail, health: 'healthy', lastRun: '12m ago', metric: '920', metricLabel: 'emails sent', tags: ['claude', 'email'] },
      { id: 'linkedin-bot', name: 'LinkedIn Connector', type: 'Connector', icon: Link2, health: 'paused', lastRun: '2d ago', metric: '340', metricLabel: 'messages sent', tags: ['linkedin', 'paused'] },
      { id: 'inbox', name: 'Live Inbox', type: 'Inbox', icon: Inbox, health: 'healthy', lastRun: 'Live', metric: '4', metricLabel: 'active threads', href: '/dashboard/inbox', tags: ['realtime'] },
      { id: 'crm', name: 'Unified Lead Pool', type: 'Pipeline', icon: Users, health: 'healthy', lastRun: 'Live', metric: '1,000', metricLabel: 'leads tracked', href: '/dashboard/leads', tags: ['shared', 'realtime'] },
      { id: 'workflows', name: 'Outreach Workflows', type: 'Automation', icon: GitBranch, health: 'healthy', lastRun: '1h ago', metric: '5', metricLabel: 'active flows', tags: ['n8n', 'automation'] },
      { id: 'analytics', name: 'Analytics', type: 'Dashboard', icon: BarChart2, health: 'healthy', lastRun: 'Live', metric: '34%', metricLabel: 'conversion rate', href: '/dashboard/analytics', tags: ['realtime'] },
      { id: 'compliance', name: 'Compliance Engine', type: 'Guardrail', icon: Shield, health: 'healthy', lastRun: 'Auto', metric: '100%', metricLabel: 'TCPA enforced', tags: ['safety'] },
    ],
  },
  {
    id: 'outbound-engine',
    name: 'Outbound Engine',
    tagline: 'Intent-driven outbound stack for scraping, research, personalization, and delivery.',
    icon: Rocket,
    status: 'active',
    kpis: [
      { label: 'Leads Scraped', value: '0' },
      { label: 'Qualified', value: '0' },
      { label: 'Emails Sent', value: '0' },
      { label: 'Reply Rate', value: '—' },
    ],
    components: [
      { id: 'lead-scraper', name: 'Lead Scraper', type: 'Scraper Agent', icon: Search, health: 'healthy', lastRun: '—', metric: '0', metricLabel: 'leads imported', href: '/dashboard/outbound', tags: ['apify', 'crunchbase'] },
      { id: 'research-agent', name: 'Research Agent', type: 'AI Agent', icon: Cpu, health: 'healthy', lastRun: '—', metric: '0', metricLabel: 'profiles researched', href: '/dashboard/outbound', tags: ['research'] },
      { id: 'qualification-engine', name: 'Qualification Engine', type: 'Logic', icon: Filter, health: 'healthy', lastRun: '—', metric: '0', metricLabel: 'leads qualified', href: '/dashboard/leads?source=outbound', tags: ['rules'] },
      { id: 'personalisation-agent', name: 'Personalisation Agent', type: 'AI Agent', icon: Pen, health: 'healthy', lastRun: '—', metric: '0', metricLabel: 'copies written', href: '/dashboard/outbound', tags: ['claude'] },
      { id: 'outbound-sender', name: 'Outbound Sender', type: 'Delivery', icon: Send, health: 'healthy', lastRun: '—', metric: '0', metricLabel: 'emails sent', href: '/dashboard/outbound', tags: ['gmail', 'instantly'] },
      { id: 'shared-pool', name: 'Shared Lead Pool', type: 'Pipeline', icon: Users, health: 'healthy', lastRun: 'Live', metric: '1 pool', metricLabel: 'unified source', href: '/dashboard/leads?source=outbound', tags: ['merged'] },
    ],
  },
  {
    id: 'outbound-connector',
    name: 'Outbound Connector',
    tagline: 'High-volume sequencing and domain health control for future outbound scale.',
    icon: Activity,
    status: 'building',
    kpis: [
      { label: 'Build Progress', value: '34%' },
      { label: 'ETA', value: 'Q2 2026' },
      { label: 'Connectors', value: '4' },
      { label: 'Open Risks', value: '2' },
    ],
    components: [
      { id: 'sequencer', name: 'Cold Sequencer', type: 'Engine', icon: Send, health: 'soon', lastRun: '—', metric: '—', metricLabel: 'sequences', tags: ['send'], progress: 60 },
      { id: 'reply-router', name: 'Reply Router', type: 'Automation', icon: RefreshCw, health: 'soon', lastRun: '—', metric: '—', metricLabel: 'replies routed', tags: ['routing'], progress: 30 },
      { id: 'domain-health', name: 'Domain Monitor', type: 'Monitor', icon: AlertCircle, health: 'warning', lastRun: '—', metric: '—', metricLabel: 'domains tracked', tags: ['health'], progress: 10 },
    ],
  },
  {
    id: 'distribution',
    name: 'Distribution System',
    tagline: 'Creative generation and multi-channel publishing pipeline for future growth loops.',
    icon: Megaphone,
    status: 'planned',
    kpis: [
      { label: 'Roadmap', value: 'Q3 2026' },
      { label: 'Channels', value: '6' },
      { label: 'Assets / week', value: '—' },
      { label: 'State', value: 'Planned' },
    ],
    components: [
      { id: 'production', name: 'Production Engine', type: 'Creative AI', icon: Video, health: 'soon', lastRun: '—', metric: '—', metricLabel: 'assets / week', tags: ['creative'], progress: 0 },
      { id: 'publisher', name: 'Channel Publisher', type: 'Distribution', icon: Layers, health: 'soon', lastRun: '—', metric: '—', metricLabel: 'channels', tags: ['publishing'], progress: 0 },
      { id: 'ad-manager', name: 'Ad Manager', type: 'Paid Ads', icon: TrendingUp, health: 'soon', lastRun: '—', metric: '—', metricLabel: 'campaigns', tags: ['ads'], progress: 0 },
      { id: 'asset-lib', name: 'Asset Library', type: 'Storage', icon: Package, health: 'soon', lastRun: '—', metric: '—', metricLabel: 'assets', tags: ['library'], progress: 0 },
    ],
  },
];

const HEALTH_META: Record<Health, { label: string; dot: string; badge: string }> = {
  healthy: { label: 'Healthy', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  warning: { label: 'Warning', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  error: { label: 'Error', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
  paused: { label: 'Paused', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  soon: { label: 'Coming Soon', dot: 'bg-slate-300', badge: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const STATUS_META: Record<SysStatus, { label: string; badge: string }> = {
  active: { label: 'Live', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  building: { label: 'Building', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  planned: { label: 'Planned', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const DETAIL_ROUTES = new Set(['ai-setter', 'outbound-engine']);

function StatusPill({ status }: { status: SysStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${meta.badge}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}

function ComponentRow({ comp }: { comp: Comp }) {
  const Icon = comp.icon;
  const health = HEALTH_META[comp.health];

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-[#f8f8f9] px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600">
          <Icon size={14} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{comp.name}</p>
          <p className="truncate text-[11px] text-gray-500">
            {comp.type} · {comp.metric} {comp.metricLabel}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${health.badge}`}>
          <span className={`h-2 w-2 rounded-full ${health.dot}`} />
          {health.label}
        </span>
        {comp.href ? (
          <Link
            href={comp.href}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50"
            title="Open"
          >
            <ArrowUpRight size={14} />
          </Link>
        ) : (
          <span className="text-[10px] font-semibold text-gray-400">Soon</span>
        )}
      </div>
    </div>
  );
}

function SystemCard({ sys }: { sys: System }) {
  const Icon = sys.icon;
  const detailHref = DETAIL_ROUTES.has(sys.id) ? `/dashboard/systems/${sys.id}` : undefined;
  const topComponents = sys.components.slice(0, 4);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-[#f8f8f9] text-gray-700">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-gray-900">{sys.name}</h2>
              <StatusPill status={sys.status} />
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{sys.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {detailHref ? (
            <Link
              href={detailHref}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Open
              <ArrowUpRight size={14} className="text-gray-400" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => toast.message('System detail view is not wired yet for this system.')}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Open
              <ArrowUpRight size={14} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {sys.kpis.slice(0, 4).map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-gray-200 bg-[#f8f8f9] px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">{kpi.label}</p>
              {kpi.trend ? <span className="text-[10px] font-semibold text-emerald-600">{kpi.trend}</span> : null}
            </div>
            <p className="mt-1 text-sm font-semibold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {topComponents.map((comp) => (
          <ComponentRow key={comp.id} comp={comp} />
        ))}
      </div>

      {sys.components.length > topComponents.length ? (
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-xs text-gray-500">
            +{sys.components.length - topComponents.length} more components
          </span>
          <button
            type="button"
            className="text-xs font-semibold text-gray-700 hover:text-gray-900"
            onClick={() => toast.message('Component expansion view coming next.')}
          >
            View all
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function SystemsHubPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | SysStatus>('all');

  const counts = useMemo(() => {
    const total = SYSTEMS.length;
    const live = SYSTEMS.filter((s) => s.status === 'active').length;
    const building = SYSTEMS.filter((s) => s.status === 'building').length;
    const planned = SYSTEMS.filter((s) => s.status === 'planned').length;
    return { total, live, building, planned };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SYSTEMS.filter((sys) => {
      const matchFilter = filter === 'all' || sys.status === filter;
      if (!q) return matchFilter;
      const inSystem =
        sys.name.toLowerCase().includes(q) ||
        sys.tagline.toLowerCase().includes(q) ||
        sys.components.some((comp) => comp.name.toLowerCase().includes(q) || comp.tags.some((t) => t.toLowerCase().includes(q)));
      return matchFilter && inSystem;
    });
  }, [search, filter]);

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa] font-sans">
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-5 pb-12">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Control Layer</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Systems Hub</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              A clean operating map for every engine, connector, and agent lane inside Azmeth.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.message('New system flow is coming next.')}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
            >
              <Plus size={16} />
              New System
            </button>
            <button
              type="button"
              onClick={() => toast.message('Refresh hook will be wired to live runtimes.')}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search systems, components, or tags"
              className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 shadow-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'active', 'building', 'planned'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                  filter === value
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {value === 'all' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Total systems', value: counts.total },
            { label: 'Live', value: counts.live },
            { label: 'Building', value: counts.building },
            { label: 'Planned', value: counts.planned },
          ].map((tile) => (
            <div key={tile.label} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">{tile.label}</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{tile.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((system) => (
            <SystemCard key={system.id} sys={system} />
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center text-sm text-gray-500">
            No systems match your current search.
          </div>
        ) : null}
      </div>
    </div>
  );
}

