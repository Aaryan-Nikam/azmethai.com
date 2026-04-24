'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Camera, Hash, Mail, Link2, Phone,
  MoreHorizontal, Bot, X, Send, Paperclip, RefreshCw, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Channel = 'instagram' | 'whatsapp' | 'email' | 'linkedin' | 'voice';
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'meeting_set' | 'disqualified';

interface ChatLead {
  lead_id: string;
  channel: Channel;
  sender_name: string;
  sender_contact: string;
  latest_score: number;
  last_intent: string | null;
  paused: boolean;
  last_seen: string;
  status: LeadStatus;
  agent_name: string;
  starred: boolean;
  company_name: string | null;
  role_title: string | null;
  lastMessage?: string;
}

interface ChatMessage {
  id: number;
  session_id: string;
  message: { type: 'human' | 'ai'; content: string };
}

// ─── Config Maps ───────────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<Channel, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  instagram: { icon: Camera,  color: 'text-pink-500',   bg: 'bg-pink-50',   label: 'Instagram' },
  whatsapp:  { icon: Hash,    color: 'text-green-600',  bg: 'bg-green-50',  label: 'WhatsApp' },
  email:     { icon: Mail,    color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'Email' },
  linkedin:  { icon: Link2,   color: 'text-blue-700',   bg: 'bg-blue-50',   label: 'LinkedIn' },
  voice:     { icon: Phone,   color: 'text-purple-500', bg: 'bg-purple-50', label: 'Voice' },
};

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; dot: string }> = {
  new:           { label: 'New',         color: 'text-gray-600 bg-gray-50 border-gray-200',       dot: 'bg-gray-400' },
  contacted:     { label: 'Active',      color: 'text-green-700 bg-green-50 border-green-200',    dot: 'bg-green-500' },
  qualified:     { label: 'Qualified',   color: 'text-blue-700 bg-blue-50 border-blue-200',       dot: 'bg-blue-500' },
  meeting_set:   { label: 'Booked ✓',   color: 'text-purple-700 bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  disqualified:  { label: 'Closed',      color: 'text-gray-400 bg-gray-50 border-gray-200',       dot: 'bg-gray-300' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayName(lead: ChatLead): string {
  if (lead.sender_name?.trim()) return lead.sender_name;
  if (lead.sender_contact) return `#${lead.sender_contact.slice(-6)}`;
  return lead.lead_id.split('_').slice(1).join('_').slice(-8) || 'Unknown';
}

function avatarBg(channel: Channel): string {
  return channel === 'instagram' ? 'bg-gradient-to-br from-pink-400 to-purple-500'
    : channel === 'whatsapp' ? 'bg-green-500'
    : channel === 'email' ? 'bg-blue-500'
    : channel === 'linkedin' ? 'bg-blue-700'
    : 'bg-gray-700';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: Channel }) {
  const cfg = CHANNEL_CONFIG[channel];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${cfg.bg}`}>
      <Icon size={11} className={cfg.color} />
      <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'contacted' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LiveInboxPage() {
  const [threads, setThreads] = useState<ChatLead[]>([]);
  const [activeThread, setActiveThread] = useState<ChatLead | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [filter, setFilter] = useState<'all' | LeadStatus>('all');
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [agentControl, setAgentControl] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch all threads ──────────────────────────────────────────────────────
  const fetchThreads = useCallback(async () => {
    try {
      setLoadingThreads(true);
      const res = await fetch('/api/inbox');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setThreads(data.threads as ChatLead[]);
      // Auto-select first thread
      if (data.threads.length > 0 && !activeThread) {
        setActiveThread(data.threads[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inbox');
    } finally {
      setLoadingThreads(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  // ── Fetch messages for selected thread ────────────────────────────────────
  useEffect(() => {
    if (!activeThread) return;
    setLoadingMessages(true);
    setMessages([]);
    fetch(`/api/inbox/messages?lead_id=${encodeURIComponent(activeThread.lead_id)}`)
      .then(r => r.json())
      .then(data => setMessages(data.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
    // Sync agent control with paused state
    setAgentControl(!activeThread.paused);
  }, [activeThread?.lead_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Listen for real-time messages ──────────────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel('inbox_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'n8n_chat_histories' },
        (payload) => {
          // If the message belongs to activeThread, append it
          if (activeThread && payload.new.session_id === activeThread.lead_id) {
            setMessages(p => [...p, payload.new as ChatMessage]);
          }
          // Fetch threads to update last messages in sidebar
          fetchThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThread, fetchThreads]);

  // ── Toggle agent control (pauses/resumes AI) ──────────────────────────────
  const toggleAgentControl = async (on: boolean) => {
    setAgentControl(on);
    if (!activeThread) return;
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: activeThread.lead_id, paused: !on }),
    });
  };

  // ── Send manual reply ─────────────────────────────────────────────────────
  const sendReply = async () => {
    if (!replyText.trim() || !activeThread || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: activeThread.lead_id, text: replyText.trim() }),
      });
      if (!res.ok) throw new Error('Send failed');
      // Optimistic update
      setMessages(p => [...p, {
        id: Date.now(),
        session_id: activeThread.lead_id,
        message: { type: 'human', content: replyText.trim() },
      }]);
      setReplyText('');
    } catch {
      // fail silently — message persisted server-side
    } finally {
      setSending(false);
    }
  };

  // ── Filtered thread list ───────────────────────────────────────────────────
  const filtered = threads.filter(t => {
    const name = displayName(t).toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || t.lead_id.includes(search.toLowerCase());
    const matchFilter = filter === 'all' || t.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex h-full bg-gray-50 font-sans overflow-hidden">

      {/* ── THREAD LIST ── */}
      <aside className="w-80 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
        <div className="px-4 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Live Inbox</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${threads.filter(t => t.status === 'contacted').length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-500 font-medium">
                {threads.filter(t => t.status === 'contacted').length} active
              </span>
              <button onClick={fetchThreads} className="p-1 hover:bg-gray-100 rounded-lg" title="Refresh">
                <RefreshCw size={12} className="text-gray-400" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200" />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto border-b border-gray-100">
          {(['all', 'contacted', 'qualified', 'meeting_set'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize
                ${filter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
              {f === 'all' ? 'All' : f === 'contacted' ? 'Active' : f === 'meeting_set' ? 'Booked' : 'Qualified'}
            </button>
          ))}
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {error && (
            <div className="flex items-center gap-2 p-4 text-xs text-red-600">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          {loadingThreads ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3.5 flex items-start gap-3">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            ))
          ) : filtered.map(thread => (
            <button key={thread.lead_id} onClick={() => setActiveThread(thread)}
              className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors relative
                ${activeThread?.lead_id === thread.lead_id ? 'bg-gray-50 border-l-2 border-l-gray-900' : 'border-l-2 border-l-transparent'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white ${avatarBg(thread.channel)}`}>
                  {displayName(thread)[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName(thread)}</p>
                    <span className="text-[10px] text-gray-400 font-medium shrink-0 ml-2">{relativeTime(thread.last_seen)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <ChannelBadge channel={thread.channel} />
                    <StatusBadge status={thread.status} />
                  </div>
                  <p className="text-xs text-gray-500 truncate">{thread.lastMessage || 'No messages yet'}</p>
                </div>
              </div>
            </button>
          ))}
          {!loadingThreads && filtered.length === 0 && !error && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-xs font-medium">No conversations found</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── CONVERSATION VIEW ── */}
      {activeThread ? (
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Convo Header */}
          <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-5 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${avatarBg(activeThread.channel)}`}>
                {displayName(activeThread)[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{displayName(activeThread)}</p>
                <p className="text-[11px] text-gray-400">{activeThread.lead_id}</p>
              </div>
              <ChannelBadge channel={activeThread.channel} />
              <StatusBadge status={activeThread.status} />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => toggleAgentControl(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                    ${agentControl ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Bot size={12} /> Agent
                </button>
                <button onClick={() => toggleAgentControl(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                    ${!agentControl ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  Manual
                </button>
              </div>
              <button
                onClick={async () => {
                  if (!activeThread) return;
                  const newStatus = 'meeting_set' as const;
                  await fetch('/api/leads', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lead_id: activeThread.lead_id, status: newStatus }),
                  });
                  setThreads(p => p.map(t => t.lead_id === activeThread.lead_id ? { ...t, status: newStatus } : t));
                  setActiveThread({ ...activeThread, status: newStatus });
                }}
                disabled={activeThread.status === 'meeting_set'}
                className="text-xs font-semibold bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {activeThread.status === 'meeting_set' ? '✓ Meeting Booked' : 'Book Meeting'}
              </button>
              <MoreHorizontal size={16} className="text-gray-400 cursor-pointer hover:text-gray-700" />
            </div>
          </div>

          {/* Agent status bar */}
          {agentControl && (
            <div className="bg-blue-50 border-b border-blue-100 px-5 py-2 flex items-center gap-2">
              <Bot size={13} className="text-blue-600" />
              <span className="text-xs text-blue-700 font-semibold">{activeThread.agent_name || 'SDR Alpha'} is managing this conversation.</span>
              <button onClick={() => toggleAgentControl(false)} className="ml-auto text-xs text-blue-500 hover:text-blue-700 font-semibold">
                Take Control →
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-[#f8f9fb]">
            {loadingMessages ? (
              <div className="flex justify-center pt-8">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center pt-12 text-xs text-gray-400">No messages in this conversation yet.</div>
            ) : messages.map((m, i) => {
              const isAgent = m.message.type === 'ai';
              return (
                <div key={m.id ?? i} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                  {isAgent && (
                    <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center shrink-0 mr-2.5 mt-0.5">
                      <Bot size={13} className="text-white" />
                    </div>
                  )}
                  <div className="max-w-[65%]">
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                      ${isAgent
                        ? 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                        : 'bg-gray-900 text-white rounded-br-sm'}`}>
                      {m.message.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Area */}
          <div className="border-t border-gray-200 bg-white px-5 py-3.5 shrink-0">
            {!agentControl ? (
              <div className="flex gap-3 items-end">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Write a reply… (Enter to send, Shift+Enter for new line)" rows={2}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 resize-none" />
                <div className="flex flex-col gap-2 relative">
                  <input type="file" id="attach_inbox" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setSending(true);
                    try {
                      // Attempt to upload; requires chat-attachments bucket to exist
                      const { data, error } = await supabase.storage.from('chat-attachments').upload(`inbox/${Date.now()}_${file.name}`, file);
                      if (error) throw error;
                      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(data.path);
                      setReplyText(prev => prev + (prev ? '\n' : '') + `[Attachment: ${publicUrl}]`);
                    } catch (err: any) {
                      setReplyText(prev => prev + `\n[Error attaching: ${err.message}]`);
                    } finally {
                      setSending(false);
                      e.target.value = ''; // Reset input to allow re-upload
                    }
                  }} />
                  <button onClick={() => document.getElementById('attach_inbox')?.click()} disabled={sending} className="p-2.5 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50">
                    <Paperclip size={15} />
                  </button>
                  <button onClick={sendReply} disabled={sending || !replyText.trim()}
                    className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40">
                    <Send size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-1">
                <Bot size={16} className="text-blue-500" />
                <p className="text-sm text-gray-500"><span className="font-semibold text-gray-700">{activeThread.agent_name || 'SDR Alpha'}</span> is composing a reply…</p>
                <div className="flex gap-1 ml-1">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <button onClick={() => toggleAgentControl(false)} className="ml-auto text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                  Override & Type Manually
                </button>
              </div>
            )}
          </div>
        </main>
      ) : (
        <main className="flex-1 flex items-center justify-center bg-[#f8f9fb] text-gray-400">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Bot size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium">Select a conversation</p>
            <p className="text-xs mt-1">Choose a thread from the left to view messages</p>
          </div>
        </main>
      )}

      {/* ── LEAD DETAIL PANEL ── */}
      {activeThread && (
        <aside className="w-64 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Lead Details</p>
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold text-white ${avatarBg(activeThread.channel)}`}>
                {displayName(activeThread)[0]?.toUpperCase() || '?'}
              </div>
              <p className="text-sm font-bold text-gray-900">{displayName(activeThread)}</p>
              <p className="text-xs text-gray-400">{activeThread.sender_contact || activeThread.lead_id}</p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {[
              { label: 'Channel', value: CHANNEL_CONFIG[activeThread.channel]?.label || activeThread.channel },
              { label: 'Agent', value: activeThread.agent_name || 'SDR Alpha' },
              { label: 'Status', value: STATUS_CONFIG[activeThread.status]?.label || activeThread.status },
              { label: 'Intent Score', value: activeThread.latest_score ? `${activeThread.latest_score}/100` : 'N/A' },
              { label: 'Last Intent', value: activeThread.last_intent || 'Unknown' },
              { label: 'Company', value: activeThread.company_name || '—' },
              { label: 'Role', value: activeThread.role_title || '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-gray-50">
                <span className="text-[11px] text-gray-400 font-medium">{row.label}</span>
                <span className="text-[11px] font-semibold text-gray-900 text-right max-w-[60%] truncate">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 space-y-2 mt-auto">
            <button
              onClick={async () => {
                if (!activeThread) return;
                const newStatus = 'meeting_set' as const;
                await fetch('/api/leads', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ lead_id: activeThread.lead_id, status: newStatus }),
                });
                setThreads(p => p.map(t => t.lead_id === activeThread.lead_id ? { ...t, status: newStatus } : t));
                setActiveThread({ ...activeThread, status: newStatus });
              }}
              disabled={activeThread.status === 'meeting_set'}
              className="w-full py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {activeThread.status === 'meeting_set' ? '✓ Meeting Booked' : 'Book Meeting'}
            </button>
            <button
              onClick={async () => {
                const newStatus: 'qualified' = 'qualified';
                await fetch('/api/leads', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ lead_id: activeThread.lead_id, status: newStatus }),
                });
                setThreads(p => p.map(t => t.lead_id === activeThread.lead_id ? { ...t, status: newStatus } : t));
                setActiveThread({ ...activeThread, status: newStatus });
              }}
              className="w-full py-2.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors">
              Mark Qualified
            </button>
            <button
              onClick={async () => {
                await fetch('/api/leads', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ lead_id: activeThread.lead_id, status: 'disqualified' }),
                });
                setThreads(p => p.map(t => t.lead_id === activeThread.lead_id ? { ...t, status: 'disqualified' } : t));
                setActiveThread({ ...activeThread, status: 'disqualified' });
              }}
              className="w-full py-2.5 border border-red-100 text-red-500 text-xs font-bold rounded-xl hover:bg-red-50 transition-colors">
              Mark Unqualified
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
