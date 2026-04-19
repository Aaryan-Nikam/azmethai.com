'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, ChevronRight, Filter, ArrowUpRight,
  Check, ThumbsUp, ThumbsDown, ExternalLink,
  Globe, Mail, MessageSquare, Building2,
  User, TrendingUp, Star, Clock, Zap, Cpu
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = 'all' | 'scraped' | 'researched' | 'qualified' | 'personalised' | 'sent' | 'replied';
type QualStatus = 'pending' | 'qualified' | 'rejected';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  linkedinUrl?: string;
  website?: string;
  source: string;
  qualScore: number;
  qualStatus: QualStatus;
  researchSummary: string;
  stage: Stage;
  message?: {
    subject: string;
    body: string;
    framework: string;
  };
  sentAt?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_LEADS: Lead[] = [
  {
    id: 'l1', firstName: 'Sarah', lastName: 'Chen', email: 'sarah@techflow.io',
    company: 'TechFlow', title: 'CEO', linkedinUrl: '#', website: 'https://techflow.io',
    source: 'apify', qualScore: 87, qualStatus: 'qualified', stage: 'sent',
    researchSummary: 'TechFlow is a Series A B2B SaaS company (raised $4.2M in Jan 2026) with 38 employees. They recently expanded to the UK and are actively hiring 3 SDRs. Sarah has been CEO for 2 years and previously led growth at Stripe. Their main pain point appears to be scaling outbound without adding headcount.',
    message: {
      subject: 'Quick thought for TechFlow\'s outbound',
      body: 'Hi Sarah,\n\nI saw TechFlow just expanded to the UK — huge move. Most founders at your stage tell us the bottleneck shifts from product to pipeline.\n\nWe help Series A SaaS teams book 3–5 qualified calls per week on autopilot using AI-driven outbound — no extra SDR headcount needed.\n\nWorth 15 minutes this week?\n\nBest,\nAzmeth',
      framework: 'AIDA',
    },
    sentAt: 'Apr 11, 2026',
  },
  {
    id: 'l2', firstName: 'James', lastName: 'Okafor', email: 'james@dealvault.com',
    company: 'DealVault', title: 'Co-Founder & CTO', linkedinUrl: '#', website: 'https://dealvault.com',
    source: 'crunchbase', qualScore: 72, qualStatus: 'qualified', stage: 'personalised',
    researchSummary: 'DealVault is a fintech startup automating deal flow management for VCs. 15 employees, bootstrapped. James recently posted on LinkedIn about challenges with manual due diligence pipelines. Their product is gaining traction with 12 VC clients.',
    message: {
      subject: 'Scaling DealVault\'s outreach?',
      body: 'Hi James,\n\nYour post about manual due diligence bottlenecks hit home — it\'s a near-universal pain for fast-growing fintech.\n\nWe\'re helping teams like yours automate the prospecting layer so founders can focus on closing, not chasing.\n\nOpen to a quick chat?\n\nBest,\nAzmeth',
      framework: 'PAS',
    },
  },
  {
    id: 'l3', firstName: 'Priya', lastName: 'Nair', email: 'priya@looplogic.co',
    company: 'LoopLogic', title: 'VP of Marketing', linkedinUrl: '#', website: 'https://looplogic.co',
    source: 'apify', qualScore: 65, qualStatus: 'qualified', stage: 'researched',
    researchSummary: 'LoopLogic provides marketing analytics for e-commerce brands. 51 employees, recently hired a new Head of Sales. They\'re in a tech change cycle — switching from HubSpot to Salesforce. Priya joined 6 months ago from Intercom and is actively growing the marketing team.',
    message: undefined,
  },
  {
    id: 'l4', firstName: 'Marcus', lastName: 'Webb', email: 'marcus@buildscale.io',
    company: 'BuildScale', title: 'Founder', linkedinUrl: '#', website: 'https://buildscale.io',
    source: 'apify', qualScore: 41, qualStatus: 'rejected', stage: 'researched',
    researchSummary: 'BuildScale is a small construction estimating tool with 4 employees and no clear growth signal. The website is outdated and there\'s no recent news or hiring activity. Company profile doesn\'t match ICP.',
    message: undefined,
  },
  {
    id: 'l5', firstName: 'Ami', lastName: 'Garcia', email: 'ami@novapulse.com',
    company: 'NovaPulse', title: 'CRO', linkedinUrl: '#', website: 'https://novapulse.com',
    source: 'apify', qualScore: 91, qualStatus: 'qualified', stage: 'replied',
    researchSummary: 'NovaPulse is a high-growth HR tech platform with 120 employees. Recently raised a $12M Series B. Ami joined as CRO 3 months ago and is rebuilding their outbound function from scratch. They have 3 open SDR roles and no current outbound tooling.',
    message: {
      subject: 'NovaPulse\'s outbound rebuild — an idea',
      body: 'Hi Ami,\n\nBuilding an outbound function from zero is hard enough — doing it while simultaneously hiring a team is even harder.\n\nWe help CROs exactly at this stage: launch a fully automated outbound engine before the first SDR even starts, so there\'s a pipeline waiting for them.\n\nWould love to show you how — 20 minutes?\n\nBest,\nAzmeth',
      framework: 'BAB',
    },
    sentAt: 'Apr 9, 2026',
  },
  {
    id: 'l6', firstName: 'Tom', lastName: 'Bradley', email: 'tom@quanta.ai',
    company: 'Quanta AI', title: 'CEO', linkedinUrl: '#', website: 'https://quanta.ai',
    source: 'crunchbase', qualScore: 0, qualStatus: 'pending', stage: 'scraped',
    researchSummary: '',
    message: undefined,
  },
];

const STAGES: { id: Stage; label: string; count?: number }[] = [
  { id: 'all', label: 'All Leads' },
  { id: 'scraped', label: 'Scraped' },
  { id: 'researched', label: 'Researched' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'personalised', label: 'Personalised' },
  { id: 'sent', label: 'Sent' },
  { id: 'replied', label: 'Replied' },
];

const QUAL_BADGE: Record<QualStatus, string> = {
  pending:   'bg-gray-100 text-gray-500 border-gray-200',
  qualified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected:  'bg-red-50 text-red-600 border-red-200',
};

const STAGE_BADGE: Record<string, string> = {
  scraped:      'bg-gray-100 text-gray-500',
  researched:   'bg-blue-50 text-blue-700',
  qualified:    'bg-emerald-50 text-emerald-700',
  personalised: 'bg-purple-50 text-purple-700',
  sent:         'bg-indigo-50 text-indigo-700',
  replied:      'bg-rose-50 text-rose-700',
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-700 bg-emerald-50' : score >= 60 ? 'text-blue-700 bg-blue-50' : score >= 40 ? 'text-amber-700 bg-amber-50' : 'text-gray-500 bg-gray-100';
  if (score === 0) return <span className="text-xs text-gray-300 font-mono">—</span>;
  return (
    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${color}`}>
      <Star size={10} fill="currentColor" /> {score}
    </div>
  );
}

// ─── Lead Drawer ──────────────────────────────────────────────────────────────

function LeadDrawer({
  lead,
  onClose,
  onApprove,
  onReject,
}: {
  lead: Lead;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="w-[480px] shrink-0 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden shadow-2xl"
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-900 text-white font-bold text-sm flex items-center justify-center">
            {lead.firstName[0]}{lead.lastName[0]}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{lead.firstName} {lead.lastName}</h3>
            <p className="text-xs text-gray-400">{lead.title} · {lead.company}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Contact info */}
        <div className="px-6 py-4 border-b border-gray-100 space-y-2">
          <a href={`mailto:${lead.email}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900">
            <Mail size={14} className="text-gray-400" /> {lead.email}
          </a>
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900">
              <Globe size={14} className="text-gray-400" /> {lead.website} <ExternalLink size={10} />
            </a>
          )}
          {lead.linkedinUrl && (
            <a href={lead.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900">
              <Globe size={14} className="text-gray-400" /> View LinkedIn <ExternalLink size={10} />
            </a>
          )}
        </div>

        {/* Score + Stage */}
        <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Qual Score</p>
            <ScoreBadge score={lead.qualScore} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Stage</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg capitalize ${STAGE_BADGE[lead.stage] || 'bg-gray-100 text-gray-500'}`}>{lead.stage}</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Source</p>
            <span className="text-xs font-mono text-gray-500">{lead.source}</span>
          </div>
        </div>

        {/* Research Summary */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={14} className="text-purple-500" />
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Research Summary</p>
          </div>
          {lead.researchSummary ? (
            <p className="text-sm text-gray-600 leading-relaxed">{lead.researchSummary}</p>
          ) : (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Clock size={13} />
              <span>Research pending — not yet processed</span>
            </div>
          )}
        </div>

        {/* Personalised Message */}
        {lead.message && (
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-blue-500" />
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Personalised Message</p>
              </div>
              <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{lead.message.framework}</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Subject</p>
                <p className="text-sm font-semibold text-gray-900">{lead.message.subject}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Body</p>
                <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{lead.message.body}</pre>
              </div>
            </div>
            {lead.sentAt && (
              <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                <Check size={11} className="text-emerald-500" /> Sent {lead.sentAt}
              </p>
            )}
          </div>
        )}

        {/* Qualification Actions */}
        {lead.qualStatus === 'pending' && lead.researchSummary && (
          <div className="px-6 py-4">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Manual Qualification</p>
            <div className="flex gap-3">
              <button
                onClick={() => onApprove(lead.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <ThumbsUp size={14} /> Approve
              </button>
              <button
                onClick={() => onReject(lead.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
              >
                <ThumbsDown size={14} /> Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadPoolPage() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [activeStage, setActiveStage] = useState<Stage>('all');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchStage = activeStage === 'all' || l.stage === activeStage;
    const matchQ = l.firstName.toLowerCase().includes(q) ||
      l.lastName.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q);
    return matchStage && matchQ;
  });

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s.id] = s.id === 'all' ? leads.length : leads.filter(l => l.stage === s.id).length;
    return acc;
  }, {} as Record<string, number>);

  const updateLead = (id: string, fn: (lead: Lead) => Lead) => {
    setLeads(prev => prev.map(lead => (lead.id === id ? fn(lead) : lead)));
    setSelectedLead(prev => (prev && prev.id === id ? fn(prev) : prev));
  };

  const approveLead = (id: string) => {
    updateLead(id, (lead) => ({
      ...lead,
      qualStatus: 'qualified',
      qualScore: lead.qualScore > 0 ? lead.qualScore : 72,
      stage: lead.stage === 'scraped' || lead.stage === 'researched' ? 'qualified' : lead.stage,
    }));
    toast.success('Lead approved for outreach');
  };

  const rejectLead = (id: string) => {
    updateLead(id, (lead) => ({
      ...lead,
      qualStatus: 'rejected',
      stage: lead.stage === 'personalised' || lead.stage === 'sent' || lead.stage === 'replied' ? 'researched' : lead.stage,
    }));
    toast.success('Lead rejected');
  };

  return (
    <div className="flex h-full overflow-hidden font-sans bg-[#f7f8fa]">
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="px-8 pt-7 pb-4 bg-[#f7f8fa] border-b border-gray-200 shrink-0">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Lead Pool</h1>
              <p className="text-sm text-gray-400 mt-0.5">All scraped leads across active campaigns — research, qualify, and track status.</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-sm">
                    <span className="text-lg font-bold text-gray-900">{leads.length}</span> total leads
            </div>
          </div>

          {/* Stage tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {STAGES.map(s => (
              <button key={s.id} onClick={() => setActiveStage(s.id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeStage === s.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                {s.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeStage === s.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {stageCounts[s.id]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="px-8 py-3 border-b border-gray-200 bg-white shrink-0">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search leads by name, company, email…"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={13} className="text-gray-400" /></button>}
          </div>
        </div>

        {/* Table */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {/* Table head */}
            <div className="sticky top-0 z-10 grid bg-white border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-widest"
              style={{ gridTemplateColumns: '2.5fr 1.5fr 1fr 0.8fr 0.9fr 80px' }}>
              <div className="py-3 px-6">Lead</div>
              <div className="py-3 px-2">Company & Title</div>
              <div className="py-3 px-2">Stage</div>
              <div className="py-3 px-2">Score</div>
              <div className="py-3 px-2">Status</div>
              <div className="py-3 px-3 text-right">Actions</div>
            </div>

            {/* Rows */}
            {filtered.map((lead, idx) => (
              <div key={lead.id} onClick={() => setSelectedLead(lead === selectedLead ? null : lead)}
                style={{ gridTemplateColumns: '2.5fr 1.5fr 1fr 0.8fr 0.9fr 80px' }}
                className={`group grid items-center border-b border-gray-100 last:border-0 cursor-pointer transition-all ${lead === selectedLead ? 'bg-gray-900' : 'hover:bg-gray-50/80'}`}>

                {/* Lead */}
                <div className="flex items-center gap-3 py-3.5 px-6">
                  <div className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${lead === selectedLead ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'}`}>
                    {lead.firstName[0]}{lead.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${lead === selectedLead ? 'text-white' : 'text-gray-900'}`}>{lead.firstName} {lead.lastName}</p>
                    <p className={`text-[11px] truncate ${lead === selectedLead ? 'text-gray-400' : 'text-gray-400'}`}>{lead.email}</p>
                  </div>
                </div>

                {/* Company */}
                <div className="py-3.5 px-2">
                  <p className={`text-sm font-semibold ${lead === selectedLead ? 'text-white' : 'text-gray-900'}`}>{lead.company}</p>
                  <p className={`text-[11px] ${lead === selectedLead ? 'text-gray-400' : 'text-gray-400'}`}>{lead.title}</p>
                </div>

                {/* Stage */}
                <div className="py-3.5 px-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg capitalize ${lead === selectedLead ? 'bg-white/10 text-gray-300' : STAGE_BADGE[lead.stage] || 'bg-gray-100 text-gray-500'}`}>
                    {lead.stage}
                  </span>
                </div>

                {/* Score */}
                <div className="py-3.5 px-2">
                  {lead === selectedLead
                    ? <span className="text-sm font-bold text-white">{lead.qualScore > 0 ? lead.qualScore : '—'}</span>
                    : <ScoreBadge score={lead.qualScore} />
                  }
                </div>

                {/* Qual Status */}
                <div className="py-3.5 px-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${lead === selectedLead ? 'bg-white/10 text-gray-300 border-white/20' : QUAL_BADGE[lead.qualStatus]}`}>
                    {lead.qualStatus}
                  </span>
                </div>

                {/* Actions */}
                <div className="py-3.5 px-3 flex justify-end">
                  <ChevronRight size={14} className={`transition-transform ${lead === selectedLead ? 'text-white rotate-90' : 'text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5'}`} />
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Search size={28} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No leads found</p>
              </div>
            )}
          </div>

          {/* Slide-over Drawer */}
          <AnimatePresence>
            {selectedLead && (
              <LeadDrawer
                lead={selectedLead}
                onClose={() => setSelectedLead(null)}
                onApprove={approveLead}
                onReject={rejectLead}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
