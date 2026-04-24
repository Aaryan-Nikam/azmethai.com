'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Bot, CheckCircle2, Clock, Zap, AlertCircle,
  Database, Globe, Mail, TrendingUp, Users, RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  role: string;
  task: string;
  status: 'idle' | 'running' | 'done' | 'error';
  updatedAt: Date;
}

interface SystemLog {
  id: string;
  type: 'tool_call' | 'tool_result' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

interface SystemMonitorProps {
  logs?: SystemLog[];
  latestInstruction?: string;
}

// ─── Helper Components ────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  idle:    { color: 'text-gray-400',   bg: 'bg-gray-100',   dot: 'bg-gray-300',   label: 'Idle' },
  running: { color: 'text-blue-600',   bg: 'bg-blue-50',    dot: 'bg-blue-500',   label: 'Running' },
  done:    { color: 'text-green-600',  bg: 'bg-green-50',   dot: 'bg-green-500',  label: 'Done' },
  error:   { color: 'text-red-600',    bg: 'bg-red-50',     dot: 'bg-red-500',    label: 'Error' },
};

const LOG_ICONS = {
  tool_call:   <Zap size={10} className="text-blue-500" />,
  tool_result: <CheckCircle2 size={10} className="text-green-500" />,
  error:       <AlertCircle size={10} className="text-red-500" />,
  info:        <Activity size={10} className="text-gray-400" />,
};

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-40`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  );
}

// ─── Mock Data (replaces canvas — live data will come from Supabase realtime) ──

const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', role: 'Outbound SDR', task: 'Qualifying 12 new leads', status: 'running', updatedAt: new Date() },
  { id: '2', role: 'Customer Success Rep', task: 'Monitoring inbox — 3 unread', status: 'idle', updatedAt: new Date() },
];

const MOCK_STATS = [
  { label: 'Active Leads', value: '847', icon: Users, trend: '+12%' },
  { label: 'Campaigns', value: '3', icon: TrendingUp, trend: 'Live' },
  { label: 'Inbox', value: '14', icon: Mail, trend: '2 new' },
  { label: 'API Calls', value: '1.2k', icon: Globe, trend: 'Today' },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export function SystemMonitor({ logs = [], latestInstruction }: SystemMonitorProps) {
  const [activeTab, setActiveTab] = useState<'employees' | 'logs' | 'stats'>('employees');
  const [employees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(logs);
  const [tick, setTick] = useState(0);

  // Auto-refresh the "updated X seconds ago" timestamps
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 5000);
    return () => clearInterval(t);
  }, []);

  // Merge incoming logs
  useEffect(() => {
    if (logs.length) setSystemLogs(prev => [...logs, ...prev].slice(0, 50));
  }, [logs]);

  const timeAgo = (d: Date) => {
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };

  const tabs = [
    { key: 'employees' as const, label: 'AI Employees', count: employees.length },
    { key: 'logs' as const, label: 'Execution Logs', count: systemLogs.length },
    { key: 'stats' as const, label: 'System Stats', count: null },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100 font-sans overflow-hidden">

      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gray-900 flex items-center justify-center">
              <Database size={12} className="text-white" />
            </div>
            <span className="text-[13px] font-bold text-gray-900">System Backend</span>
          </div>
          <div className="flex items-center gap-1.5">
            <PulsingDot color="bg-green-500" />
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Latest Instruction Context Strip */}
        {latestInstruction && (
          <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-0.5">Last Instruction</p>
            <p className="text-[11px] text-blue-800 font-medium line-clamp-2 leading-relaxed">{latestInstruction}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label.split(' ')[0]}
              {tab.count !== null && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        <AnimatePresence mode="wait">

          {/* ── AI Employees Tab ── */}
          {activeTab === 'employees' && (
            <motion.div key="employees" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
              {employees.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Bot size={20} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-400">No employees deployed</p>
                  <p className="text-xs text-gray-400 mt-1">Ask Azmeth to deploy an AI Employee</p>
                </div>
              ) : employees.map(emp => {
                const cfg = STATUS_CONFIG[emp.status];
                return (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:border-gray-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm shrink-0">
                          <Bot size={14} className="text-gray-600" />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-gray-900">{emp.role}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{emp.task}</p>
                        </div>
                      </div>
                      <div className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                        {emp.status === 'running' ? <PulsingDot color={cfg.dot} /> : <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                        {cfg.label}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 ml-10">
                      <Clock size={9} className="text-gray-300" />
                      <span className="text-[10px] text-gray-400">{timeAgo(emp.updatedAt)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ── Execution Logs Tab ── */}
          {activeTab === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-1.5">
              {systemLogs.length === 0 ? (
                <div className="text-center py-12">
                  <RefreshCw size={20} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-xs text-gray-400">Waiting for agent activity...</p>
                </div>
              ) : systemLogs.map(log => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 py-1.5 px-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="shrink-0 w-4 h-4 flex items-center justify-center mt-0.5">
                    {LOG_ICONS[log.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-700 leading-relaxed font-mono break-words">{log.message}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{log.timestamp.toLocaleTimeString()}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── System Stats Tab ── */}
          {activeTab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-2">
              {MOCK_STATS.map(stat => (
                <div key={stat.label} className="p-3 rounded-2xl border border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon size={13} className="text-gray-400" />
                    <span className="text-[9px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded-full">{stat.trend}</span>
                  </div>
                  <p className="text-[22px] font-black text-gray-900 leading-none">{stat.value}</p>
                  <p className="text-[10px] text-gray-500 mt-1 font-medium">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
