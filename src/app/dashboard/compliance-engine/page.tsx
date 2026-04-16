import React from 'react';
import AgentAssistantFeed from './components/AgentAssistantFeed';
import ComplianceMatrix from './components/ComplianceMatrix';

export default function ComplianceEnginePage() {
  return (
    <div className="flex h-full bg-white text-slate-900 font-sans">
      
      {/* PANE 1: The Copilot / Agent Assistant Feed (35%) */}
      <div className="w-[35%] shrink-0 border-r border-slate-200 flex flex-col bg-slate-50 relative shadow-[1px_0_10px_rgba(0,0,0,0.02)] z-10">
        <div className="p-5 border-b border-slate-200 bg-white shrink-0">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
             <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-900 text-white text-[10px] font-bold">AE</div>
             Autonomous Copilot
          </h2>
          <p className="text-xs text-slate-500 mt-1">Grounded natively on ae_extraction_jobs in Supabase.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <AgentAssistantFeed />
        </div>
        
        {/* Mocked Input Area mimicking Harvey chat/upload prompt */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
           <div className="relative">
             <input 
               type="text" 
               disabled
               placeholder="Drop a PDF into Supabase Storage to wake Agent..." 
               className="w-full bg-slate-50 border border-slate-200 text-sm py-3 px-4 rounded-xl text-slate-700 cursor-not-allowed"
             />
             <div className="absolute right-3 top-2.5 w-7 h-7 bg-slate-200 rounded-lg flex items-center justify-center">
               <span className="text-slate-400 font-bold text-lg leading-none transform -rotate-45 block rotate-[315deg] mb-1">➔</span>
             </div>
           </div>
        </div>
      </div>

      {/* PANE 2: The Vault / Data Matrix (65%) */}
      <div className="w-[65%] flex flex-col bg-white overflow-hidden relative">
        <div className="p-6 md:p-10 shrink-0">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 font-serif mb-2">Workspace Vault</h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
            Live resolution matrices mapping vendor SLA states, cash flows, and employee boundaries. All parameters are bound deterministically via live data. 
          </p>
        </div>
        
        <div className="flex-1 overflow-hidden px-6 md:px-10 pb-10">
          <div className="w-full h-full">
            <ComplianceMatrix />
          </div>
        </div>
      </div>
      
    </div>
  );
}
