'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus, Search, Code, ChevronDown, ChevronUp,
  Cpu, Wrench, BarChart2, Shield, Settings,
  MoreVertical, Copy, Zap, Save, Blocks,
  Check, X, MessageSquare, Phone,
  GitBranch, Target, Send,
  ArrowUpRight, RefreshCw,
  Hash, Mail, Link2, Camera, TrendingUp, Clock
} from 'lucide-react';

// ─── Static Data ─────────────────────────────────────────────────────────────

const AGENTS = [
  { id: '1', name: 'SDR Alpha', channels: ['ig', 'wa', 'email'], model: 'gpt-4o', status: 'active' },
  { id: '2', name: 'Email Setter', channels: ['email'], model: 'claude-3-5', status: 'active' },
  { id: '3', name: 'LinkedIn Connector', channels: ['linkedin'], model: 'gpt-4o', status: 'paused' },
];

const DEFAULT_SYSTEM_PROMPT = "You are an aggressive and empathic outbound setter for [Company]. Your primary mission is to qualify prospect intent and book a confirmed calendar meeting. You never break character and always steer the conversation toward a specific call to action.";
const DEFAULT_OPENING_MESSAGE = "Hi {{first_name}}, I came across your profile and thought I'd reach out — we help teams like yours 2x their outbound without adding headcount. Got 15 mins this week?";

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  ig: <Camera size={12} className="text-pink-500" />,
  wa: <Hash size={12} className="text-green-600" />,
  email: <Mail size={12} className="text-blue-500" />,
  linkedin: <Link2 size={12} className="text-blue-700" />,
};

const NAV = [
  { id: 'model',     icon: Cpu,   label: 'Model' },
  { id: 'persona',   icon: Target,         label: 'Persona' },
  { id: 'channels',  icon: Send,           label: 'Channels' },
  { id: 'sequence',  icon: GitBranch,      label: 'Sequence' },
  { id: 'tools',     icon: Wrench,         label: 'Tools' },
  { id: 'workflows', icon: RefreshCw,      label: 'Workflows' },
  { id: 'analysis',  icon: BarChart2,      label: 'Analysis' },
  { id: 'compliance',icon: Shield,         label: 'Compliance' },
  { id: 'advanced',  icon: Settings,       label: 'Advanced' },
];

const TOOLS_LIST = [
  { id: 'calendar', name: 'checkCalendarAvailability', type: 'CRM', desc: 'Queries open slots via CRM API' },
  { id: 'webhook', name: 'triggerWebhook', type: 'HTTP', desc: 'Posts payload to any endpoint' },
  { id: 'crm-lookup', name: 'CRM_LookupContact', type: 'CRM', desc: 'Pulls lead data from HubSpot/Salesforce' },
  { id: 'sms', name: 'SMS_SendMessage', type: 'Comm', desc: 'Sends SMS via Twilio' },
  { id: 'email-send', name: 'Email_Send', type: 'Comm', desc: 'Sends email via Instantly/SMTP' },
  { id: 'enrich', name: 'Lead_Enrich', type: 'Data', desc: 'Enriches lead profile via Apollo/Clay' },
];

const WORKFLOWS_LIST = [
  { id: 'inbound', name: 'Inbound Lead Routing', desc: 'Score → Route → CRM queue', tags: ['CRM', 'Routing'] },
  { id: 'cold-email', name: 'Cold Outreach Pipeline', desc: 'Sequence → Parse replies → Book', tags: ['Email', 'Booking'] },
  { id: 'noshow', name: 'No-Show Recovery', desc: 'Detect → SMS + Email reschedule', tags: ['SMS', 'Email'] },
  { id: 'followup', name: '5-Touch Follow-Up', desc: 'Multi-channel nurture cadence', tags: ['Multichannel'] },
];

const PERSONA_STYLES = [
  { id: 'aggressive', label: 'Aggressive Closer', icon: '⚡', desc: 'Urgency-driven, deal-first' },
  { id: 'consultative', label: 'Consultative Advisor', icon: '🎯', desc: 'Question-led, empathetic' },
  { id: 'technical', label: 'Technical Expert', icon: '🔬', desc: 'Data-backed, credibility-first' },
  { id: 'friendly', label: 'Friendly Connector', icon: '😊', desc: 'Rapport-based, casual tone' },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`w-10 h-5 rounded-full relative transition-colors duration-200 focus:outline-none shrink-0 ${checked ? 'bg-gray-900' : 'bg-gray-200'}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${checked ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{children}</label>;
}

function Select({ children, defaultValue }: { children: React.ReactNode; defaultValue?: string }) {
  return (
    <select defaultValue={defaultValue}
      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none cursor-pointer">
      {children}
    </select>
  );
}

function SectionDivider({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-6 pb-2">
      <Icon size={12} className="text-gray-400" />
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function AccordionCard({
  title, subtitle, defaultOpen = false, children
}: {
  title: string; subtitle: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/70 transition-colors text-left group"
        onClick={() => setOpen(!open)}>
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        {open
          ? <ChevronUp size={15} className="text-gray-400 group-hover:text-gray-600 shrink-0" />
          : <ChevronDown size={15} className="text-gray-400 group-hover:text-gray-600 shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-gray-100 space-y-4">{children}</div>}
    </Card>
  );
}

// ─── Simulator Panel ──────────────────────────────────────────────────────────

function SimulatorPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState([
    { role: 'agent', text: 'Hi, I\'m SDR Alpha. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || typing) return;
    setMessages(p => [...p, { role: 'user', text: input }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages(p => [...p, { role: 'agent', text: 'I understand your interest! Could I ask — what\'s your current biggest challenge with outbound sales? That will help me see how we can best assist.' }]);
      setTyping(false);
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 w-[360px] h-[520px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-700">Simulation Mode</span>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">SDR Alpha</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-md transition-colors text-gray-500"><X size={14} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'agent' && (
              <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shrink-0 mt-0.5 mr-2">
                <Cpu size={12} className="text-white" />
              </div>
            )}
            <div className={`max-w-[78%] text-sm px-3.5 py-2.5 rounded-2xl leading-relaxed
              ${m.role === 'user' ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm border border-gray-200'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                <Cpu size={12} className="text-white" />
              </div>
            <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 shrink-0">
        <form onSubmit={send} className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="Simulate a prospect reply…"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
          />
          <button type="submit" className="px-3 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors">
            <Send size={14} />
          </button>
        </form>
        <p className="text-[10px] text-gray-400 text-center mt-2">Simulating SDR Alpha · No credits used</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AgentConfigDashboardInner() {
  const [agents, setAgents] = useState(AGENTS);
  const [activeAgentId, setActiveAgentId] = useState(AGENTS[0]?.id ?? '');
  const [activeNav, setActiveNav] = useState('model');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>(['calendar', 'crm-lookup']);
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>(['inbound']);
  const [selectedPersona, setSelectedPersona] = useState('aggressive');
  const [toolSearch, setToolSearch] = useState('');
  const [wfSearch, setWfSearch] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [openingMessageTemplate, setOpeningMessageTemplate] = useState(DEFAULT_OPENING_MESSAGE);
  const [toolCatalog, setToolCatalog] = useState(TOOLS_LIST);
  const [workflowCatalog, setWorkflowCatalog] = useState(WORKFLOWS_LIST);
  const [subagents, setSubagents] = useState(['Qualifier Agent', 'Closer Agent', 'Objection Handler']);

  const searchParams = useSearchParams();
  const router = useRouter();
  const activeAgent = agents.find(a => a.id === activeAgentId) ?? agents[0];

  useEffect(() => {
    const connected = searchParams?.get('connected');
    if (connected === 'instagram' || connected === 'facebook') {
      toast.success('Meta Ecosystem Synced Successfully!', {
        description: 'Webhook pipeline is active. AI can now respond to direct messages.'
      });
      // Optionally clean the URL so it doesn't toast every refresh
      router.replace('/dashboard/builder');
    }
  }, [searchParams, router]);

  // Toggles
  const [toggles, setToggles] = useState({
    tcpa: true, dnc: true, sendWindow: true, rateLimit: true,
    leadScoring: true, sentimentAnalysis: true, callSummary: false,
    multiAgentRouting: false, humanHandoff: true,
  });
  const setToggle = (k: keyof typeof toggles) => setToggles(p => ({ ...p, [k]: !p[k] }));

  // ── DB Config Sync ─────────────────────────────────────────────────────────
  const [agentDbId, setAgentDbId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/agent');
      const { config } = await res.json();
      if (config) {
        setAgentDbId(config.id);
        if (config.brand_voice) setSelectedPersona(config.brand_voice);
      }
    } catch { /* fail silently; form defaults stay */ }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const publishAgent = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/agent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: agentDbId,
          brand_voice: selectedPersona,
          primary_goal: activeAgent?.name || 'Azmeth Agent',
          model_provider: 'openai',
          model_version: 'gpt-4o-mini',
          llm_billing_mode: 'trial',
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('saved');
      toast.success('Agent config published successfully');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('idle');
      toast.error('Failed to save agent config. Please try again.');
    }
  };

  const toggleTool = (id: string) => setSelectedTools(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleWf = (id: string) => setSelectedWorkflows(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAgentChannel = (channelId: string) => {
    if (!activeAgent) return;
    setAgents(prev => prev.map(agent => {
      if (agent.id !== activeAgent.id) return agent;
      const hasChannel = agent.channels.includes(channelId);
      return {
        ...agent,
        channels: hasChannel ? agent.channels.filter(c => c !== channelId) : [...agent.channels, channelId],
      };
    }));
  };

  const copyToClipboard = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error('Clipboard access is blocked in this browser session');
    }
  };

  const handleNewAgent = () => {
    const name = window.prompt('Name for the new agent');
    if (!name?.trim()) return;
    const clean = name.trim();
    const id = `${Date.now()}`;
    const newAgent = { id, name: clean, channels: [] as string[], model: 'gpt-4o-mini', status: 'active' as const };
    setAgents(prev => [newAgent, ...prev]);
    setActiveAgentId(id);
    toast.success('New agent created');
  };

  const handleGeneratePrompt = () => {
    if (!activeAgent) return;
    const persona = PERSONA_STYLES.find(p => p.id === selectedPersona)?.label || 'Sales Setter';
    const workflowNames = workflowCatalog.filter(wf => selectedWorkflows.includes(wf.id)).map(wf => wf.name);
    const toolNames = toolCatalog.filter(tool => selectedTools.includes(tool.id)).map(tool => tool.name);
    setSystemPrompt(
      [
        `You are ${activeAgent.name}, an AI ${persona}.`,
        'Goal: qualify intent and book a confirmed calendar meeting without over-promising.',
        `Enabled workflows: ${workflowNames.length > 0 ? workflowNames.join(', ') : 'none'}.`,
        `Enabled tools: ${toolNames.length > 0 ? toolNames.join(', ') : 'none'}.`,
        'Always ask concise follow-up questions when required context is missing.',
      ].join('\n')
    );
    toast.success('System prompt generated from current setup');
  };

  const handleCreateTool = () => {
    const name = window.prompt('Tool function name (for example: CRM_FindLead)');
    if (!name?.trim()) return;
    const type = window.prompt('Tool category (CRM, HTTP, Comm, Data)', 'HTTP') || 'HTTP';
    const desc = window.prompt('Short description of what this tool does', 'Custom tool');
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!id) return;
    if (toolCatalog.some(tool => tool.id === id)) {
      toast.error('A tool with that name already exists');
      return;
    }
    const newTool = { id, name: name.trim(), type: type.trim() || 'HTTP', desc: desc?.trim() || 'Custom tool' };
    setToolCatalog(prev => [newTool, ...prev]);
    setSelectedTools(prev => prev.includes(id) ? prev : [id, ...prev]);
    toast.success('Tool created');
  };

  const handleCreateWorkflow = () => {
    const name = window.prompt('Workflow name');
    if (!name?.trim()) return;
    const desc = window.prompt('Workflow description', 'Custom workflow');
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!id) return;
    if (workflowCatalog.some(wf => wf.id === id)) {
      toast.error('A workflow with that name already exists');
      return;
    }
    const newWorkflow = { id, name: name.trim(), desc: desc?.trim() || 'Custom workflow', tags: ['Custom'] };
    setWorkflowCatalog(prev => [newWorkflow, ...prev]);
    setSelectedWorkflows(prev => prev.includes(id) ? prev : [id, ...prev]);
    toast.success('Workflow created');
  };

  const handleConfigureSubagent = (name: string) => {
    toast.info(`${name} configuration editor will open in a dedicated panel next`);
  };

  const handleAddSubagent = () => {
    const name = window.prompt('Subagent name');
    if (!name?.trim()) return;
    const clean = name.trim();
    if (subagents.some(agent => agent.toLowerCase() === clean.toLowerCase())) {
      toast.error('Subagent already exists');
      return;
    }
    setSubagents(prev => [...prev, clean]);
    toast.success('Subagent added');
  };

  const exportAgentConfig = async () => {
    if (!activeAgent) return;
    const payload = {
      agent: activeAgent,
      persona: selectedPersona,
      tools: selectedTools,
      workflows: selectedWorkflows,
      systemPrompt,
      openingMessageTemplate,
      advancedMode,
      toggles,
    };
    await copyToClipboard(JSON.stringify(payload, null, 2), 'Agent configuration copied to clipboard');
  };

  const scrollTo = (id: string) => {
    setActiveNav(id);
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(agentSearch.toLowerCase())
  );

  const filteredTools = toolCatalog.filter(t =>
    t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
    t.type.toLowerCase().includes(toolSearch.toLowerCase())
  );
  const filteredWf = workflowCatalog.filter(w =>
    w.name.toLowerCase().includes(wfSearch.toLowerCase())
  );

  return (
    <div className="flex bg-gray-50 h-full font-sans overflow-hidden">

      {/* ── AGENTS SIDEBAR ── */}
      <aside className="w-60 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-900">Agents <span className="text-gray-400 font-normal text-xs ml-1">{agents.length}</span></span>
          </div>
          <button onClick={handleNewAgent} className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
            <Plus size={13} /> New Agent
          </button>
        </div>

        <div className="px-3 py-2">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search agents…" value={agentSearch} onChange={e => setAgentSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredAgents.map(a => (
            <button key={a.id} onClick={() => setActiveAgentId(a.id)}
              className={`w-full text-left px-4 py-3 border-l-2 transition-all
                ${a.id === activeAgent?.id ? 'bg-gray-50 border-l-gray-900' : 'border-l-transparent hover:bg-gray-50/60'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">{a.name}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${a.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
              <div className="flex items-center gap-1.5">
                {a.channels.map(ch => <span key={ch}>{CHANNEL_ICONS[ch]}</span>)}
                <span className="text-[10px] text-gray-400 font-mono ml-1">{a.model}</span>
              </div>
            </button>
          ))}
          {filteredAgents.length === 0 && (
            <p className="px-4 py-6 text-xs text-gray-400 text-center">No agents match your search.</p>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* HEADER */}
        <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-5 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Blocks size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">{activeAgent?.name || 'Untitled Agent'}</h1>
              <button
                onClick={() => copyToClipboard(`agent_${activeAgent?.id || 'unknown'}`, 'Agent ID copied')}
                className="text-[10px] text-gray-400 font-mono flex items-center gap-1 cursor-pointer hover:text-gray-600"
              >
                {`agent_${activeAgent?.id || 'unknown'}`} <Copy size={8} />
              </button>
            </div>

            {/* Inline metrics pills */}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                <TrendingUp size={11} className="text-green-500" />
                <span className="text-[11px] font-semibold text-gray-700">Conv. Rate <span className="text-green-600">14.2%</span></span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                <Clock size={11} className="text-blue-500" />
                <span className="text-[11px] font-semibold text-gray-700">Avg. Reply <span className="text-blue-600">4.2s</span></span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                <span className="text-[11px] font-semibold text-gray-700">Cost <span className="text-gray-900">$0.003</span><span className="text-gray-400">/msg</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Basic / Advanced */}
            <div className="flex items-center p-0.5 bg-gray-100 rounded-lg mr-1">
              {['Basic', 'Advanced'].map(m => (
                <button key={m} onClick={() => setAdvancedMode(m === 'Advanced')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                    ${advancedMode === (m === 'Advanced') ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                  {m}
                </button>
              ))}
            </div>

            <button onClick={() => setShowSim(!showSim)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all border
                ${showSim ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>
              <MessageSquare size={13} /> Simulate
            </button>
            <button onClick={exportAgentConfig} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
              <Code size={14} />
            </button>
            <button onClick={publishAgent} disabled={saveStatus === 'saving'}
              className={`flex items-center gap-1.5 px-4 py-1.5 font-semibold rounded-lg hover:bg-gray-800 transition-colors text-xs shadow-sm disabled:opacity-60
                ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-gray-900 text-white'}`}>
              <Save size={12} />
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : 'Publish'}
            </button>
            <MoreVertical size={14} className="text-gray-400 cursor-pointer hover:text-gray-700" />
          </div>
        </header>

        {/* NAV ANCHOR BAR */}
        <div className="border-b border-gray-200 bg-white px-5 flex items-center gap-0.5 shrink-0 overflow-x-auto">
          {NAV.filter(n => advancedMode || !['workflows', 'compliance', 'advanced'].includes(n.id) || n.id === 'tools').map(item => (
            <button key={item.id} onClick={() => scrollTo(item.id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-[11px] font-semibold border-b-2 whitespace-nowrap transition-colors
                ${activeNav === item.id ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>
              <item.icon size={12} />
              {item.label}
              {item.id === 'advanced' && advancedMode && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />}
            </button>
          ))}
          {!advancedMode && NAV.filter(n => ['workflows', 'compliance', 'advanced'].includes(n.id)).map(item => (
            <button key={item.id} onClick={() => setAdvancedMode(true)}
              className="flex items-center gap-1.5 px-3 py-3 text-[11px] font-semibold border-b-2 border-transparent text-gray-300 hover:text-gray-500 whitespace-nowrap transition-colors">
              <item.icon size={12} /> {item.label}
              <span className="text-[9px] bg-gray-100 text-gray-400 px-1 py-0.5 rounded ml-1">Adv.</span>
            </button>
          ))}
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 pb-20">

          {/* ── MODEL ── */}
          <div id="sec-model">
            <SectionDivider icon={Cpu} label="Model" />
            <AccordionCard title="Language Model" subtitle="Configure the LLM powering this agent's reasoning." defaultOpen>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Provider</Label>
                  <Select><option>OpenAI</option><option>Anthropic</option><option>Groq</option></Select>
                </div>
                <div><Label>Model</Label>
                  <Select><option>gpt-4o</option><option>gpt-4-turbo</option><option>claude-3-5-sonnet</option><option>llama-3.1-70b</option></Select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>System Prompt</Label>
                  <button onClick={handleGeneratePrompt} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors">
                    <Zap size={10} /> Generate
                  </button>
                </div>
                <textarea rows={6} value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none leading-relaxed"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Max Tokens</Label>
                  <input type="number" defaultValue={512}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <Label>Temperature</Label>
                    <span className="text-[11px] text-gray-400 font-mono">0.7</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full accent-gray-900 mt-2" />
                  <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                    <span>Precise</span><span>Creative</span>
                  </div>
                </div>
              </div>
            </AccordionCard>

            <div className="mt-3">
              <AccordionCard title="Opening Message" subtitle="The first message sent when initiating a conversation.">
                <Label>Channel Type</Label>
                <Select><option>Text / Async (WhatsApp, DM, Email)</option><option>Voice (Vapi Call)</option></Select>
                <div className="mt-4">
                  <Label>Opening Message Template</Label>
                  <textarea rows={3} value={openingMessageTemplate} onChange={e => setOpeningMessageTemplate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Use {'{{first_name}}'}, {'{{company}}'}, {'{{pain_point}}'} as dynamic variables.</p>
                </div>
              </AccordionCard>
            </div>
          </div>

          {/* ── PERSONA ── */}
          <div id="sec-persona">
            <SectionDivider icon={Target} label="Persona & Behavior" />
            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-900 mb-1">Communication Style</p>
              <p className="text-xs text-gray-400 mb-4">Select the behavioral archetype that defines how this agent engages prospects.</p>
              <div className="grid grid-cols-2 gap-3">
                {PERSONA_STYLES.map(p => (
                  <div key={p.id} onClick={() => setSelectedPersona(p.id)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all
                      ${selectedPersona === p.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div className="text-xl mb-1.5">{p.icon}</div>
                    <p className={`text-sm font-bold mb-0.5 ${selectedPersona === p.id ? 'text-white' : 'text-gray-900'}`}>{p.label}</p>
                    <p className={`text-xs ${selectedPersona === p.id ? 'text-gray-300' : 'text-gray-400'}`}>{p.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Behavior Tuning</p>
                {[
                  { label: 'Use objection handling scripts', k: 'humanHandoff' },
                  { label: 'Enable follow-up nudges', k: 'leadScoring' },
                  { label: 'Human handoff on escalation', k: 'sentimentAnalysis' },
                ].map(row => (
                  <div key={row.k} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{row.label}</span>
                    <Toggle checked={toggles[row.k as keyof typeof toggles]} onChange={() => setToggle(row.k as keyof typeof toggles)} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── CHANNELS ── */}
          <div id="sec-channels">
            <SectionDivider icon={Send} label="Active Channels" />
            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-900 mb-1">Channel Configuration</p>
              <p className="text-xs text-gray-400 mb-4">Define what channels this agent is allowed to operate and message through.</p>
              <div className="space-y-3">
                {[
                  { id: 'ig', icon: Camera, label: 'Instagram DMs', sub: 'Meta Business API', color: 'text-pink-500' },
                  { id: 'wa', icon: Hash, label: 'WhatsApp Business', sub: 'WhatsApp Business API', color: 'text-green-600' },
                  { id: 'email', icon: Mail, label: 'Email (Instantly)', sub: 'Cold outreach sequences', color: 'text-blue-500' },
                  { id: 'linkedin', icon: Link2, label: 'LinkedIn', sub: 'Connection + DM outreach', color: 'text-blue-700' },
                  { id: 'voice', icon: Phone, label: 'Voice (Vapi)', sub: 'AI-powered outbound calling', color: 'text-purple-500' },
                ].map((ch) => (
                  <div key={ch.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <ch.icon size={16} className={ch.color} />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{ch.label}</p>
                        <p className="text-xs text-gray-400">{ch.sub}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          if (ch.id === 'ig' || ch.id === 'wa') {
                            const platform = ch.id === 'wa' ? 'whatsapp' : 'instagram';
                            window.location.href = `/api/auth/meta/connect?platform=${platform}&userId=${agentDbId || 'anon'}&source=config`;
                          } else if (ch.id === 'email') {
                            router.push('/dashboard/systems/outbound-engine');
                          } else if (ch.id === 'linkedin') {
                            router.push('/dashboard/integrations');
                          } else {
                            toast.info('Voice connector setup opens in the next release');
                          }
                        }}
                        className="text-xs text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1 transition-colors"
                      >
                        Configure <ArrowUpRight size={10} />
                      </button>
                      <Toggle checked={Boolean(activeAgent?.channels.includes(ch.id))} onChange={() => toggleAgentChannel(ch.id)} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── SEQUENCE ── */}
          <div id="sec-sequence">
            <SectionDivider icon={GitBranch} label="Outreach Sequence" />
            <AccordionCard title="Cadence & Follow-up Logic" subtitle="Configure timing, delays, and multi-touch sequence behavior." defaultOpen>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Follow-ups</Label>
                  <input type="number" defaultValue={5}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <Label>Delay Between Touches</Label>
                  <Select><option>24 hours</option><option>48 hours</option><option>72 hours</option><option>Custom</option></Select>
                </div>
              </div>
              <div>
                <Label>Sequence Strategy</Label>
                <Select><option>Multi-channel (IG → Email → LinkedIn)</option><option>Email-first</option><option>DM-first</option><option>Voice-first</option></Select>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Stop sequence on reply', k: 'humanHandoff' },
                  { label: 'Auto-qualify before booking', k: 'leadScoring' },
                  { label: 'Skip weekends', k: 'sendWindow' },
                ].map(row => (
                  <div key={row.k} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700">{row.label}</span>
                    <Toggle checked={toggles[row.k as keyof typeof toggles]} onChange={() => setToggle(row.k as keyof typeof toggles)} />
                  </div>
                ))}
              </div>
            </AccordionCard>
          </div>

          {/* ── TOOLS ── */}
          <div id="sec-tools">
            <SectionDivider icon={Wrench} label="Tools & Functions" />
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Connected Tools</p>
                  <p className="text-xs text-gray-400">Functions and webhooks available to the agent during execution.</p>
                </div>
                <button onClick={handleCreateTool} className="text-xs font-semibold bg-gray-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-800">
                  <Plus size={12} /> Create Tool
                </button>
              </div>
              <div className="relative mb-3">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search tools…" value={toolSearch} onChange={e => setToolSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200" />
              </div>
              <div className="space-y-2">
                {filteredTools.map(tool => {
                  const active = selectedTools.includes(tool.id);
                  return (
                    <div key={tool.id} onClick={() => toggleTool(tool.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                        ${active ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border
                          ${active ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                          {tool.type}
                        </span>
                        <div>
                          <p className="text-sm font-mono font-semibold text-gray-900">{tool.name}</p>
                          <p className="text-xs text-gray-400">{tool.desc}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all
                        ${active ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                        {active && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
                {filteredTools.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">No tools found.</p>
                )}
              </div>
            </Card>
          </div>

          {/* ── WORKFLOWS (Advanced) ── */}
          {advancedMode && (
            <div id="sec-workflows">
              <SectionDivider icon={RefreshCw} label="Workflows" />
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Active Workflows</p>
                    <p className="text-xs text-gray-400">Orchestration patterns that govern multi-step agent behavior.</p>
                  </div>
                  <button onClick={handleCreateWorkflow} className="text-xs font-semibold border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-50">
                    <Plus size={12} /> Custom Workflow
                  </button>
                </div>
                <div className="relative mb-3">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search workflows…" value={wfSearch} onChange={e => setWfSearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-gray-400" />
                </div>
                <div className="space-y-2">
                  {filteredWf.map(wf => {
                    const active = selectedWorkflows.includes(wf.id);
                    return (
                      <div key={wf.id} onClick={() => toggleWf(wf.id)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all
                          ${active ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                        <div>
                          <p className={`text-sm font-bold ${active ? 'text-purple-900' : 'text-gray-900'}`}>{wf.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{wf.desc}</p>
                          <div className="flex gap-1 mt-1.5">
                            {wf.tags.map(t => (
                              <span key={t} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border
                                ${active ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>{t}</span>
                            ))}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all
                          ${active ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                          {active && <Check size={11} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                  {filteredWf.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3">No workflows found.</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ── ANALYSIS ── */}
          <div id="sec-analysis">
            <SectionDivider icon={BarChart2} label="Analysis & Monitoring" />
            <Card className="p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-900">Structured Output Extraction</p>
              <p className="text-xs text-gray-400">Automatically extract structured data from every conversation for reporting.</p>
              {[
                { label: 'Lead Intent Scoring', desc: 'Rate 1–10 based on engagement signals', k: 'leadScoring' },
                { label: 'Sentiment Analysis', desc: 'Track positive / neutral / negative tone shifts', k: 'sentimentAnalysis' },
                { label: 'Call / Chat Summaries', desc: 'Auto-generate CRM-ready conversation notes', k: 'callSummary' },
              ].map(row => (
                 <div key={row.k} className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{row.label}</p>
                    <p className="text-xs text-gray-400">{row.desc}</p>
                  </div>
                  <Toggle checked={toggles[row.k as keyof typeof toggles]} onChange={() => setToggle(row.k as keyof typeof toggles)} />
                </div>
              ))}
            </Card>
          </div>

          {/* ── COMPLIANCE (Advanced) ── */}
          {advancedMode && (
            <div id="sec-compliance">
              <SectionDivider icon={Shield} label="Compliance & Safety" />
              <Card className="p-5 space-y-3">
                {[
                  { label: 'TCPA Compliance', desc: 'Enforce calling hours + consent verification', k: 'tcpa' },
                  { label: 'DNC List Scrubbing', desc: 'Auto-check Do Not Contact registry before outreach', k: 'dnc' },
                  { label: 'Send Window Enforcement', desc: 'Restrict outreach to Mon–Fri 9am–6pm (recipient timezone)', k: 'sendWindow' },
                  { label: 'Daily Rate Limiting', desc: 'Cap at 500 outbound touches per domain per day', k: 'rateLimit' },
                ].map(row => (
                  <div key={row.k} className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{row.label}</p>
                      <p className="text-xs text-gray-400">{row.desc}</p>
                    </div>
                    <Toggle checked={toggles[row.k as keyof typeof toggles]} onChange={() => setToggle(row.k as keyof typeof toggles)} />
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* ── ADVANCED ── */}
          {advancedMode && (
            <div id="sec-advanced">
              <SectionDivider icon={Settings} label="Advanced" />
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Multi-Agent Routing</p>
                    <p className="text-xs text-gray-400">Enable a Lead Agent to automatically delegate tasks to specialized subagents.</p>
                  </div>
                  <Toggle checked={toggles.multiAgentRouting} onChange={() => setToggle('multiAgentRouting')} />
                </div>
                {toggles.multiAgentRouting && (
                  <div className="space-y-2 pt-2">
                    {subagents.map(agent => (
                      <div key={agent} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                        <span className="text-sm font-semibold text-gray-900">{agent}</span>
                        <button onClick={() => handleConfigureSubagent(agent)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                          Configure
                        </button>
                      </div>
                    ))}
                    <button onClick={handleAddSubagent} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 p-1 transition-colors">
                      <Plus size={13} /> Add Subagent
                    </button>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100">
                  <Label>Webhook Server URL</Label>
                  <input type="text" placeholder="https://your-server.com/agent-events"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  <p className="text-[10px] text-gray-400 mt-1">Receives real-time event callbacks (message_sent, lead_booked, escalation).</p>
                </div>
                <div>
                  <Label>Memory Store</Label>
                  <Select><option>In-session only (default)</option><option>Persistent (Supabase)</option><option>External (Redis / Pinecone)</option></Select>
                </div>
              </Card>
            </div>
          )}

          <div className="h-10" />
        </div>
      </main>

      {/* ── FLOATING SIMULATOR ── */}
      {showSim && <SimulatorPanel onClose={() => setShowSim(false)} />}

    </div>
  );
}

export default function AgentConfigDashboard() {
  return (
    <React.Suspense fallback={<div className="h-full w-full bg-gray-50 animate-pulse" />}>
      <AgentConfigDashboardInner />
    </React.Suspense>
  );
}
