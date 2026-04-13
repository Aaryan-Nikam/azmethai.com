'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Plus, Search, FileText, X, ChevronRight,
  BrainCircuit, Inbox, Users, BarChart2, Zap
} from 'lucide-react';

const SETUP_KEY = 'azmeth_ai_setter_configured';

// ─── Step Definitions ───────────────────────────────────────────────────

const ONBOARDING_STEPS = [
  'Connect Channels',
  'Integrations',
  'Identity & Role',
  'Agentic Framework',
  'Knowledgebase',
  'Tools & Workflows',
];

// ─── Data ────────────────────────────────────────────────────────────────

const CHANNELS = [
  {
    id: 'instagram', label: 'Instagram', sub: 'DMs & Comments',
    logo: (
      <svg viewBox="0 0 24 24" className="w-7 h-7">
        <defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433" /><stop offset="25%" stopColor="#e6683c" />
          <stop offset="50%" stopColor="#dc2743" /><stop offset="75%" stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient></defs>
        <rect width="24" height="24" rx="6" fill="url(#ig)" />
        <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="17" cy="7" r="1" fill="white" />
      </svg>
    )
  },
  {
    id: 'whatsapp', label: 'WhatsApp', sub: 'Business API',
    logo: (
      <svg viewBox="0 0 24 24" className="w-7 h-7">
        <rect width="24" height="24" rx="6" fill="#25D366" />
        <path d="M12 4C7.6 4 4 7.6 4 12c0 1.5.4 2.9 1.1 4.1L4 20l4-1c1.1.6 2.4 1 3.9 1 4.4 0 8-3.6 8-8s-3.5-8-7.9-8zm4.1 11.4c-.2.5-1 .9-1.4 1-.4 0-.8.1-2.5-.5-2.1-.8-3.4-2.9-3.5-3-.1-.1-.9-1.2-.9-2.3 0-1.1.6-1.6.8-1.8.2-.2.5-.3.7-.3h.5c.2 0 .4.1.5.4.2.4.7 1.7.8 1.8.1.1.1.3 0 .4l-.4.5c-.1.1-.2.2-.1.4.2.3.8 1 1.4 1.5.6.6 1.2.7 1.5.8.2.1.4 0 .5-.1l.4-.5c.1-.2.3-.2.5-.1l1.6.8c.2.1.4.2.4.5z" fill="white" />
      </svg>
    )
  },
  {
    id: 'instantly', label: 'Instantly', sub: 'Cold Email Outreach',
    logo: (
      <div className="w-7 h-7 rounded-lg bg-[#5B4CF5] flex items-center justify-center">
        <Zap size={16} fill="white" className="text-white" />
      </div>
    )
  },
  {
    id: 'linkedin', label: 'LinkedIn', sub: 'Outreach Automation',
    logo: (
      <svg viewBox="0 0 24 24" className="w-7 h-7">
        <rect width="24" height="24" rx="4" fill="#0A66C2" />
        <text x="4" y="18" fontSize="14" fontWeight="bold" fill="white">in</text>
      </svg>
    )
  },
];

const INTEGRATIONS = [
  { id: 'hubspot', label: 'HubSpot', cat: 'CRM', color: '#FF7A59',
    logo: <div className="w-8 h-8 rounded-lg bg-[#FF7A59] flex items-center justify-center text-white font-black text-sm">Hs</div>
  },
  { id: 'salesforce', label: 'Salesforce', cat: 'CRM', color: '#00A1E0',
    logo: <div className="w-8 h-8 rounded-lg bg-[#00A1E0] flex items-center justify-center text-white font-black text-xs">SF</div>
  },
  { id: 'pipedrive', label: 'Pipedrive', cat: 'CRM', color: '#1A1F36',
    logo: <div className="w-8 h-8 rounded-lg bg-[#1A1F36] flex items-center justify-center"><svg viewBox="0 0 24 24" className="w-5 h-5"><circle cx="12" cy="12" r="10" fill="#28A745" /><text x="7" y="17" fontSize="10" fontWeight="bold" fill="white">P</text></svg></div>
  },
  { id: 'postgres', label: 'PostgreSQL', cat: 'Database', color: '#336791',
    logo: <div className="w-8 h-8 rounded-lg bg-[#336791] flex items-center justify-center text-white font-bold text-xs">PG</div>
  },
  { id: 'notion', label: 'Notion', cat: 'Docs', color: '#000',
    logo: <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white font-bold text-sm">N</div>
  },
  { id: 'slack', label: 'Slack', cat: 'Comms', color: '#4A154B',
    logo: <div className="w-8 h-8 rounded-lg bg-[#4A154B] flex items-center justify-center text-white font-black text-sm">#</div>
  },
];

const IDENTITY_ROLES = [
  { id: 'aggressive', label: 'The Aggressive Closer', sub: 'High pressure, deal-focused, urgency-driven', icon: '⚡' },
  { id: 'consultative', label: 'The Consultative Advisor', sub: 'Question-led, empathetic, solution-first', icon: '🎯' },
  { id: 'diagnostic', label: 'The Technical Diagnoser', sub: 'Data-driven, specific, credibility-first', icon: '🔬' },
  { id: 'objection', label: 'The Objection Handler', sub: 'Feel-Felt-Found framework, resilient', icon: '🛡️' },
  { id: 'social', label: 'The Social Proof Seller', sub: 'Case studies, testimonials, authority', icon: '📣' },
  { id: 'custom', label: 'Custom Voice', sub: 'Write your own persona in Advanced Settings', icon: '✏️' },
];

const FRAMEWORKS = [
  {
    id: 'react', label: 'ReAct Agent', sub: 'Linear chain: Reason → Act → Observe → Repeat',
    viz: (
      <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-gray-400">
        {['THINK', 'ACT', 'OBSERVE'].map((s, i) => (
          <React.Fragment key={s}>
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded-md font-semibold">{s}</div>
            {i < 2 && <ChevronRight size={12} />}
          </React.Fragment>
        ))}
        <ChevronRight size={12} />
        <span className="text-blue-400">↻</span>
      </div>
    )
  },
  {
    id: 'plan', label: 'Plan & Execute', sub: 'Decomposes the goal into sub-tasks first, then acts',
    viz: (
      <div className="mt-3 space-y-1.5 text-[10px] font-mono">
        <div className="flex items-center gap-2">
          <div className="w-16 bg-purple-100 border border-purple-200 text-purple-700 px-1.5 py-1 rounded text-center font-semibold">PLANNER</div>
          <ChevronRight size={12} className="text-gray-400" />
          <div className="flex gap-1">
            {['T1', 'T2', 'T3'].map(t => <div key={t} className="bg-purple-50 border border-purple-200 text-purple-600 px-1.5 py-1 rounded">{t}</div>)}
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'swarm', label: 'Swarm Routing', sub: 'Lead agent delegates tasks to specialized subagents',
    viz: (
      <div className="mt-3 text-[10px] font-mono">
        <div className="flex flex-col items-center gap-1">
          <div className="bg-green-100 border border-green-300 text-green-800 px-3 py-1 rounded-md font-semibold">LEAD AGENT</div>
          <div className="flex items-end gap-1 pt-1">
            <div className="h-6 w-px bg-green-300 mx-auto" />
          </div>
          <div className="flex gap-2">
            {['QUAL', 'CLOSE', 'BOOK'].map(t => <div key={t} className="bg-green-50 border border-green-200 text-green-600 px-2 py-1 rounded">{t}</div>)}
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'reflexion', label: 'Reflexion Loop', sub: 'Self-critiques and retries for higher-quality outputs',
    viz: (
      <div className="mt-3 flex items-center gap-2 text-[10px] font-mono">
        {['GENERATE', 'CRITIQUE', 'REFINE'].map((s, i) => (
          <React.Fragment key={s}>
            <div className="bg-orange-50 border border-orange-200 text-orange-700 px-2 py-1 rounded font-semibold">{s}</div>
            {i < 2 && <ChevronRight size={12} className="text-orange-400" />}
          </React.Fragment>
        ))}
        <span className="text-orange-400">↻</span>
      </div>
    )
  },
];

const WORKFLOWS_PREMADE = [
  { id: 'inbound', label: 'Inbound Lead Routing', desc: 'Score → Route → HubSpot queue' },
  { id: 'cold-email', label: 'Cold Outreach Pipeline', desc: 'Sequence → Reply parsing → Meeting booking' },
  { id: 'noshowrecovery', label: 'No-Show Recovery', desc: 'Detect → Reschedule SMS/Email follow-up' },
  { id: 'abandoned', label: 'Abandoned Cart Recovery', desc: 'Trigger → Async SMS → Discount nudge' },
];

const TOOLS_PREMADE = [
  { id: 'calendar', label: 'Calendar Availability Check', type: 'CRM' },
  { id: 'webhook', label: 'Generic Webhook Trigger', type: 'HTTP' },
  { id: 'crm-lookup', label: 'CRM Contact Lookup', type: 'CRM' },
  { id: 'sms', label: 'Twilio SMS Send', type: 'Comm' },
  { id: 'email-send', label: 'SMTP Email Send', type: 'Comm' },
];

// ─── Main Component ───────────────────────────────────────────────────────

export default function AiSetterSalesEngine() {
  const router = useRouter();
  // null = not yet determined (avoids SSR/hydration mismatch)
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [integrationQuery, setIntegrationQuery] = useState('');
  const [workflowQuery, setWorkflowQuery] = useState('');
  const [toolQuery, setToolQuery] = useState('');

  const [formData, setFormData] = useState({
    channels: [] as string[],
    integrations: [] as string[],
    identity: '',
    framework: '',
    workflows: [] as string[],
    tools: [] as string[],
  });

  // Hydrate configured state from localStorage after mount
  useEffect(() => {
    setIsConfigured(localStorage.getItem(SETUP_KEY) === 'true');
  }, []);

  // While hydrating show nothing (prevents FOUC)
  if (isConfigured === null) return null;

  const toggleArr = (key: keyof typeof formData, val: string) => {
    const arr = formData[key] as string[];
    setFormData({ ...formData, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] });
  };

  const nextStep = () => setCurrentStep(p => Math.min(p + 1, ONBOARDING_STEPS.length - 1));
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 0));

  const filteredIntegrations = INTEGRATIONS.filter(i =>
    i.label.toLowerCase().includes(integrationQuery.toLowerCase()) ||
    i.cat.toLowerCase().includes(integrationQuery.toLowerCase())
  );

  // ─── DASHBOARD VIEW ───────────────────────────────────────────────────
  if (isConfigured) {
    return (
      <div className="flex flex-col h-full overflow-y-auto bg-[#f8f9fa] px-10 py-8 font-sans">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif text-gray-900">AI Setter Hub</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm text-gray-500">Multichannel Sales Engine <span className="text-green-600 font-semibold">Operational</span></p>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem(SETUP_KEY); setIsConfigured(false); setCurrentStep(0); }} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors">
            Re-run Setup
          </button>
        </div>

        {/* HERO METRICS BLOCK */}
        <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl p-8 text-white mb-8 relative overflow-hidden border border-gray-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Total Pipeline Generated</p>
            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-6xl font-serif tracking-tight">$142,500</span>
              <span className="text-green-400 text-sm font-semibold bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">+14% this week</span>
            </div>
            <div className="grid grid-cols-3 gap-8">
              {[
                { label: 'Meetings Booked', val: '24', unit: '' },
                { label: 'Outbound Volume', val: '1,840', unit: 'touches' },
                { label: 'Agent Health', val: '99.9%', unit: '', green: true },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.green ? 'text-green-400' : 'text-white'}`}>
                    {stat.val} {stat.unit && <span className="text-sm text-gray-500 font-normal">{stat.unit}</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BrainCircuit, label: 'Agent Customization', sub: 'Model, prompts, voice', color: 'bg-blue-50 text-blue-600', href: '/dashboard/builder' },
            { icon: Inbox, label: 'Live Inbox', sub: 'Monitor conversations', color: 'bg-green-50 text-green-600', href: '#' },
            { icon: Users, label: 'Leads CRM', sub: 'Manage prospect lists', color: 'bg-purple-50 text-purple-600', href: '#' },
            { icon: BarChart2, label: 'Analytics', sub: 'Conversion & call data', color: 'bg-orange-50 text-orange-600', href: '#' },
          ].map(q => (
            <div key={q.label} onClick={() => router.push(q.href)} className="bg-white border border-gray-200 p-5 rounded-2xl hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${q.color} group-hover:scale-110 transition-transform`}>
                <q.icon size={22} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">{q.label}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{q.sub}</p>
            </div>
          ))}
        </div>

        {/* CONNECTED CHANNELS STRIP */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Active Channels</h3>
          <div className="flex gap-3">
            {formData.channels.map(chId => {
              const ch = CHANNELS.find(c => c.id === chId);
              if (!ch) return null;
              return (
                <div key={chId} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
                  {ch.logo}
                  <span className="text-sm font-semibold text-gray-900">{ch.label}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1" />
                </div>
              );
            })}
            {formData.channels.length === 0 &&
              <p className="text-sm text-gray-400">No channels connected. <button onClick={() => { localStorage.removeItem(SETUP_KEY); setIsConfigured(false); setCurrentStep(0); }} className="text-blue-600 underline">Connect one</button></p>
            }
          </div>
        </div>
      </div>
    );
  }

  // ─── ONBOARDING VIEW ─────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-gray-50 overflow-hidden font-sans">

      {/* LEFT TIMELINE SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-8 pt-8 pb-5 border-b border-gray-50">
          <h2 className="text-lg font-bold text-gray-900">AI Setter Setup</h2>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">Multichannel Sales Engine</p>
        </div>
        <div className="flex-1 px-8 py-6 space-y-5 overflow-y-auto">
          {ONBOARDING_STEPS.map((step, idx) => {
            const isActive = currentStep === idx;
            const isDone = currentStep > idx;
            return (
              <div key={idx} className="relative flex items-center gap-3">
                {idx < ONBOARDING_STEPS.length - 1 && (
                  <div className={`absolute top-7 left-[11px] w-0.5 h-7 ${isDone ? 'bg-gray-900' : 'bg-gray-200'}`} />
                )}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 z-10 transition-colors
                  ${isDone ? 'bg-gray-900 border-gray-900' : isActive ? 'bg-white border-blue-600 shadow-[0_0_0_3px_rgba(37,99,235,0.12)]' : 'bg-white border-gray-200'}`}>
                  {isDone
                    ? <Check size={12} className="text-white" strokeWidth={3} />
                    : <span className={`text-[10px] font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{idx + 1}</span>
                  }
                </div>
                <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-blue-600' : isDone ? 'text-gray-700' : 'text-gray-400'}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-12 py-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >

                {/* ── STEP 0: Connect Channels ── */}
                {currentStep === 0 && (
                  <div>
                    <h1 className="text-3xl font-serif text-gray-900 mb-1.5">Connect Channels</h1>
                    <p className="text-gray-500 mb-8 text-sm">Select the platforms your Sales Engine will operate on and authenticate access.</p>
                    <div className="grid grid-cols-2 gap-4">
                      {CHANNELS.map(ch => {
                        const sel = formData.channels.includes(ch.id);
                        return (
                          <div key={ch.id} className={`bg-white border-2 rounded-2xl p-5 transition-all
                            ${sel ? 'border-gray-900 shadow-lg ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
                            <div className="flex items-center justify-between mb-4">
                              {ch.logo}
                              {sel && <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center"><Check size={11} className="text-white" strokeWidth={3} /></div>}
                            </div>
                            <h3 className="font-bold text-gray-900 mb-0.5">{ch.label}</h3>
                            <p className="text-xs text-gray-400 mb-4">{ch.sub}</p>
                            <button
                              onClick={() => toggleArr('channels', ch.id)}
                              className={`w-full py-2 rounded-lg text-sm font-semibold transition-all border
                                ${sel
                                  ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                            >
                              {sel ? 'Connected ✓' : 'Connect'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── STEP 1: Integrations ── */}
                {currentStep === 1 && (
                  <div>
                    <h1 className="text-3xl font-serif text-gray-900 mb-1.5">Integrations</h1>
                    <p className="text-gray-500 mb-8 text-sm">Connect your CRM, database, and communication tools to power the engine.</p>

                    {/* Search */}
                    <div className="relative mb-5">
                      <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text" value={integrationQuery} onChange={e => setIntegrationQuery(e.target.value)}
                        placeholder="Search integrations (HubSpot, Notion, Postgres…)"
                        className="w-full bg-white border border-gray-300 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-sm"
                      />
                    </div>

                    {/* Connected badges */}
                    {formData.integrations.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-5">
                        {formData.integrations.map(id => {
                          const it = INTEGRATIONS.find(i => i.id === id);
                          return it ? (
                            <div key={id} className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                              {it.label}
                              <button onClick={() => toggleArr('integrations', id)} className="ml-0.5 opacity-60 hover:opacity-100"><X size={10} /></button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Suggested grid */}
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Suggested Integrations</p>
                    <div className="grid grid-cols-2 gap-3">
                      {filteredIntegrations.map(it => {
                        const sel = formData.integrations.includes(it.id);
                        return (
                          <div key={it.id}
                            className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-all cursor-pointer
                              ${sel ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                            onClick={() => toggleArr('integrations', it.id)}
                          >
                            <div className="flex items-center gap-3">
                              {it.logo}
                              <div>
                                <p className="text-sm font-bold text-gray-900">{it.label}</p>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{it.cat}</p>
                              </div>
                            </div>
                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all
                              ${sel ? 'bg-gray-900 border-gray-900' : 'border-gray-200 hover:border-gray-400'}`}>
                              {sel ? <Check size={13} className="text-white" strokeWidth={3} /> : <Plus size={13} className="text-gray-400" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Identity & Role ── */}
                {currentStep === 2 && (
                  <div>
                    <h1 className="text-3xl font-serif text-gray-900 mb-1.5">Identity & Role</h1>
                    <p className="text-gray-500 mb-8 text-sm">Select the behavioral role and communication persona for your Agent. Advanced prompt customization is available in settings.</p>
                    <div className="grid grid-cols-3 gap-4">
                      {IDENTITY_ROLES.map(role => {
                        const sel = formData.identity === role.id;
                        return (
                          <div key={role.id}
                            onClick={() => setFormData({ ...formData, identity: role.id })}
                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all
                              ${sel ? 'bg-gray-900 border-gray-900 text-white shadow-xl scale-[1.02]' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                          >
                            <div className="text-3xl mb-3">{role.icon}</div>
                            <h3 className={`text-sm font-bold mb-1 ${sel ? 'text-white' : 'text-gray-900'}`}>{role.label}</h3>
                            <p className={`text-xs leading-relaxed ${sel ? 'text-gray-300' : 'text-gray-400'}`}>{role.sub}</p>
                            {sel && <div className="mt-3 flex justify-end"><Check size={16} className="text-white" /></div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Agentic Framework ── */}
                {currentStep === 3 && (
                  <div>
                    <h1 className="text-3xl font-serif text-gray-900 mb-1.5">Agentic Framework</h1>
                    <p className="text-gray-500 mb-8 text-sm">Select the architectural pattern controlling how your agent reasons, delegates, and acts.</p>
                    <div className="grid grid-cols-2 gap-4">
                      {FRAMEWORKS.map(fw => {
                        const sel = formData.framework === fw.id;
                        return (
                          <div key={fw.id}
                            onClick={() => setFormData({ ...formData, framework: fw.id })}
                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all
                              ${sel ? 'border-blue-600 bg-blue-50/60 shadow-md ring-1 ring-blue-600' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                          >
                            <div className="flex items-start justify-between">
                              <h3 className={`text-sm font-bold ${sel ? 'text-blue-900' : 'text-gray-900'}`}>{fw.label}</h3>
                              {sel && <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0"><Check size={11} className="text-white" strokeWidth={3} /></div>}
                            </div>
                            <p className={`text-xs mt-1 ${sel ? 'text-blue-700' : 'text-gray-400'}`}>{fw.sub}</p>
                            {fw.viz}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── STEP 4: Knowledgebase ── */}
                {currentStep === 4 && (
                  <div>
                    <h1 className="text-3xl font-serif text-gray-900 mb-1.5">Knowledgebase</h1>
                    <p className="text-gray-500 mb-8 text-sm">Upload SOPs, product docs, and scripts to give your agent context memory.</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-14 text-center bg-white hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer group">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-50 group-hover:scale-110 transition-all">
                        <FileText size={28} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Drop your documents here</h3>
                      <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">PDF, TXT, DOCX, or Notion URLs. These are ingested as context for better performance.</p>
                      <button className="mt-6 px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">Browse Files</button>
                    </div>
                  </div>
                )}

                {/* ── STEP 5: Tools & Workflows ── */}
                {currentStep === 5 && (
                  <div>
                    <h1 className="text-3xl font-serif text-gray-900 mb-1.5">Tools & Workflows</h1>
                    <p className="text-gray-500 mb-8 text-sm">Enable premade tools and orchestration workflows to give your agent real capabilities.</p>

                    {/* WORKFLOWS */}
                    <div className="mb-8">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Zap size={14} className="text-purple-500" /> Workflows
                      </h3>
                      <div className="relative mb-3">
                        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search workflows…" value={workflowQuery} onChange={e => setWorkflowQuery(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                      </div>
                      <div className="space-y-2">
                        {WORKFLOWS_PREMADE.filter(w => w.label.toLowerCase().includes(workflowQuery.toLowerCase())).map(wf => {
                          const sel = formData.workflows.includes(wf.id);
                          return (
                            <div key={wf.id} onClick={() => toggleArr('workflows', wf.id)}
                              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all
                                ${sel ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                              <div>
                                <p className={`text-sm font-bold ${sel ? 'text-purple-900' : 'text-gray-900'}`}>{wf.label}</p>
                                <p className="text-xs text-gray-400">{wf.desc}</p>
                              </div>
                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors
                                ${sel ? 'bg-purple-600 border-purple-600' : 'border-gray-300 hover:border-gray-500'}`}>
                                {sel ? <Check size={12} className="text-white" strokeWidth={3} /> : <Plus size={12} className="text-gray-400" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* TOOLS */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <BrainCircuit size={14} className="text-blue-500" /> Tools & Functions
                      </h3>
                      <div className="relative mb-3">
                        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search tools…" value={toolQuery} onChange={e => setToolQuery(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                      </div>
                      <div className="space-y-2">
                        {TOOLS_PREMADE.filter(t => t.label.toLowerCase().includes(toolQuery.toLowerCase())).map(tl => {
                          const sel = formData.tools.includes(tl.id);
                          return (
                            <div key={tl.id} onClick={() => toggleArr('tools', tl.id)}
                              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all
                                ${sel ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border
                                  ${sel ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                                  {tl.type}
                                </span>
                                <p className={`text-sm font-semibold font-mono ${sel ? 'text-blue-900' : 'text-gray-900'}`}>{tl.label}</p>
                              </div>
                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors
                                ${sel ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-gray-500'}`}>
                                {sel ? <Check size={12} className="text-white" strokeWidth={3} /> : <Plus size={12} className="text-gray-400" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Launch */}
                    <div className="mt-10 text-center">
                      <button
                        onClick={() => { localStorage.setItem(SETUP_KEY, 'true'); setIsConfigured(true); }}
                        className="px-12 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg active:scale-95 text-base"
                      >
                        Launch Sales Engine →
                      </button>
                      <p className="text-xs text-gray-400 mt-3">You can always edit these settings from the Agent Dashboard.</p>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* BOTTOM CONTROLS */}
        {currentStep < ONBOARDING_STEPS.length - 1 && (
          <div className="shrink-0 h-[72px] border-t border-gray-200 bg-white flex items-center justify-between px-12 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
            <button
              onClick={prevStep}
              className={`font-semibold text-sm px-6 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
            >
              Back
            </button>
            <button
              onClick={nextStep}
              className="font-semibold text-sm px-8 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
            >
              Continue →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
