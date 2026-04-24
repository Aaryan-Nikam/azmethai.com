'use client';

import React from 'react';
import { useExtractionJobs } from '@/hooks/compliance/useExtractionJobs';
import { format } from 'date-fns';

const CURRENT_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export default function AgentAssistantFeed() {
  const { jobs, loading, error } = useExtractionJobs(CURRENT_TENANT_ID);

  return (
    <div className="flex flex-col gap-4 p-5">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-mono border border-red-100">
          Agent Disconnected: {error.message}
        </div>
      )}

      {loading && jobs.length === 0 ? (
        <div className="flex items-center justify-center p-10 text-slate-400">
          <div className="flex gap-2 items-center text-sm font-medium">
             <span className="animate-spin h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full"></span>
             Connecting to Agent Vault...
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500">
          <p className="text-sm">Vault is empty.</p>
          <p className="text-xs mt-2 opacity-70">Upload a PDF contract or invoice to Supabase to trigger the pg_net Ingestion Engine.</p>
        </div>
      ) : (
        jobs.map(job => (
          <div key={job.id} className="group relative">
            {/* Thread Line */}
            <div className="absolute top-8 left-4 w-0.5 h-full bg-slate-100 -z-10 group-last:bg-transparent"></div>
            
            <div className="flex gap-4">
              {/* Agent Avatar Icon */}
              <div className="shrink-0 w-8 h-8 rounded-full bg-slate-900 shadow-sm flex items-center justify-center border border-slate-200 z-10 mt-1">
                 <span className="text-white text-xs font-bold leading-none">AE</span>
              </div>
              
              {/* Message Bubble */}
              <div className="flex-1 bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm transition-all hover:shadow-md">
                 <div className="flex justify-between items-center mb-2">
                   <h4 className="text-sm font-semibold text-slate-900">Document Processed</h4>
                   <span className="text-[10px] text-slate-500 font-mono tracking-wider">{format(new Date(job.created_at), 'HH:mm:ss')}</span>
                 </div>
                 
                 <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm text-slate-700 font-mono mb-3 truncate">
                   {job.document_name}
                 </div>

                 {job.status === 'failed' ? (
                   <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex gap-2 items-start">
                     <span className="text-red-500 font-bold">Error:</span> {job.failure_reason || "Unknown extraction failure"}
                   </p>
                 ) : job.status === 'pending' || job.status === 'running' ? (
                   <p className="text-sm text-indigo-600 flex gap-2 items-center">
                     <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                     Analyzing document structure natively...
                   </p>
                 ) : (
                   <div className="space-y-3">
                     <p className="text-sm text-slate-600 leading-relaxed">
                       Extracted SLAs and compliance nodes successfully. Boundaries mapped against Tenant matrix. {job.confidence_avg && `AI Confidence indexed at ${(job.confidence_avg * 100).toFixed(0)}%.`}
                     </p>
                     
                     {/* Sub-Metrics Panel */}
                     <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Latency</span>
                          <span className="text-xs text-slate-700 font-mono mt-0.5">{job.latency_ms || 0}ms</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Input Tokens</span>
                          <span className="text-xs text-slate-700 font-mono mt-0.5">{job.input_tokens || 0}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Status</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase font-semibold inline-block w-fit mt-0.5 tracking-wider border border-emerald-100">Cleared</span>
                        </div>
                     </div>
                   </div>
                 )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
