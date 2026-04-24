'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Paperclip,
  Send,
  Sparkles,
  Terminal,
  User,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { AzmethLogo } from '@/components/ui/AzmethLogo';
import { NAV_GROUPS, Sidebar } from '@/components/layout/Sidebar';
import CommandCenterPage from '../command-center/page';
import OutboundEnginePage from '../outbound/page';
import LiveInboxPage from '../inbox/page';
import SystemsHubPage from '../systems/page';
import BuilderPage from '../builder/page';
import AIEmployeesPage from '../employees/page';
import LeadsCRMPage from '../leads/page';
import MonitoringPage from '../monitoring/page';
import LibraryPage from '../library/page';
import AnalyticsPage from '../analytics/page';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  trace?: AgentTraceEvent[];
  requiresInput?: PendingInputRequest | null;
}

interface ParsedBlock {
  type: 'text' | 'nav';
  content: string;
  navUrl?: string;
  navLabel?: string;
}

interface AgentTraceEvent {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'clarification' | 'final';
  iteration: number;
  tool?: string;
  status?: string;
  summary?: string;
  question?: string;
}

interface PendingInputRequest {
  key: string;
  label: string;
  question: string;
  sensitive?: boolean;
  expected_format?: string;
  reason?: string;
  source_tool?: string;
}

interface ExecutionItem {
  id: string;
  title: string;
  detail: string;
  state: 'done' | 'active' | 'pending';
}

interface WorkspaceSurface {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  href: string;
  status: 'live' | 'attention' | 'building';
  owner: string;
  metrics: string[];
  capabilities: string[];
}

type FocusMode = 'combined' | 'assistant' | 'workspace';

const THINKING_PHRASES = [
  'Mapping active workspace systems...',
  'Assigning specialist lanes...',
  'Reading operator context and memory...',
  'Preparing Builder handoff...',
  'Watching trace health and blockers...',
  'Composing the next safe action...',
];

const WORKSPACE_SURFACES: WorkspaceSurface[] = [
  {
    id: 'command-center',
    label: 'Command Center',
    title: 'Unified command surface for growth, systems, and run health.',
    subtitle: 'High-level operating map across the whole Azmeth workspace.',
    href: '/dashboard/command-center',
    status: 'live',
    owner: 'Azmeth Orchestrator',
    metrics: ['3 systems live', '14 active threads', '2 queued approvals'],
    capabilities: ['Run diagnostics', 'Route system work', 'Open operating reports'],
  },
  {
    id: 'outbound',
    label: 'Outbound Engine',
    title: 'Campaign execution, lead flow, enrichment, and send operations.',
    subtitle: 'This is where Azmeth should build and supervise outbound machinery.',
    href: '/dashboard/outbound',
    status: 'attention',
    owner: 'Growth Systems',
    metrics: ['847 leads', '3 active campaigns', '1 blocked scraper'],
    capabilities: ['Create campaigns', 'Repair scraping', 'Tune sequencing'],
  },
  {
    id: 'inbox',
    label: 'Live Inbox',
    title: 'Realtime message control, approvals, and human handoff.',
    subtitle: 'Azmeth should be able to operate this directly and ask for approval only when needed.',
    href: '/dashboard/inbox',
    status: 'live',
    owner: 'Setter Agent',
    metrics: ['14 open threads', '2 approvals waiting', '1 escalation needed'],
    capabilities: ['Draft replies', 'Escalate cases', 'Toggle agent control'],
  },
  {
    id: 'systems',
    label: 'Systems',
    title: 'Operational inventory of all active internal engines and subagents.',
    subtitle: 'The best place to inspect what Azmeth can control across the app.',
    href: '/dashboard/systems',
    status: 'building',
    owner: 'Infrastructure',
    metrics: ['6 registered systems', '2 subagents paused', '4 connectors healthy'],
    capabilities: ['Inspect runtimes', 'Restart lanes', 'Attach tools and MCP'],
  },
  {
    id: 'builder',
    label: 'Builder',
    title: 'Where Builder-owned code and system generation should be directed by Azmeth.',
    subtitle: 'Builder is the execution engine, not the product brain.',
    href: '/dashboard/builder',
    status: 'building',
    owner: 'Builder Runtime',
    metrics: ['4 agent drafts', '1 live model profile', '0 queued publishes'],
    capabilities: ['Ship prompt configs', 'Generate system scaffolds', 'Publish agent changes'],
  },
];

const SURFACE_STATUS_META: Record<
  WorkspaceSurface['status'],
  { label: string; dot: string; badge: string }
> = {
  live: {
    label: 'Live',
    dot: 'bg-emerald-500',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  attention: {
    label: 'Needs attention',
    dot: 'bg-amber-500',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  building: {
    label: 'Building',
    dot: 'bg-blue-500',
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
  },
};

const APP_SIDEBAR_ITEMS = NAV_GROUPS.flatMap((group) =>
  group.items.filter((item) => item.href !== '/dashboard/agent'),
);

function parseMessage(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const regex = /\[NAV:(.*?)\|(.*?)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    blocks.push({
      type: 'nav',
      content: match[0],
      navUrl: match[1],
      navLabel: match[2],
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    blocks.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return blocks;
}

function AnimatedThinking() {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % THINKING_PHRASES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2 rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="animate-pulse text-emerald-300" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Azmeth is orchestrating
        </span>
      </div>
      <motion.div
        key={phraseIdx}
        initial={{ opacity: 0, filter: 'blur(4px)', y: 2 }}
        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-sm text-white/85"
      >
        {THINKING_PHRASES[phraseIdx]}
      </motion.div>
    </div>
  );
}

function SidebarToggleIcon() {
  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      <span className="absolute inset-0 rounded-[4px] border border-current opacity-90" />
      <span className="absolute bottom-[2px] left-[2px] top-[2px] w-[5px] rounded-[2px] bg-current opacity-20" />
      <span className="absolute bottom-[2px] left-1/2 top-[2px] w-px -translate-x-1/2 bg-current opacity-80" />
    </span>
  );
}

export default function AzmethAgentDashboard() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useClaudeEngine, setUseClaudeEngine] = useState(true);
  const [latestInstruction, setLatestInstruction] = useState('');
  const [pendingInput, setPendingInput] = useState<PendingInputRequest | null>(null);
  const [runtimeSecrets, setRuntimeSecrets] = useState<Record<string, string>>({});
  const [activeSurfaceId, setActiveSurfaceId] = useState(WORKSPACE_SURFACES[0].id);
  const [workspaceHref, setWorkspaceHref] = useState(WORKSPACE_SURFACES[0].href);
  const [focusMode, setFocusMode] = useState<FocusMode>('combined');
  const [expandedExecutionId, setExpandedExecutionId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const focus = params.get('focus');
    const pane = params.get('pane');

    if (focus === 'assistant' || focus === 'workspace') {
      setFocusMode(focus);
      return;
    }

    if (pane === 'workspace') {
      setFocusMode('workspace');
    } else if (pane === 'monitor') {
      setFocusMode('assistant');
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            "Azmeth is online. This workspace is the live operating surface for your app, your systems, and Builder. Tell me what to build, repair, or operate.",
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages.length]);

  const activeSurface =
    WORKSPACE_SURFACES.find((surface) => surface.id === activeSurfaceId) ?? WORKSPACE_SURFACES[0];

  const setWorkspaceRoute = (href: string) => {
    setWorkspaceHref(href);
    const matchedSurface = WORKSPACE_SURFACES.find((surface) => surface.href === href);
    if (matchedSurface) {
      setActiveSurfaceId(matchedSurface.id);
    }
  };

  const openSurfaceWindow = () => {
    window.open(workspaceHref, '_blank', 'noopener,noreferrer');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const sizeKb = Math.max(1, Math.round(file.size / 1024));
      const header = `[Attached file: ${file.name} • ${sizeKb}KB]`;
      let attachmentBlock = header;

      const lowerName = file.name.toLowerCase();
      const canReadAsText =
        file.type.startsWith('text/') ||
        file.type === 'application/json' ||
        lowerName.endsWith('.md') ||
        lowerName.endsWith('.txt') ||
        lowerName.endsWith('.json') ||
        lowerName.endsWith('.csv');

      if (canReadAsText) {
        const raw = await file.text();
        const normalized = raw.replace(/\u0000/g, '').trim();
        if (normalized) {
          const excerpt = normalized.slice(0, 4000);
          attachmentBlock = `${header}\n\n${excerpt}${normalized.length > excerpt.length ? '\n\n[Truncated for chat context]' : ''}`;
        }
      } else {
        attachmentBlock = `${header}\n\nBinary file attached. Summarize what to do with this file and I will proceed step-by-step.`;
      }

      setInput((prev) => (prev.trim() ? `${prev.trim()}\n\n${attachmentBlock}` : attachmentBlock));
      toast.success('File attached to workspace prompt');
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err) {
      console.error(err);
      toast.error('Could not read that file');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e?: React.FormEvent, overridingInput?: string) => {
    e?.preventDefault();

    const submittedText = (overridingInput || input).trim();
    if (!submittedText || isLoading) return;
    setLatestInstruction(submittedText);

    const activePendingInput = pendingInput;
    const isSensitiveReply = Boolean(activePendingInput?.sensitive);
    const visibleUserText = isSensitiveReply
      ? `[Secure input provided: ${activePendingInput?.label || 'Sensitive Value'}]`
      : submittedText;
    const modelUserText = isSensitiveReply
      ? `Secure value provided for ${activePendingInput?.label || activePendingInput?.key || 'requested input'}. Continue from the blocked step.`
      : submittedText;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: visibleUserText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const runtimeInputPayload = activePendingInput
        ? {
            key: activePendingInput.key,
            value: submittedText,
            sensitive: activePendingInput.sensitive,
          }
        : null;

      const nextRuntimeSecrets = runtimeInputPayload
        ? { ...runtimeSecrets, [runtimeInputPayload.key]: runtimeInputPayload.value }
        : runtimeSecrets;

      if (runtimeInputPayload) {
        setRuntimeSecrets(nextRuntimeSecrets);
        setPendingInput(null);
      }

      if (useClaudeEngine) {
        const res = await fetch('/api/claude-engine/sessions/default-session/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: modelUserText }),
        });

        if (!res.ok) throw new Error('Failed to fetch from Claude Engine');
        if (!res.body) throw new Error('No response body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        const botMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            trace: [],
          },
        ]);

        let botText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

          for (const line of lines) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'assistant' && data.message?.content) {
                if (typeof data.message.content === 'string') {
                  botText += data.message.content;

                  if (botText.includes('Tool use: ') || botText.includes('Executing tool:')) {
                    const traceMsg: AgentTraceEvent = {
                      type: 'tool_call',
                      iteration: 1,
                      tool: 'Builder lane',
                      summary: 'Executing scoped task...',
                    };
                    setMessages((prev) =>
                      prev.map((message) =>
                        message.id === botMsgId && !message.trace?.length
                          ? { ...message, trace: [traceMsg] }
                          : message,
                      ),
                    );
                  }
                } else if (Array.isArray(data.message.content)) {
                  let textParts = '';
                  const traces: AgentTraceEvent[] = [];

                  for (const block of data.message.content) {
                    if (block.type === 'text') textParts += block.text;
                    if (block.type === 'tool_use') {
                      traces.push({
                        type: 'tool_call',
                        iteration: 1,
                        tool: block.name,
                        summary: JSON.stringify(block.input),
                      });
                    }
                  }

                  if (textParts) botText += textParts;
                  if (traces.length > 0) {
                    setMessages((prev) =>
                      prev.map((message) =>
                        message.id === botMsgId
                          ? { ...message, trace: [...(message.trace || []), ...traces] }
                          : message,
                      ),
                    );
                  }
                }

                setMessages((prev) =>
                  prev.map((message) =>
                    message.id === botMsgId ? { ...message, content: botText } : message,
                  ),
                );
              }
            } catch (error) {
              console.error(error);
            }
          }
        }
      } else {
        const chatHistory = messages
          .filter((message) => message.id !== 'welcome')
          .map((message) => ({
            role: message.role,
            text: message.content,
          }));

        chatHistory.push({ role: 'user', text: modelUserText });

        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: chatHistory,
            runtime_input: runtimeInputPayload || undefined,
            runtime_secrets: nextRuntimeSecrets,
            context: {
              workspace_id:
                WORKSPACE_SURFACES.find((surface) => surface.href === workspaceHref)?.id ||
                `route:${workspaceHref}`,
              workspace_route: workspaceHref,
              workspace_label:
                APP_SIDEBAR_ITEMS.find((item) => item.href === workspaceHref)?.label || activeSurface.label,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch response');

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.text || 'I encountered an error processing your request.',
          timestamp: new Date(),
          trace: Array.isArray(data.events) ? data.events : undefined,
          requiresInput: data.requires_input || null,
        };

        setMessages((prev) => [...prev, botMsg]);
        setPendingInput(data.requires_input || null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Agent execution failed');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const inputPlaceholder = pendingInput
    ? `Required input: ${pendingInput.label}${pendingInput.sensitive ? ' (secret)' : ''}`
    : `Tell Azmeth what to build or operate in ${
        APP_SIDEBAR_ITEMS.find((item) => item.href === workspaceHref)?.label || activeSurface.label
      }...`;

  const workspaceVisible = focusMode !== 'assistant';
  const agentVisible = focusMode !== 'workspace';
  const liveSurfaceHref = workspaceHref;
  const chatPaneWidth = 360;

  const [liveSurfacePath, liveSurfaceQuery] = liveSurfaceHref.split('?');
  const liveSurfaceParams = new URLSearchParams(liveSurfaceQuery || '');
  const leadSourceParam = liveSurfaceParams.get('source');
  const leadSource =
    leadSourceParam === 'inbound' || leadSourceParam === 'outbound' ? leadSourceParam : undefined;

  const handleWorkspaceClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const target = event.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest('a') as HTMLAnchorElement | null;
    if (!anchor) return;

    const hrefAttr = anchor.getAttribute('href');
    if (!hrefAttr) return;
    if (anchor.getAttribute('target') === '_blank') return;
    if (hrefAttr.startsWith('#') || hrefAttr.startsWith('mailto:') || hrefAttr.startsWith('tel:')) return;
    if (!hrefAttr.startsWith('/dashboard')) return;

    event.preventDefault();
    setWorkspaceRoute(hrefAttr);
  };

  const renderWorkspaceSurface = () => {
    switch (liveSurfacePath) {
      case '/dashboard/command-center':
        return <CommandCenterPage />;
      case '/dashboard/outbound':
        return <OutboundEnginePage />;
      case '/dashboard/inbox':
        return <LiveInboxPage />;
      case '/dashboard/systems':
        return <SystemsHubPage />;
      case '/dashboard/builder':
        return <BuilderPage />;
      case '/dashboard/employees':
        return <AIEmployeesPage />;
      case '/dashboard/leads':
        return <LeadsCRMPage initialSource={leadSource} />;
      case '/dashboard/monitoring':
        return <MonitoringPage />;
      case '/dashboard/library':
        return <LibraryPage />;
      case '/dashboard/analytics':
        return <AnalyticsPage />;
      case '/dashboard/sandbox':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-semibold text-gray-900">App Window</h1>
            <p className="mt-2 max-w-xl text-sm text-gray-600">
              This right-side window is the live app surface. Use the toggle next to Builder to collapse the agent chat
              and give the app full focus.
            </p>
          </div>
        );
      default:
        return (
          <div className="p-8">
            <h1 className="text-2xl font-semibold text-gray-900">Surface Not Available</h1>
            <p className="mt-2 max-w-xl text-sm text-gray-600">
              This surface is not wired into the workspace view yet.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => window.open(liveSurfaceHref, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
              >
                <ExternalLink size={14} />
                Open In New Tab
              </button>
            </div>
          </div>
        );
    }
  };

  const latestExecutionTrace =
    [...messages]
      .reverse()
      .find((message) => message.role === 'assistant' && message.trace && message.trace.length)?.trace ?? [];

  const executionItems: ExecutionItem[] =
    latestExecutionTrace.length > 0
      ? latestExecutionTrace.slice(-5).map((trace, index, list) => ({
          id: `trace-${index}-${trace.type}`,
          title:
            trace.type === 'tool_call'
              ? `Running ${trace.tool || 'tool'}`
              : trace.type === 'tool_result'
                ? `Completed ${trace.tool || 'tool'}`
                : trace.type === 'clarification'
                  ? 'Waiting for user input'
                  : trace.type === 'final'
                    ? 'Finalizing response'
                    : 'Planning next step',
          detail: trace.summary || trace.status || trace.question || 'Processing',
          state:
            index === list.length - 1
              ? isLoading
                ? 'active'
                : trace.type === 'final' || trace.type === 'tool_result'
                  ? 'done'
                  : 'active'
              : 'done',
        }))
      : isLoading
        ? THINKING_PHRASES.slice(0, 4).map((phrase, idx) => ({
            id: `thinking-${idx}`,
            title: phrase,
            detail: 'Executing in Azmeth harness',
            state: idx === 0 ? 'active' : 'pending',
          }))
        : [];

  return (
    <div className="h-full overflow-hidden bg-[#0b0b0b] p-2 sm:p-3">
      <div className="h-full rounded-[36px] bg-[#0b0b0b] p-[1px] shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
        <div
          className="flex h-full overflow-hidden rounded-[35px] border border-[#1f1f1f] bg-[#141414] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        >
        {agentVisible && (
          <aside
            style={workspaceVisible ? { width: `${chatPaneWidth}px` } : undefined}
            className={`${workspaceVisible ? '' : 'w-full'} flex min-h-0 shrink-0 flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,#101010_0%,#171717_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-[width] duration-300`}
          >
            <div className="border-b border-white/10 bg-white/[0.02] px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <AzmethLogo
                    size="md"
                    variant="icon"
                    className="shrink-0 drop-shadow-[0_14px_28px_rgba(0,0,0,0.4)]"
                  />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/45">
                      AZMETH
                    </p>
                    <p className="text-base font-semibold text-white">Agent Console</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {workspaceVisible && (
                    <button
                      onClick={() => setFocusMode('workspace')}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                        'border-white/10 bg-white/[0.05] text-white/72 hover:bg-white/[0.08]'
                      }`}
                      title="Hide agent"
                    >
                      <SidebarToggleIcon />
                    </button>
                  )}
                  <button
                    onClick={() => setUseClaudeEngine((prev) => !prev)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                      useClaudeEngine
                        ? 'border-white/10 bg-white text-[#111111] shadow-[0_12px_22px_rgba(0,0,0,0.22)]'
                        : 'border-white/10 bg-white/[0.05] text-white/72'
                    }`}
                  >
                    <Terminal size={11} />
                    {useClaudeEngine ? 'Builder' : 'Local'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                {executionItems.length > 0 && (
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        Task Execution
                      </p>
                      <div className="text-[10px] text-white/35">{executionItems.length} steps</div>
                    </div>

                    <div className="space-y-2">
                      {executionItems.map((item, index) => (
                        <motion.button
                          type="button"
                          key={item.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, delay: index * 0.04 }}
                          onClick={() =>
                            setExpandedExecutionId((prev) => (prev === item.id ? null : item.id))
                          }
                          className="w-full rounded-[18px] border border-white/10 bg-black/20 px-3 py-2.5 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                                item.state === 'done'
                                  ? 'bg-emerald-400/15 text-emerald-300'
                                  : item.state === 'active'
                                    ? 'bg-blue-400/15 text-blue-300'
                                    : 'bg-white/10 text-white/50'
                              }`}
                            >
                              {item.state === 'done' ? (
                                <CheckCircle2 size={11} />
                              ) : item.state === 'active' ? (
                                <Activity size={11} className="animate-pulse" />
                              ) : (
                                <ChevronRight size={11} />
                              )}
                            </div>
                            <span className="flex-1 text-sm text-white/88">{item.title}</span>
                            {expandedExecutionId === item.id ? (
                              <ChevronDown size={13} className="text-white/40" />
                            ) : (
                              <ChevronRight size={13} className="text-white/40" />
                            )}
                          </div>

                          {expandedExecutionId === item.id && (
                            <div className="mt-2 border-l border-white/10 pl-7 text-xs leading-5 text-white/55">
                              {item.detail}
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => {
                  const isBot = message.role === 'assistant';
                  const blocks = parseMessage(message.content);

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${isBot ? '' : 'flex-row-reverse'}`}
                    >
                      <div
                        className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${
                          isBot
                            ? 'border-white/10 bg-white/[0.06] text-emerald-300'
                            : 'border-white/25 bg-white text-[#111111]'
                        }`}
                      >
                        {isBot ? <Sparkles size={13} /> : <User size={13} />}
                      </div>

                      <div className={`flex max-w-[88%] flex-col gap-1.5 ${isBot ? 'items-start' : 'items-end'}`}>
                        <div
                          className={`rounded-2xl border px-3.5 py-2.5 text-[14px] leading-6 ${
                            isBot
                              ? 'border-white/10 bg-white/[0.05] text-white/82'
                              : 'border-white bg-white text-[#111111] shadow-[0_16px_28px_rgba(0,0,0,0.18)]'
                          }`}
                        >
                          {blocks.map((block, index) => {
                            if (block.type === 'text') {
                              return (
                                <span key={index} className="whitespace-pre-wrap">
                                  {block.content}
                                </span>
                              );
                            }

                            return (
                              <button
                                key={index}
                                onClick={() => router.push(block.navUrl!)}
                                className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left transition-colors hover:bg-black/30"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-white">{block.navLabel}</p>
                                  <p className="mt-1 text-[11px] text-white/45">{block.navUrl}</p>
                                </div>
                                <ArrowRight size={14} className="text-white/45" />
                              </button>
                            );
                          })}
                        </div>

                        <span className="text-[10px] font-medium text-white/30">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

                {isLoading && <AnimatedThinking />}

                <div ref={bottomRef} className="h-2" />
              </div>
            </div>

            <div className="border-t border-white/10 bg-black/10 px-4 py-3">
              {pendingInput && (
                <div className="mb-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                    Clarification needed
                  </p>
                  <p className="mt-1 text-sm text-amber-50">{pendingInput.question}</p>
                </div>
              )}

              <form onSubmit={(e) => handleSubmit(e)} className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/60 transition-colors hover:bg-white/[0.08]"
                >
                  <Paperclip size={15} />
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                </button>

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={inputPlaceholder}
                  rows={1}
                  className="min-h-[72px] w-full resize-none rounded-[22px] border border-white/10 bg-white/[0.04] py-4 pl-14 pr-14 text-[15px] text-white placeholder:text-white/35 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#111111] transition-colors hover:bg-[#f1f1f1] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </form>
            </div>
          </aside>
        )}

        {workspaceVisible && (
          <section className={`${agentVisible ? 'ml-2.5 min-w-0 flex-1' : 'w-full'} relative flex min-h-0 flex-col rounded-[26px] border border-[#dad6cc] bg-[#fbfaf7] shadow-[0_24px_52px_rgba(0,0,0,0.15)]`}>
            {!agentVisible && (
              <button
                type="button"
                onClick={() => setFocusMode('combined')}
                title="Show agent"
                className="absolute left-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[#1a1a1a] shadow-[0_12px_26px_rgba(0,0,0,0.12)] backdrop-blur hover:bg-white"
              >
                <SidebarToggleIcon />
              </button>
            )}
            <div className="min-h-0 flex-1 p-3.5">
              <div className="flex h-full min-h-[420px] overflow-hidden rounded-[24px] border border-[#dfdacf] bg-white shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
                <Sidebar
                  hideWorkspaceEntry
                  hideBrand
                  hideFooter
                  activeHref={liveSurfaceHref}
                  onNavigate={setWorkspaceRoute}
                />
                <div
                  className="az-compact-ui min-w-0 flex-1 overflow-hidden bg-[#f7f8fa]"
                  onClickCapture={handleWorkspaceClickCapture}
                >
                  {renderWorkspaceSurface()}
                </div>
              </div>
            </div>
          </section>
        )}
        </div>
      </div>
    </div>
  );
}
