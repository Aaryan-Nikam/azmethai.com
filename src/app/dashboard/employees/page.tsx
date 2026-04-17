'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bot, Search, RefreshCw, Settings, ExternalLink,
  Zap, MessageSquare, Users, AlertCircle, CheckCircle2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SalesAgent {
  id: string;
  business_name: string | null;
  model_version: string;
  model_provider: string;
  brand_voice: string;
  primary_goal: string;
  system_prompt: string | null;
  temperature: number;
  max_tokens: number;
  llm_billing_mode: string;
  created_at?: string;
  updated_at?: string;
}

interface AgentStats {
  totalLeads: number;
  activeLeads: number;
  meetings: number;
  qualified: number;
  channels: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function modelBadgeColor(model: string): string {
  if (model.includes('gpt-4o')) return 'bg-green-50 text-green-700 border-green-200';
  if (model.includes('gpt-4')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (model.includes('kimi') || model.includes('k2')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (model.includes('claude')) return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-gray-50 text-gray-600 border-gray-200';
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({ agent, stats }: { agent: SalesAgent; stats: AgentStats }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{agent.business_name || 'Unnamed Agent'}</h3>
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">AI Sales Agent</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-600 font-semibold">Online</span>
          </div>
        </div>

        {/* Model badge */}
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${modelBadgeColor(agent.model_version)}`}>
          <Zap size={10} />
          {agent.model_version}
        </span>
        {agent.brand_voice && (
          <span className="ml-2 inline-flex text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
            {agent.brand_voice}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Leads', val: stats.totalLeads, color: 'text-gray-900' },
            { label: 'Active', val: stats.activeLeads, color: 'text-green-700' },
            { label: 'Qualified', val: stats.qualified, color: 'text-blue-700' },
            { label: 'Meetings', val: stats.meetings, color: 'text-purple-700' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-3 text-center">
              <p className={`text-base font-bold tabular-nums ${s.color}`}>{s.val}</p>
              <p className="text-[9px] text-gray-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Goal */}
      {agent.primary_goal && (
        <div className="px-5 pb-4">
          <p className="text-[11px] text-gray-400 font-medium mb-1 uppercase tracking-wide">Primary Goal</p>
          <p className="text-xs text-gray-600 line-clamp-2">{agent.primary_goal}</p>
        </div>
      )}

      {/* Channels */}
      {stats.channels.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-[11px] text-gray-400 font-medium mb-2 uppercase tracking-wide">Active Channels</p>
          <div className="flex flex-wrap gap-1.5">
            {stats.channels.map(ch => (
              <span key={ch} className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full capitalize">
                {ch}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span className="font-medium">{agent.model_provider}</span>
          <span>·</span>
          <span>temp {agent.temperature}</span>
          <span>·</span>
          <span>{agent.max_tokens.toLocaleString()} tokens</span>
        </div>
        <Link href="/dashboard/systems/ai-setter"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
          <Settings size={12} /> Configure
        </Link>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 border border-dashed border-gray-200 rounded-3xl bg-gray-50">
      <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-5">
        <Bot size={28} className="text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">No AI Agent Configured</h3>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">
        Set up your AI Sales Agent to start handling conversations and qualifying leads automatically.
      </p>
      <Link href="/dashboard/systems/ai-setter"
        className="flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-black transition-colors shadow-sm">
        <Bot size={15} /> Set Up AI Agent
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIEmployeesPage() {
  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [stats, setStats] = useState<AgentStats>({ totalLeads: 0, activeLeads: 0, meetings: 0, qualified: 0, channels: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      // Fetch agent config + analytics in parallel
      const [agentRes, analyticsRes] = await Promise.all([
        fetch('/api/sales-engine/config'),
        fetch('/api/analytics'),
      ]);

      if (agentRes.ok) {
        const agentData = await agentRes.json();
        if (agentData.agent) {
          setAgents([agentData.agent]);
        } else {
          setAgents([]);
        }
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setStats({
          totalLeads: analyticsData.kpis?.totalLeads || 0,
          activeLeads: analyticsData.funnel?.contacted || 0,
          meetings: analyticsData.kpis?.meetingsBooked || 0,
          qualified: analyticsData.funnel?.qualified || 0,
          channels: Object.keys(analyticsData.channelBreakdown || {}),
        });
      }
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load agent data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = agents.filter(a =>
    !search || (a.business_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa] font-sans">
      <div className="max-w-7xl mx-auto px-8 py-8 pb-16 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
                <Bot size={15} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Employees</h1>
            </div>
            <p className="text-sm text-gray-400">Your deployed AI sales agents and their live performance.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} disabled={loading}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link href="/dashboard/systems/ai-setter"
              className="flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-black transition-colors shadow-sm">
              <Settings size={14} /> Configure Agent
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Search */}
        {!loading && agents.length > 0 && (
          <div className="relative w-full max-w-xs">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search agents…"
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 shadow-sm" />
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 1 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-11 h-11 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-12 rounded-xl" />)}
                </div>
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map(agent => (
              <AgentCard key={agent.id} agent={agent} stats={stats} />
            ))
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Info note when no agents */}
        {!loading && agents.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Your AI Agent is your Sales Engine</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Configure it in the <Link href="/dashboard/systems/ai-setter" className="underline font-semibold">AI Setter</Link> to start managing conversations, qualifying leads, and booking meetings automatically.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
