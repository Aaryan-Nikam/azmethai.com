'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Plus, X, ChevronRight, Minus,
  Search, Zap, BrainCircuit, Filter, PenTool, Send,
  Globe, Linkedin, Mail, MessageCircle, Tag, Building2,
  MapPin, Users, TrendingUp, Sparkles, RefreshCw, Info,
  Trash2, GripVertical, Upload, FileText
} from 'lucide-react';

// --- Constants ---


const SETUP_KEY = 'azmeth_outbound_engine_configured';

const STEPS = [
  'ICP & Target',
  'Lead Scraping',
  'Qualification Rules',
  'Research Depth',
  'Personalisation',
  'Outbound Channels',
];

// --- ICP Options ---


const INDUSTRIES = [
  'SaaS', 'Fintech', 'Healthcare', 'E-commerce', 'Real Estate',
  'Legal', 'Consulting', 'Marketing Agencies', 'Manufacturing', 'EdTech',
  'Logistics', 'HR Tech', 'Cybersecurity', 'Construction', 'Insurance',
];

const COMPANY_SIZES = [
  { id: '1-10', label: '1–10', sub: 'Micro' },
  { id: '11-50', label: '11–50', sub: 'Small' },
  { id: '51-200', label: '51–200', sub: 'Mid-Market' },
  { id: '201-500', label: '201–500', sub: 'Growth' },
  { id: '500+', label: '500+', sub: 'Enterprise' },
];

const TITLES = [
  'CEO', 'Founder', 'Co-Founder', 'CTO', 'CMO', 'COO', 'CFO',
  'VP of Sales', 'VP of Marketing', 'Head of Growth', 'Director of Ops',
  'Sales Manager', 'Marketing Manager', 'Business Owner',
];

const GEOS = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Europe (All)', 'MENA', 'APAC'];

// --- Apify Common Actor Fields ---


interface ApifyField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'toggle' | 'textarea';
  placeholder?: string;
  value: string | number | boolean;
}

const DEFAULT_APIFY_FIELDS = [
  { key: 'startUrls', label: 'Start URL(s)', type: 'textarea', placeholder: 'https://www.linkedin.com/search/...', value: '' },
  { key: 'maxItems', label: 'Max Leads to Import', type: 'number', placeholder: '500', value: 500 },
  { key: 'keyword', label: 'Keyword / Search Query', type: 'text', placeholder: 'B2B SaaS CEO New York', value: '' },
  { key: 'proxyConfig', label: 'Use Proxy', type: 'toggle', value: true },
];

// --- Frameworks ---


const FRAMEWORKS = [
  {
    id: 'aida',
    label: 'AIDA',
    full: 'Attention -> Interest -> Desire -> Action',

    desc: 'Classic direct-response framework. Hook, build desire, clear CTA.',
    color: 'blue',
    viz: ['ATTENTION', 'INTEREST', 'DESIRE', 'ACTION'],
  },
  {
    id: 'pas',
    label: 'PAS',
    full: 'Problem -> Agitate -> Solution',

    desc: 'Identify the pain, make it feel urgent, present your solution.',
    color: 'purple',
    viz: ['PROBLEM', 'AGITATE', 'SOLUTION'],
  },
  {
    id: 'bab',
    label: 'BAB',
    full: 'Before -> After -> Bridge',

    desc: 'Paint the current state, the dream outcome, then bridge the gap.',
    color: 'green',
    viz: ['BEFORE', 'AFTER', 'BRIDGE'],
  },
  {
    id: 'custom',
    label: 'Custom',
    full: 'Write your own template',
    desc: 'Full control. Use {{placeholders}} for dynamic personalisation.',
    color: 'orange',
    viz: [],
  },
];

const VIZ_COLORS: { [key: string]: string } = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
};

const PLACEHOLDERS = [
  '{{first_name}}', '{{last_name}}', '{{company}}', '{{title}}',
  '{{pain_point}}', '{{industry}}', '{{website}}', '{{linkedin_url}}',
];

// --- Types ---
type GmailCreds = { email: string; password: string };

function GmailLogo() {
  return (
    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill="#EA4335"/>
      </svg>
    </div>
  );
}

function InstantlyLogo() {
  return (
    <div className="w-10 h-10 rounded-xl bg-[#5B4CF5] flex items-center justify-center shadow-sm">
      <Zap size={18} fill="white" className="text-white" />
    </div>
  );
}

function SmartleadLogo() {
  return (
    <div className="w-10 h-10 rounded-xl bg-[#0F172A] flex items-center justify-center shadow-sm">
      <TrendingUp size={18} className="text-white" />
    </div>
  );
}

function InstagramLogo() {
  return (
    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
      <svg viewBox="0 0 24 24" className="w-10 h-10">
        <defs>
          <linearGradient id="igOE" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
        <rect width="24" height="24" fill="url(#igOE)" />
        <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="17" cy="7" r="1" fill="white" />
      </svg>
    </div>
  );
}




// --- Main Component ---


export default function OutboundEngineSetup() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // --- Channels Config ---
  const CHANNELS = React.useMemo(() => [
    {
      id: 'gmail',
      label: 'Gmail (Native)',
      sub: 'Send directly from connected Gmail accounts',
      badge: 'Recommended',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      logo: GmailLogo,
    },
    {
      id: 'instantly',
      label: 'Instantly',
      sub: 'Cold email sequencing at scale',
      badge: '',
      badgeColor: '',
      logo: InstantlyLogo,
    },
    {
      id: 'smartlead',
      label: 'Smartlead',
      sub: 'Multi-inbox email warm-up & sequences',
      badge: '',
      badgeColor: '',
      logo: SmartleadLogo,
    },
    {
      id: 'instagram',
      label: 'Instagram DMs',
      sub: 'Personalised outreach via IG Direct',
      badge: 'Beta',
      badgeColor: 'bg-orange-100 text-orange-700',
      logo: InstagramLogo,
    },
  ], []);


  // --- ICP State ---

  const [industries, setIndustries] = useState([] as string[]);
  const [sizes, setSizes] = useState([] as string[]);
  const [titles, setTitles] = useState([] as string[]);
  const [geos, setGeos] = useState([] as string[]);
  const [painPoints, setPainPoints] = useState('');
  const [icpSummary, setIcpSummary] = useState('');
  const [generatingIcp, setGeneratingIcp] = useState(false);

  // --- Scraping State ---

  const [scrapeSource, setScrapeSource] = useState('crunchbase' as 'apify' | 'crunchbase' | 'csv');
  const [apifyActorUrl, setApifyActorUrl] = useState('');
  const [apifyFields, setApifyFields] = useState(DEFAULT_APIFY_FIELDS as ApifyField[]);
  const [customFieldKey, setCustomFieldKey] = useState('');
  // Crunchbase URL list
  const [crunchbaseUrls, setCrunchbaseUrls] = useState([] as string[]);
  const [crunchbaseUrlInput, setCrunchbaseUrlInput] = useState('');
  const [crunchbaseMaxItems, setCrunchbaseMaxItems] = useState(100);

  // CSV
  const [csvFileName, setCsvFileName] = useState('');
  const [csvContent, setCsvContent] = useState('');

  // --- Gmail Accounts State ---

  const [gmailAccounts, setGmailAccounts] = useState([] as GmailCreds[]);
  const [gmailEmailInput, setGmailEmailInput] = useState('');
  const [gmailPasswordInput, setGmailPasswordInput] = useState('');
  const [showGmailPassword, setShowGmailPassword] = useState(false);

  // --- Qualification State ---

  const [minScore, setMinScore] = useState(60);
  const [requiredSignals, setRequiredSignals] = useState([] as string[]);
  const [titleKeywords, setTitleKeywords] = useState([] as string[]);
  const [titleInput, setTitleInput] = useState('');

  // --- Research Depth State ---

  const [researchDepth, setResearchDepth] = useState('standard' as 'surface' | 'standard' | 'deep');

  // Personalisation State

  const [framework, setFramework] = useState('aida');
  const [customBody, setCustomBody] = useState('Hi {{first_name}},\n\nI noticed {{company}} is doing great work in the {{industry}} space...\n\n');
  const [customSubject, setCustomSubject] = useState('Quick thought for {{company}}');

  // Channel State

  const [channels, setChannels] = useState(['gmail'] as string[]);

  // --- Helpers ---

  const toggle = (arr: string[], val: string, set: (a: string[]) => void) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const generateIcpSummary = () => {
    setGeneratingIcp(true);
    setTimeout(() => {
      const sizeLabel = sizes.join(', ') || 'any size';
      const indLabel = industries.slice(0, 3).join(', ') || 'various industries';
      const titleLabel = titles.slice(0, 3).join(', ') || 'key decision makers';
      const geoLabel = geos.slice(0, 2).join(' & ') || 'global markets';
      setIcpSummary(
        `Target ${sizeLabel} companies in ${indLabel} operating in ${geoLabel}. ` +
        `Reach out to ${titleLabel} who are experiencing ${painPoints || 'common operational challenges'} ` +
        `and are likely to be in an active buying cycle.`
      );
      setGeneratingIcp(false);
    }, 1200);
  };

  const updateApifyField = (idx: number, val: string | number | boolean) => {
    setApifyFields(f => f.map((field, i) => i === idx ? { ...field, value: val } : field));
  };

  const removeApifyField = (idx: number) => {
    setApifyFields(f => f.filter((_, i) => i !== idx));
  };

  const addCustomField = () => {
    if (!customFieldKey.trim()) return;
    setApifyFields(f => [...f, { key: customFieldKey, label: customFieldKey, type: 'text', placeholder: '', value: '' }]);
    setCustomFieldKey('');
  };

  const addTitleKeyword = () => {
    if (!titleInput.trim() || titleKeywords.includes(titleInput.trim())) return;
    setTitleKeywords(k => [...k, titleInput.trim()]);
    setTitleInput('');
  };

  const addCrunchbaseUrl = () => {
    const url = crunchbaseUrlInput.trim();
    if (!url) return;
    // Accept full URLs or just org slugs
    const normalized = url.startsWith('http')
      ? url
      : `https://www.crunchbase.com/organization/${url}`;
    if (!crunchbaseUrls.includes(normalized)) {
      setCrunchbaseUrls(u => [...u, normalized]);
    }
    setCrunchbaseUrlInput('');
  };

  const addGmailAccount = () => {
    const email = gmailEmailInput.trim();
    const password = gmailPasswordInput.replace(/\s/g, '');
    if (!email || !password) return;
    if (gmailAccounts.some(a => a.email === email)) return;
    setGmailAccounts(a => [...a, { email, password }]);
    setGmailEmailInput('');
    setGmailPasswordInput('');
  };

  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = async () => {
    try {
      setIsLaunching(true);
      
      const config = {
        icp_summary: icpSummary,
        scrape_source: scrapeSource,
        csv_file_name: csvFileName,
        csv_content: csvContent,
        crunchbase_urls: crunchbaseUrls,
        crunchbase_max_items: crunchbaseMaxItems,
        apify_actor_url: apifyActorUrl,
        apify_fields: Object.fromEntries(apifyFields.map(f => [f.key, f.value])),
        min_score: minScore,
        required_signals: requiredSignals,
        title_keywords: titleKeywords,
        research_depth: researchDepth,
        framework,
        custom_subject: customSubject,
        custom_body: customBody,
        channels,
        gmail_accounts: gmailAccounts,
      };

      const icp = { 
        industries, 
        sizes, 
        titles, 
        geos, 
        painPoints 
      };

      const res = await fetch('/api/outbound/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Campaign - " + (geos[0] || "Global") + " " + (titles[0] || "Leaders"),
          config,
          icp,
        }),

      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      localStorage.setItem(SETUP_KEY, 'true');
      router.push('/dashboard/outbound');
    } catch (err) {
      console.error('Launch failed:', err);
      localStorage.setItem(SETUP_KEY, 'true');
      router.push('/dashboard/outbound');
    } finally {
      setIsLaunching(false);
    }
  };
  const SCRAPE_SOURCES = [
    { id: 'apify' as const, label: 'Apify Actor', icon: Zap, desc: 'Run any Apify actor with custom inputs' },
    { id: 'crunchbase' as const, label: 'Crunchbase', icon: Search, desc: 'Search companies by keyword or filter' },
    { id: 'csv' as const, label: 'CSV Upload', icon: Upload, desc: 'Import pre-scraped targeted leads' },
  ];

  const RESEARCH_DEPTHS = [
    {
      id: 'surface' as const,
      label: 'Surface',
      speed: 'Fastest',
      speedColor: 'text-emerald-600 bg-emerald-50',
      desc: 'Website scrape only. Pulls company overview, product description, and basic metadata.',
      channels: ['🌐 Company Website'],
      time: '~10s per lead',
    },
    {
      id: 'standard' as const,
      label: 'Standard',
      speed: 'Recommended',
      speedColor: 'text-blue-600 bg-blue-50',
      desc: 'Website + LinkedIn profile scrape. Includes recent company news, team size, and lead\'s recent activity.',
      channels: ['🌐 Company Website', '💼 LinkedIn'],
      time: '~30s per lead',
    },
    {
      id: 'deep' as const,
      label: 'Deep',
      speed: 'Most Thorough',
      speedColor: 'text-purple-600 bg-purple-50',
      desc: 'Full multi-source research. Scrapes company website, LinkedIn, Twitter/X, Glassdoor, recent press, and G2/Capterra reviews.',
      channels: ['🌐 Website', '💼 LinkedIn', '🐦 Twitter/X', '📰 News', '⭐ Reviews'],
      time: '~90s per lead',
    },
  ];

  const renderStep0 = () => (
    <div>
      <h1 className="text-3xl font-serif text-gray-900 mb-1.5">ICP & Target Audience</h1>
      <p className="text-gray-500 mb-8 text-sm">Define your ideal customer profile. The more specific, the better your leads will qualify.</p>

      <div className="space-y-7">
        {/* Industries */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <Building2 size={13} className="text-gray-400" /> Industries
          </label>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map(ind => {
              const sel = industries.includes(ind);
              return (
                <button key={ind} onClick={() => toggle(industries, ind, setIndustries)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${sel ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  {ind}
                </button>
              );
            })}
          </div>
        </div>

        {/* Company Sizes */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <Users size={13} className="text-gray-400" /> Company Size (Employees)
          </label>
          <div className="flex gap-3">
            {COMPANY_SIZES.map(sz => {
              const sel = sizes.includes(sz.id);
              return (
                <button key={sz.id} onClick={() => toggle(sizes, sz.id, setSizes)}
                  className={`flex-1 py-3 rounded-xl border-2 text-center transition-all ${sel ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <p className={`text-sm font-bold ${sel ? 'text-white' : 'text-gray-900'}`}>{sz.label}</p>
                  <p className={`text-[10px] mt-0.5 ${sel ? 'text-gray-300' : 'text-gray-400'}`}>{sz.sub}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Titles */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <Tag size={13} className="text-gray-400" /> Target Job Titles
          </label>
          <div className="flex flex-wrap gap-2">
            {TITLES.map(t => {
              const sel = titles.includes(t);
              return (
                <button key={t} onClick={() => toggle(titles, t, setTitles)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${sel ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Geographies */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <MapPin size={13} className="text-gray-400" /> Geographies
          </label>
          <div className="flex flex-wrap gap-2">
            {GEOS.map(geo => {
              const sel = geos.includes(geo);
              return (
                <button key={geo} onClick={() => toggle(geos, geo, setGeos)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${sel ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  {geo}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pain Points */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <Info size={13} className="text-gray-400" /> Core Pain Points (Optional)
          </label>
          <textarea value={painPoints} onChange={e => setPainPoints(e.target.value)} rows={3}
            placeholder="e.g. Scaling outbound without growing headcount, poor lead quality from existing tools…"
            className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
        </div>

        {/* AI Summary Generator */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-gray-600" />
              <p className="text-sm font-bold text-gray-900">AI ICP Summary</p>
            </div>
            <button onClick={generateIcpSummary} disabled={generatingIcp}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors disabled:opacity-50">
              {generatingIcp ? <React.Fragment><RefreshCw size={11} className="animate-spin" /> Generating...</React.Fragment> : <React.Fragment><Sparkles size={11} /> Generate</React.Fragment>}
            </button>
          </div>
          {icpSummary
            ? <p className="text-sm text-gray-700 leading-relaxed">{icpSummary}</p>
            : <p className="text-sm text-gray-400 italic">Fill in the fields above, then click Generate to produce your AI ICP summary.</p>
          }
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h1 className="text-3xl font-serif text-gray-900 mb-1.5">Lead Scraping</h1>
      <p className="text-gray-500 mb-8 text-sm">Configure your lead source. Scraped leads will populate the Lead Pool for research and qualification.</p>

      {/* Source Toggle */}
      <div className="flex gap-3 mb-8">
        {SCRAPE_SOURCES.map(src => {
          const Icon = src.icon;
          return (
            <button key={src.id} onClick={() => setScrapeSource(src.id)}
              className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${scrapeSource === src.id ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <Icon size={18} className={scrapeSource === src.id ? "text-white mt-0.5" : "text-gray-400 mt-0.5"} />
              <div>
                <p className={`text-sm font-bold ${scrapeSource === src.id ? "text-white" : "text-gray-900"}`}>{src.label}</p>
                <p className={`text-xs mt-0.5 ${scrapeSource === src.id ? "text-gray-300" : "text-gray-400"}`}>{src.desc}</p>
              </div>
              {scrapeSource === src.id && <Check size={14} className="text-white ml-auto mt-0.5 shrink-0" strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      {scrapeSource === 'apify' && (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 block">Apify Actor URL</label>
            <input value={apifyActorUrl} onChange={e => setApifyActorUrl(e.target.value)}
              placeholder="https://api.apify.com/v2/acts/apify~linkedin-profile-scraper/runs"
              className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Input Configuration</label>
              <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono">{apifyFields.length} fields</span>
            </div>
            <div className="space-y-2">
              {apifyFields.map((field, idx) => (
                <div key={field.key} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-gray-50">
                    <GripVertical size={13} className="text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex-1">{field.label}</span>
                    <span className="text-[9px] font-mono text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">{field.type}</span>
                    <button onClick={() => removeApifyField(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="px-4 py-3">
                    {field.type === 'toggle' ? (
                      <button onClick={() => updateApifyField(idx, !field.value)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${field.value ? 'bg-gray-900' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${field.value ? 'left-6' : 'left-1'}`} />
                      </button>
                    ) : field.type === 'textarea' ? (
                      <textarea value={String(field.value)} onChange={e => updateApifyField(idx, e.target.value)}
                        rows={2} placeholder={field.placeholder}
                        className="w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none resize-none font-mono" />
                    ) : field.type === 'number' ? (
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateApifyField(idx, Math.max(0, Number(field.value) - 100))}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Minus size={12} /></button>
                        <input type="number" value={Number(field.value)} onChange={e => updateApifyField(idx, Number(e.target.value))}
                          className="w-20 text-sm font-bold text-center text-gray-900 focus:outline-none border-b border-gray-200 pb-0.5" />
                        <button onClick={() => updateApifyField(idx, Number(field.value) + 100)}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Plus size={12} /></button>
                      </div>
                    ) : (
                      <input type="text" value={String(field.value)} onChange={e => updateApifyField(idx, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input value={customFieldKey} onChange={e => setCustomFieldKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomField()}
                placeholder="Add custom field key…"
                className="flex-1 bg-white border border-dashed border-gray-300 rounded-xl py-2.5 px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 font-mono" />
              <button onClick={addCustomField} className="px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {scrapeSource === 'crunchbase' && (
        <div className="space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
              <p className="text-xs font-bold text-emerald-900 mb-0.5">Crunchbase Search Extraction</p>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Powered by <strong>saswave/crunchbase-search-results</strong> via Apify.
                Paste a Crunchbase Search or Discover URL to extract dynamic results.
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 block">Crunchbase Search URL</label>
            <div className="relative">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <textarea
                value={crunchbaseUrlInput}
                onChange={e => {
                  setCrunchbaseUrlInput(e.target.value);
                  setCrunchbaseUrls([e.target.value]);
                }}
                rows={2}
                placeholder="https://www.crunchbase.com/discover/organization.companies/..."
                className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-sm font-mono text-gray-700 placeholder:text-gray-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Max results per URL</label>
              <span className="text-sm font-bold text-gray-900 tabular-nums">{crunchbaseMaxItems}</span>
            </div>
            <input
              type="range" min={10} max={500} step={10} value={crunchbaseMaxItems}
              onChange={e => setCrunchbaseMaxItems(Number(e.target.value))}
              className="w-full accent-gray-900 h-2 rounded-full cursor-pointer"
            />
          </div>
        </div>
      )}

      {scrapeSource === 'csv' && (
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-900 mb-0.5">Bring Your Own Leads</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Upload a CSV containing your leads. The outbound engine heuristics will attempt to auto-map columns for email, first_name, company, etc.
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 block">Upload CSV Data</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload size={24} className="text-gray-400 mb-2" />
                <p className="mb-1 text-sm text-gray-500 font-semibold">Click to upload or drag and drop</p>
                <p className="text-[10px] text-gray-400 font-mono">.CSV formatted files only</p>
              </div>
              <input 
                type="file" 
                accept=".csv"
                className="hidden" 
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setCsvFileName(file.name);
                  const reader = new FileReader();
                  reader.onload = async (evt) => {
                    const text = evt.target?.result;
                    if (typeof text === 'string') {
                      setCsvContent(text);
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
            {csvFileName && (
              <div className="mt-3 flex items-center justify-between bg-white border border-gray-200 px-4 py-2.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-700 font-mono truncate max-w-[200px]">{csvFileName}</span>
                </div>
                <button onClick={() => { setCsvFileName(''); setCsvContent(''); }} className="text-[10px] text-red-500 hover:underline font-medium">Remove</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h1 className="text-3xl font-serif text-gray-900 mb-1.5">Qualification Rules</h1>
      <p className="text-gray-500 mb-8 text-sm">Define the criteria the Research Agent uses to score and accept or reject leads.</p>

      <div className="space-y-7">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Minimum Qualification Score</label>
            <span className="text-2xl font-bold text-gray-900 tabular-nums">{minScore}<span className="text-base text-gray-400">/100</span></span>
          </div>
          <input type="range" min={0} max={100} step={5} value={minScore} onChange={e => setMinScore(Number(e.target.value))}
            className="w-full accent-gray-900 h-2 rounded-full cursor-pointer" />
          <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-semibold">
            <span>0 — Accept All</span><span>50 — Balanced</span><span>100 — Strict</span>
          </div>
          <div className={`mt-3 text-xs font-semibold px-3 py-2 rounded-lg inline-block ${minScore >= 80 ? 'bg-red-50 text-red-700' : minScore >= 60 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {minScore >= 80 ? 'Strict - very few leads will qualify' : minScore >= 60 ? 'Recommended - good balance' : 'Warning - most leads will qualify'}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3 block">Required Intent Signals (at least one)</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'hiring', label: '🏢 Actively Hiring', desc: 'Company has open job listings' },
              { id: 'funding', label: '💰 Recently Funded', desc: 'Raised in the last 12 months' },
              { id: 'news', label: '📰 In the News', desc: 'Mentioned in press/media' },
              { id: 'tech_change', label: '🔧 Tech Change Signal', desc: 'Recently switched tools' },
              { id: 'leadership_change', label: '👤 Leadership Change', desc: 'New C-level or VP joined' },
              { id: 'expansion', label: '🌍 Market Expansion', desc: 'Entering a new market/geo' },
            ].map(sig => {
              const sel = requiredSignals.includes(sig.id);
              return (
                <button key={sig.id} onClick={() => toggle(requiredSignals, sig.id, setRequiredSignals)}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${sel ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="text-lg leading-none mt-0.5">{sig.label.split(' ')[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${sel ? 'text-white' : 'text-gray-900'}`}>{sig.label.split(' ').slice(1).join(' ')}</p>
                    <p className={`text-[10px] mt-0.5 ${sel ? 'text-gray-300' : 'text-gray-400'}`}>{sig.desc}</p>
                  </div>
                  {sel && <Check size={13} className="text-white shrink-0" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3 block">Required Title Keywords</label>
          <div className="flex gap-2 mb-3">
            <input value={titleInput} onChange={e => setTitleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTitleKeyword()}
              placeholder="e.g. VP, Head, Director…"
              className="flex-1 bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <button onClick={addTitleKeyword} className="px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors">
              <Plus size={14} />
            </button>
          </div>
          {titleKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {titleKeywords.map(kw => (
                <span key={kw} className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  {kw}
                  <button onClick={() => setTitleKeywords(k => k.filter(x => x !== kw))} className="opacity-60 hover:opacity-100">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h1 className="text-3xl font-serif text-gray-900 mb-1.5">Research Depth</h1>
      <p className="text-gray-500 mb-8 text-sm">Choose how thoroughly the Research Agent investigates each qualified lead before personalisation begins.</p>
      <div className="space-y-4">
        {RESEARCH_DEPTHS.map(opt => {
          const sel = researchDepth === opt.id;
          return (
            <div key={opt.id} onClick={() => setResearchDepth(opt.id)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${sel ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className={`text-base font-bold ${sel ? 'text-white' : 'text-gray-900'}`}>{opt.label}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sel ? 'bg-white/20 text-white' : opt.speedColor}`}>{opt.speed}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-mono ${sel ? 'text-gray-400' : 'text-gray-400'}`}>{opt.time}</span>
                  {sel && <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0"><Check size={11} className="text-gray-900" strokeWidth={3} /></div>}
                </div>
              </div>
              <p className={`text-sm mb-3 leading-relaxed ${sel ? 'text-gray-300' : 'text-gray-500'}`}>{opt.desc}</p>
              <div className="flex flex-wrap gap-2">
                {opt.channels.map(ch => (
                  <span key={ch} className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg ${sel ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{ch}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h1 className="text-3xl font-serif text-gray-900 mb-1.5">Personalisation Framework</h1>
      <p className="text-gray-500 mb-8 text-sm">Choose the copywriting framework your Personalisation Agent will use to write outreach messages.</p>
      <div className="grid grid-cols-2 gap-4 mb-7">
        {FRAMEWORKS.map(fw => {
          const sel = framework === fw.id;
          return (
            <div key={fw.id} onClick={() => setFramework(fw.id)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${sel ? 'border-gray-900 bg-gray-900 shadow-xl' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`text-xs font-black tracking-wider px-2.5 py-1 rounded-lg ${sel ? 'bg-white/10 text-white' : VIZ_COLORS[fw.color]}`}>{fw.label}</span>
                </div>
                {sel && <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center"><Check size={10} className="text-gray-900" strokeWidth={3} /></div>}
              </div>
              <p className={`text-[11px] font-semibold mt-2 mb-1 ${sel ? 'text-gray-300' : 'text-gray-500'}`}>{fw.full}</p>
              <p className={`text-xs leading-relaxed ${sel ? 'text-gray-400' : 'text-gray-400'}`}>{fw.desc}</p>
            </div>
          );
        })}
      </div>
      {framework === 'custom' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Available Placeholders</p>
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map(ph => (
                <span key={ph} onClick={() => setCustomBody(b => b + ph)}
                  className="text-[10px] font-mono bg-white border border-gray-300 text-gray-600 px-2 py-1 rounded cursor-pointer hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all">
                  {ph}
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 block">Email Subject Line</label>
            <input value={customSubject} onChange={e => setCustomSubject(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 block">Email Body Template</label>
            <textarea value={customBody} onChange={e => setCustomBody(e.target.value)} rows={8}
              className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono resize-none" />
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div>
      <h1 className="text-3xl font-serif text-gray-900 mb-1.5">Outbound Channels</h1>
      <p className="text-gray-500 mb-8 text-sm">Select channels and configure sender accounts. Gmail native is the most reliable for cold email deliverability.</p>
      <div className="space-y-4">
        {CHANNELS.map(ch => {
          const sel = channels.includes(ch.id);
          const Logo = ch.logo;
          return (
            <div key={ch.id} className="space-y-0">
              <div className={`flex items-center gap-5 p-5 bg-white rounded-2xl border-2 transition-all ${ sel && ch.id === 'gmail' ? 'border-gray-900 shadow-md rounded-b-none border-b-0' : sel ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                {Logo ? <Logo /> : null}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-gray-900 text-sm">{ch.label}</h3>
                    {ch.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ch.badgeColor}`}>
                        {ch.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{ch.sub}</p>
                </div>
                <button
                  onClick={() => toggle(channels, ch.id, setChannels)}
                  className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border transition-all ${ sel ? 'bg-gray-900 text-white border-gray-900 hover:bg-black' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400' }`}
                >
                  {sel ? <React.Fragment><Check size={12} strokeWidth={3} /> Connected</React.Fragment> : <React.Fragment>Connect</React.Fragment>}
                </button>
              </div>

              {sel && ch.id === 'gmail' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gray-50 border-2 border-t-0 border-gray-900 rounded-b-2xl overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                        Sender Accounts
                      </p>
                    </div>

                    {gmailAccounts.length > 0 && (
                      <div className="space-y-1.5">
                        {gmailAccounts.map((acc) => (
                          <div key={acc.email} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
                            <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                              <Mail size={13} className="text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-800 flex-1 truncate">{acc.email}</span>
                            <button
                              onClick={() => setGmailAccounts(a => a.filter(x => x.email !== acc.email))}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <input
                        type="email"
                        value={gmailEmailInput}
                        onChange={e => setGmailEmailInput(e.target.value)}
                        placeholder="sender@gmail.com"
                        className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showGmailPassword ? 'text' : 'password'}
                            value={gmailPasswordInput}
                            onChange={e => setGmailPasswordInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addGmailAccount()}
                            placeholder="App Password (16 chars)"
                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-4 pr-10 text-sm font-mono text-gray-700 placeholder:text-gray-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        </div>
                        <button
                          onClick={addGmailAccount}
                          disabled={!gmailEmailInput || !gmailPasswordInput}
                          className="px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-40"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={handleLaunch}
          disabled={channels.length === 0 || isLaunching}
          className="px-14 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg active:scale-95 text-base disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
        >
          {isLaunching ? 'Launching Campaign...' : 'Launch Outbound Engine ->'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-8 pt-8 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
              <Zap size={14} className="text-rose-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">Outbound Engine</h2>
              <p className="text-[10px] text-gray-400 font-medium">Campaign Setup</p>
            </div>
          </div>
        </div>
        <div className="flex-1 px-8 py-6 space-y-5 overflow-y-auto">
          {STEPS.map((s, idx) => {
            const isActive = step === idx;
            const isDone = step > idx;
            return (
              <div key={idx} className="relative flex items-center gap-3">
                {STEPS.length - 1 > idx && (
                  <div className={`absolute top-7 left-[11px] w-0.5 h-7 transition-colors ${isDone ? 'bg-rose-400' : 'bg-gray-200'}`} />
                )}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 z-10 transition-colors ${isDone ? 'bg-rose-500 border-rose-500' : isActive ? 'bg-white border-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.12)]' : 'bg-white border-gray-200'}`}>
                  {isDone ? <Check size={12} className="text-white" strokeWidth={3} /> : <span className={`text-[10px] font-bold ${isActive ? 'text-rose-500' : 'text-gray-400'}`}>{idx + 1}</span>}
                </div>
                <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-rose-600' : isDone ? 'text-gray-700' : 'text-gray-400'}`}>{s}</span>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-12 py-12">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
                {step === 0 && renderStep0()}
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
                {step === 5 && renderStep5()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {STEPS.length - 1 > step && (
          <div className="shrink-0 h-[72px] border-t border-gray-200 bg-white flex items-center justify-between px-12 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
            <button onClick={() => setStep(p => Math.max(p - 1, 0))} className={`font-semibold text-sm px-6 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}>Back</button>
            <div className="flex items-center gap-2">
              {STEPS.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-rose-500' : i < step ? 'w-2 bg-rose-300' : 'w-2 bg-gray-200'}`} />)}
            </div>
            <button onClick={() => setStep(p => Math.min(p + 1, STEPS.length - 1))} className="font-semibold text-sm px-8 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors shadow-sm">Continue &rarr;</button>
          </div>
        )}
      </main>
    </div>
  );
}
