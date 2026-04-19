'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Search, CheckCircle2, Target, Send, 
  MessageSquare, Loader2, Play, Users, Bot, Zap,
  AlertTriangle, RefreshCw
} from 'lucide-react';

interface PipelineStats {
  totalScraped: number;
  inResearch: number;
  qualified: number;
  rejected: number;
  inPersonalisation: number;
  readyToSend: number;
  sent: number;
  replied: number;
}

export default function CampaignOverviewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [campaign, setCampaign] = useState<any>(null);

  const fetchPipeline = async () => {
    try {
      // In a real app, you'd want an explicit route like `/api/outbound/campaigns/[id]/pipeline`
      // For now, we will piggyback off the summary data and simulate the drill-down fetch,
      // or actually hit a direct endpoint if we built it. Let's just fetch everything for this ID directly from Supabase via an API route.
      const res = await fetch(`/api/outbound/campaigns/${id}/pipeline`);
      if (res.ok) {
        const json = await res.json();
        setCampaign(json.campaign);
        setStats(json.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
    const int = setInterval(fetchPipeline, 3000);
    return () => clearInterval(int);
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f7f8fa]">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!campaign || !stats) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#f7f8fa] text-gray-400">
        <AlertTriangle size={32} className="mb-4 text-orange-400" />
        <p className="font-bold text-gray-800">Campaign not found</p>
        <Link href="/dashboard/outbound" className="text-sm text-blue-500 hover:underline mt-2">Back to Dashboard</Link>
      </div>
    );
  }

  const STAGES = [
    {
      id: 'scraped',
      label: 'Leads Scraped',
      desc: 'Raw targets extracted from sources',
      icon: Search,
      count: stats.totalScraped,
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      iconColor: 'text-gray-500'
    },
    {
      id: 'research',
      label: 'Deep Researching',
      desc: 'Web scraping and AI context building',
      icon: Bot,
      count: stats.inResearch,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      iconColor: 'text-amber-500'
    },
    {
      id: 'qualified',
      label: 'Qualified',
      desc: 'Passed the prompt heuristics',
      icon: CheckCircle2,
      count: stats.qualified,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconColor: 'text-emerald-500'
    },
    {
      id: 'personalising',
      label: 'Drafting Copy',
      desc: 'GPT-4o writing bespoke sequences',
      icon: Zap,
      count: stats.inPersonalisation,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      iconColor: 'text-purple-500'
    },
    {
      id: 'sent',
      label: 'Emails Sent',
      desc: 'Dispatched via configured channels',
      icon: Send,
      count: stats.sent,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-500'
    },
    {
      id: 'replied',
      label: 'Replies Received',
      desc: 'Positive or negative responses',
      icon: MessageSquare,
      count: stats.replied,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      iconColor: 'text-rose-500'
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa] font-sans px-8 py-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/outbound" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <ArrowLeft size={16} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              {campaign.name}
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <p className="text-sm text-gray-400 font-medium">Pipeline execution overview</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {campaign.status === 'running' && (
            <button onClick={fetchPipeline} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
              <RefreshCw size={14} className="animate-spin text-gray-400" /> Processing
            </button>
          )}
          <Link href={`/dashboard/outbound/leads?campaign=${id}`}
            className="flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-black transition-colors shadow-sm">
            <Users size={15} /> View Raw Leads Table
          </Link>
        </div>
      </div>

      {/* Main Funnel Visualization */}
      <div className="max-w-4xl mx-auto space-y-3 mt-12 pb-24">
        {STAGES.map((stage, idx) => {
          // Calculate the width curve to fake a funnel, minimum 30%
          const maxCount = Math.max(stats.totalScraped, 1);
          const rawPct = (stage.count / maxCount) * 100;
          const funnelWidth = Math.max(30, 100 - (idx * 12)); 

          return (
            <motion.div 
              key={stage.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative"
            >
              <div 
                className="mx-auto transition-all duration-500 ease-out hover:scale-[1.01]"
                style={{ width: `${funnelWidth}%` }}
              >
                <div className={`border rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden ${stage.color} hover:shadow-md transition-shadow cursor-pointer`}>
                  
                  {/* Subtle progress bar background fill */}
                  <div className="absolute top-0 bottom-0 left-0 bg-white/40 transition-all duration-1000 ease-out" 
                       style={{ width: `${rawPct}%` }} />

                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                      <stage.icon size={18} className={stage.iconColor} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{stage.label}</h3>
                      <p className="text-xs opacity-70 font-medium">{stage.desc}</p>
                    </div>
                  </div>

                  <div className="relative z-10 text-right">
                    <p className="text-3xl font-black tracking-tighter tabular-nums text-gray-900 drop-shadow-sm">
                      {stage.count.toLocaleString()}
                    </p>
                    {idx > 0 && stage.count > 0 && (
                      <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-0.5">
                        {Math.round((stage.count / (STAGES[idx-1].count || 1)) * 100)}% Pass Rate
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* Connector Pipeline Line between stages */}
              {idx < STAGES.length - 1 && (
                <div className="w-0.5 h-6 bg-gradient-to-b from-gray-200 to-transparent mx-auto my-1 relative">
                  <motion.div 
                    animate={{ y: [0, 24, 0], opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 2, delay: idx * 0.3 }}
                    className="absolute -left-1 w-2.5 h-2.5 rounded-full bg-blue-300 blur-sm"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
