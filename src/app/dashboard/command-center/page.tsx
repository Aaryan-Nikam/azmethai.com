'use client';

import React, { useState, useEffect, useRef } from 'react';
import { mockEmployees, mockSystems } from '@/lib/mock-data';
import {
  TrendingUp, Users, BarChart2, Activity,
  Zap, ArrowUpRight, ChevronDown, RefreshCw, Check, AlertTriangle,
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, { color: string; pulse: boolean }> = {
  Executing: { color: '#ef4444', pulse: true },
  Online:    { color: '#22c55e', pulse: true },
  Building:  { color: '#3b82f6', pulse: false },
  Paused:    { color: '#d1d5db', pulse: false },
};

const ROLE_COLOR: Record<string, string> = {
  Sales: '#3b82f6',
  Ops: '#8b5cf6',
  Distribution: '#10b981',
  Support: '#f59e0b',
};

// ─── Circular Progress ────────────────────────────────────────────────────────
function CircleProgress({ value, color, size = 52 }: { value: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const [fill, setFill] = useState(0);
  useEffect(() => { const t = setTimeout(() => setFill(value), 400); return () => clearTimeout(t); }, [value]);
  const offset = circ - (fill / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
        {fill}%
      </span>
    </div>
  );
}

// ─── Animated System Message ──────────────────────────────────────────────────
const SYS_MESSAGES: Record<string, string[]> = {
  'Sales Engine': [
    'Running 3 sequences at peak capacity',
    'Acme Corp deal moving to close stage',
    'SDR qualifying 14 new leads',
  ],
  'Distribution System': [
    'Warming up LinkedIn outreach pipeline',
    '47 posts queued for the week',
    'A/B testing creative variants',
  ],
};

function AnimatedMessage({ messages }: { messages: string[] }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'clearing'>('typing');

  useEffect(() => {
    const target = messages[msgIndex];
    if (phase === 'typing') {
      if (charIndex < target.length) {
        const t = setTimeout(() => { setDisplayed(target.slice(0, charIndex + 1)); setCharIndex(c => c + 1); }, 30);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase('clearing'), 3500);
        return () => clearTimeout(t);
      }
    }
    if (phase === 'clearing') {
      if (displayed.length > 0) {
        const t = setTimeout(() => { setDisplayed(d => d.slice(0, -2)); }, 14);
        return () => clearTimeout(t);
      } else {
        setMsgIndex(i => (i + 1) % messages.length);
        setCharIndex(0);
        setPhase('typing');
      }
    }
  }, [phase, charIndex, displayed, messages, msgIndex]);

  return (
    <p className="text-[11px] text-gray-400 font-mono min-h-[15px] mt-0.5 truncate">
      {displayed}<span className="animate-pulse text-gray-300">|</span>
    </p>
  );
}

// ─── Multi-line Gradient Chart ────────────────────────────────────────────────
const RAW = {
  revenue: [14, 19, 16, 26, 22, 29, 24.7],
  tasks:   [480, 590, 550, 700, 660, 790, 847],
  output:  [38, 52, 44, 68, 63, 79, 89],
};

function normalize(arr: number[]) {
  const min = Math.min(...arr), max = Math.max(...arr);
  return arr.map(v => (v - min) / (max - min));
}

const SERIES = [
  { key: 'revenue', label: 'Revenue', value: '$24.7k', color: '#10b981', data: normalize(RAW.revenue) },
  { key: 'tasks',   label: 'Tasks',   value: '847',    color: '#3b82f6', data: normalize(RAW.tasks) },
  { key: 'output',  label: 'Output',  value: '89k',    color: '#06b6d4', data: normalize(RAW.output) },
];

function MetricsGraph() {
  const W = 400, H = 130;
  const PAD = 10;

  function pts(data: number[]) {
    return data.map((v, i) => ({
      x: (i / (data.length - 1)) * W,
      y: H - v * (H - PAD * 2) - PAD,
    }));
  }

  function makePath(data: number[]) {
    const p = pts(data);
    return p.map((pt, i) => i === 0
      ? `M${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
      : `C${(p[i-1].x + 22).toFixed(1)},${p[i-1].y.toFixed(1)} ${(pt.x - 22).toFixed(1)},${pt.y.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
    ).join(' ');
  }

  function makeArea(data: number[]) {
    return `${makePath(data)} L${W},${H} L0,${H} Z`;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <div className="flex gap-5 flex-wrap">
        {SERIES.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">{s.label}</span>
            <span className="text-sm font-bold text-gray-800 ml-0.5">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="relative rounded-xl bg-gray-50 border border-gray-100 p-3 pb-6" style={{ height: 170 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            {SERIES.map(s => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.01" />
              </linearGradient>
            ))}
          </defs>
          {SERIES.map(s => <path key={`a-${s.key}`} d={makeArea(s.data)} fill={`url(#grad-${s.key})`} />)}
          {SERIES.map(s => <path key={`l-${s.key}`} d={makePath(s.data)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" opacity="0.9" />)}
          {SERIES.map(s => {
            const p = pts(s.data);
            const last = p[p.length - 1];
            return <circle key={`d-${s.key}`} cx={last.x} cy={last.y} r={4} fill={s.color} />;
          })}
        </svg>
        <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[9px] text-gray-400 font-mono">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Now'].map(d => <span key={d}>{d}</span>)}
        </div>
      </div>
    </div>
  );
}

// ─── Employees ────────────────────────────────────────────────────────────────
function EmployeesLive({ filter, sort }: { filter: string; sort: string }) {
  let employees = [...mockEmployees];
  if (filter !== 'All') {
    const roleMap: Record<string, string> = { Sales: 'Sales', Ops: 'Ops', Distro: 'Distribution' };
    if (filter === 'Paused') employees = employees.filter(e => e.status === 'Paused');
    else employees = employees.filter(e => e.role === (roleMap[filter] || filter));
  }
  const order = ['Executing','Online','Building','Paused'];
  if (sort === 'Tasks') employees.sort((a,b) => b.tasksLast7d - a.tasksLast7d);
  else if (sort === 'Name') employees.sort((a,b) => a.name.localeCompare(b.name));
  else employees.sort((a,b) => order.indexOf(a.status) - order.indexOf(b.status));

  return (
    <div className="divide-y divide-gray-50">
      {employees.map(emp => {
        const dot = STATUS_DOT[emp.status];
        const rc = ROLE_COLOR[emp.role];
        return (
          <div key={emp.id} className="flex items-center gap-3 py-2.5 hover:bg-gray-50/70 px-1 rounded-xl transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: rc }}>
              {emp.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{emp.name}</p>
              <p className="text-[10px] text-gray-400">{emp.role} · {emp.tasksLast7d} tasks</p>
            </div>
            <div className="relative shrink-0 w-2 h-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dot.color }} />
              {dot.pulse && <div className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ backgroundColor: dot.color }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Integration Icon ─────────────────────────────────────────────────────────
function IntegrationIcon({ type }: { type: string }) {
  const cls = "w-6 h-6 rounded-lg flex items-center justify-center shrink-0";
  switch (type) {
    case 'slack': return <div className={`${cls} bg-[#4A154B]`}><svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/></svg></div>;
    case 'gmail': return <div className={`${cls} bg-white border border-gray-200`}><svg width="12" height="12" viewBox="0 0 24 24"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/></svg></div>;
    case 'hubspot': return <div className={`${cls} bg-[#FF7A59]`}><svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M18.164 7.93V5.084a2.198 2.198 0 0 0 1.266-1.978V3.06A2.198 2.198 0 0 0 17.233.863h-.046A2.198 2.198 0 0 0 14.99 3.06v.046a2.198 2.198 0 0 0 1.266 1.978V7.93a6.232 6.232 0 0 0-2.963 1.302L5.19 4.07a2.448 2.448 0 1 0-1.184 1.503l7.875 5.032a6.232 6.232 0 0 0 .022 7.207L9.38 20.42a2.024 2.024 0 1 0 1.266 1.266l2.525-2.608a6.245 6.245 0 1 0 4.993-11.148z"/></svg></div>;
    case 'calendar': return <div className={`${cls} bg-blue-50 border border-blue-200`}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>;
    default: return <div className={`${cls} bg-gray-100 border border-gray-200`}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83"/></svg></div>;
  }
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
const LOGS = [
  { agent: 'Sales Closer', action: 'Demo booked — Acme Corp', tool: 'calendar', time: '2m', ok: true },
  { agent: 'Content Arch', action: '12 ads shipped to queue', tool: 'internal', time: '5m', ok: true },
  { agent: 'Ops', action: 'HubSpot sync complete', tool: 'hubspot', time: '12m', ok: true },
  { agent: 'Sales Eng', action: 'Capacity scaled +50%', tool: 'internal', time: '18m', ok: true },
  { agent: 'SDR', action: 'Paused · low lead volume', tool: 'internal', time: '28m', ok: false },
  { agent: 'Content Arch', action: 'Campaign brief ready', tool: 'internal', time: '45m', ok: true },
  { agent: 'Ops', action: 'Slack digest dispatched', tool: 'slack', time: '1h', ok: true },
  { agent: 'Sales Closer', action: 'Gmail sequence live', tool: 'gmail', time: '2h', ok: true },
];

function LogsPanel() {
  return (
    <div className="divide-y divide-gray-50">
      {LOGS.map((log, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 hover:bg-gray-50/70 px-1 rounded-xl transition-colors">
          <IntegrationIcon type={log.tool} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">{log.action}</p>
            <p className="text-[10px] text-gray-400">{log.agent} · {log.time} ago</p>
          </div>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${log.ok ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
            {log.ok ? <Check size={11} strokeWidth={3} /> : <AlertTriangle size={11} />}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Systems ──────────────────────────────────────────────────────────────────
const SYS_META = [
  { id: 'sys-1', progress: 92, color: '#3b82f6', messages: SYS_MESSAGES['Sales Engine'] },
  { id: 'sys-2', progress: 71, color: '#10b981', messages: SYS_MESSAGES['Distribution System'] },
];

function SystemsPerformance() {
  return (
    <div className="flex flex-col gap-5">
      {mockSystems.map((s, i) => {
        const meta = SYS_META[i];
        return (
          <div key={s.id} className="flex items-center gap-4 p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
            <CircleProgress value={meta.progress} color={meta.color} size={52} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{s.type}</p>
              <AnimatedMessage messages={meta.messages} />
            </div>
          </div>
        );
      })}

      <div className="grid grid-cols-4 gap-2 pt-1">
        {[
          { label: 'Uptime', value: '99.8%', color: 'text-green-600' },
          { label: 'Latency', value: '2.1s', color: 'text-blue-600' },
          { label: 'ROI', value: '13.4x', color: 'text-purple-600' },
          { label: 'Budget', value: '67%', color: 'text-orange-500' },
        ].map(kpi => (
          <div key={kpi.label} className="text-center bg-gray-50 border border-gray-100 rounded-xl py-3">
            <p className="text-[9px] text-gray-400 font-mono uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-sm font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

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
function SectionCard({
  title, subtitle, icon: Icon, action, children
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  action?: { label: string; href: string };
  children: React.ReactNode;
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
          <a href={action.href} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
            {action.label} <ArrowUpRight size={12} />
          </a>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CommandCenterPage() {
  const [timeRange, setTimeRange] = useState('Today');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Live');

  const executing = mockEmployees.filter(e => e.status === 'Executing').length;
  const active    = mockEmployees.filter(e => e.status !== 'Paused').length;

  const KPI_ITEMS = [
    { label: 'Pipeline Generated', val: '$1.2M',  sub: '↑ 18% this week', icon: TrendingUp, accent: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Meetings Booked',    val: '42',      sub: '7 today',         icon: BarChart2,  accent: 'text-blue-600',  bg: 'bg-blue-50' },
    { label: 'Active Employees',   val: `${active}`, sub: `${executing} executing now`, icon: Users, accent: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Agent Tasks (7d)',   val: '2,493',  sub: '↑ 14% vs last week', icon: Zap, accent: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa] font-sans">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 pb-16">

        {/* ── Controls row (no duplicate title) ── */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-medium">
            All systems operational ·
            <span className="ml-1.5 text-emerald-600 font-semibold">● Live</span>
          </p>
          <div className="flex items-center gap-2">
            <Dropdown label="Time"   options={['Today','7d','30d','Custom']}    value={timeRange} onChange={setTimeRange} />
            <Dropdown label="Filter" options={['All','Sales','Ops','Distro','Paused']} value={filter}    onChange={setFilter} />
            <Dropdown label="Sort"   options={['Live','Tasks','Name']}           value={sort}      onChange={setSort} />
            <button className="flex items-center gap-1.5 h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
              <RefreshCw size={13} className="text-gray-400" /> Refresh
            </button>
          </div>
        </div>

        {/* ── KPI Tiles ── */}
        <div className="grid grid-cols-4 gap-5">
          {KPI_ITEMS.map(kpi => (
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

        {/* ── Activity + Systems ── */}
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2">
            <SectionCard title="Platform Activity" subtitle="Revenue, tasks & output — last 7 days" icon={Activity}>
              <MetricsGraph />
            </SectionCard>
          </div>
          <div>
            <SectionCard title="Systems" subtitle="Live operational health" icon={Zap}>
              <SystemsPerformance />
            </SectionCard>
          </div>
        </div>

        {/* ── Employees + Logs ── */}
        <div className="grid grid-cols-2 gap-5">
          <SectionCard
            title="AI Employees"
            subtitle="Status across all active agents"
            icon={Users}
            action={{ label: 'View All', href: '/dashboard/employees' }}
          >
            <EmployeesLive filter={filter} sort={sort} />
          </SectionCard>

          <SectionCard
            title="Execution Log"
            subtitle="Recent actions across all systems"
            icon={Activity}
            action={{ label: 'Full Log', href: '/dashboard/monitoring' }}
          >
            <LogsPanel />
          </SectionCard>
        </div>

      </div>
    </div>
  );
}
