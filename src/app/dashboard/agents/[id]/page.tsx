'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Editor } from '@monaco-editor/react';
import { Save, Sliders, MessageSquare, Play, RefreshCw, Zap, Cpu, Braces, Code, Bot } from 'lucide-react';

export default function AgentEditorMaster() {
  const [activeTab, setActiveTab] = useState<'prompt' | 'variables'>('prompt');
  const [temperature, setTemperature] = useState(0.7);
  const [isTestDockOpen, setTestDockOpen] = useState(true);

  const defaultPrompt = `// System Directives for Azmeth Inbound SDR\n// Do NOT remove the routing logic hooks.\n\nexport const AgentDirective = {\n  role: "Highly technical Inbound SDR",\n  tone: "Professional, sharp, and concise",\n  objective: "Parse user requirements and explicitly route to the Compliance Dashboard if risk detected.",\n  fallback: "Always escalate to a human manager if intent is undefined",\n};`;

  return (
    <div className="h-full w-full flex flex-col relative z-20">
      
      {/* IDE Top Bar */}
      <header className="h-12 border-b border-[var(--border)] bg-[#070707]/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2 py-1 bg-[#1A1A1A] rounded border border-white/5 text-xs text-[var(--text-secondary)] font-mono">
            <span className="text-[var(--text-muted)]">src / agents / </span>
            <span className="text-white">Inbound_SDR.ts</span>
          </div>
          <span className="px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-500 text-[9px] font-bold tracking-widest uppercase border border-amber-500/20">Modified</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">TPS: <span className="text-[#00E5FF]">24.8</span></span>
            <div className="w-16 h-4 bg-white/5 rounded overflow-hidden flex items-end opacity-70">
              {/* Fake Mini Bar Chart */}
              {[3, 5, 4, 7, 6, 8, 5, 9, 7].map((h, i) => (
                <motion.div 
                  key={i} 
                  initial={{ height: '20%' }}
                  animate={{ height: `${h * 10}%` }}
                  transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse", delay: i * 0.1 }}
                  className="w-full bg-[#00E5FF] mx-[0.5px]"
                />
              ))}
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-1.5 rounded bg-[#00E5FF] hover:bg-cyan-400 text-black text-xs font-bold transition shadow-[0_0_15px_rgba(0,229,255,0.4)]">
            <Save size={12} /> Commit Changes
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-[#050505]">
          <div className="flex bg-[#0A0A0A] border-b border-[var(--border)] px-2">
            <button 
              onClick={() => setActiveTab('prompt')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-mono transition-colors ${activeTab === 'prompt' ? 'border-[#00E5FF] text-[#00E5FF]' : 'border-transparent text-[var(--text-secondary)]'}`}
            >
              <Code size={14} /> system_prompt.ts
            </button>
            <button 
              onClick={() => setActiveTab('variables')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-mono transition-colors ${activeTab === 'variables' ? 'border-[#00E5FF] text-[#00E5FF]' : 'border-transparent text-[var(--text-secondary)]'}`}
            >
              <Braces size={14} /> dynamic_vars.json
            </button>
          </div>
          
          <div className="flex-1 relative">
             <Editor 
               height="100%" 
               language="typescript" 
               theme="vs-dark" 
               value={defaultPrompt}
               options={{
                 minimap: { enabled: false },
                 fontSize: 13,
                 fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                 padding: { top: 20 },
                 scrollBeyondLastLine: false,
                 smoothScrolling: true,
                 cursorBlinking: 'smooth',
                 cursorWidth: 2,
               }}
               loading={<div className="text-[var(--text-muted)] font-mono text-sm p-4">Initializing Language Server...</div>}
             />
          </div>
        </div>

        {/* Floating Docks Layer */}
        
        {/* Inference Dock */}
        <div className="w-[320px] bg-[#0A0A0A]/90 backdrop-blur-2xl border-l border-[var(--border)] flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.5)] z-20">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Cpu size={14} className="text-[#9D4EDD]" />
               <h3 className="text-xs font-bold uppercase tracking-widest text-[#E5E5E5]">Hardware Limits</h3>
            </div>
          </div>
          
          <div className="p-4 space-y-6 overflow-y-auto">
             <div>
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest mb-2 block">Compute Router</label>
                <div className="p-1 bg-[#050505] rounded-lg border border-[var(--border)] flex">
                   <button className="flex-1 py-1.5 bg-[#1F1F1F] rounded-md text-xs font-mono border border-white/10 shadow-lg text-white flex justify-center items-center gap-2">
                     <Zap size={12} className="text-[#00E5FF]" /> BYOK (Live)
                   </button>
                   <button className="flex-1 py-1.5 text-xs font-mono text-[var(--text-secondary)] hover:text-white transition">
                     Managed
                   </button>
                </div>
             </div>

             <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest">Core Engine</label>
               </div>
               <select className="w-full bg-[#111111] border border-[var(--border)] rounded text-xs text-[#E5E5E5] font-mono p-2 focus:border-[#00E5FF] outline-none">
                 <option>GPT-4-Turbo (Optimized)</option>
                 <option>Claude 3.5 Sonnet</option>
                 <option>Llama 3 70B (Groq)</option>
               </select>
             </div>

             <div className="space-y-4 pt-4 border-t border-[var(--border)]">
               <div className="flex justify-between items-center">
                 <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest">Temperature</label>
                 <span className="text-[10px] bg-[#00E5FF]/10 text-[#00E5FF] px-1.5 py-0.5 rounded font-mono border border-[#00E5FF]/20">{temperature}</span>
               </div>
               <input 
                 type="range" min="0" max="1" step="0.05" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))}
                 className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
               />
               <div className="flex justify-between text-[8px] text-[var(--text-muted)] font-mono">
                 <span>DETERMINISTIC</span>
                 <span>CREATIVE</span>
               </div>
             </div>
          </div>
        </div>

      </div>

      {/* Collapsible Lower Terminal Panel */}
      <AnimatePresence>
        {isTestDockOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 280, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full border-t border-[var(--border)] bg-[#0A0A0A] flex flex-col shadow-[0_-20px_40px_rgba(0,0,0,0.5)] z-30"
          >
            <div className="h-10 bg-[#111111] flex items-center justify-between px-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <MessageSquare size={14} className="text-[#00E5FF]" />
                <span className="text-xs font-mono text-[#E5E5E5]">Live Interaction Console</span>
                <div className="flex gap-1 ml-4 items-center">
                  <span className="w-2 h-2 rounded-full bg-[#00E676] shadow-[0_0_8px_#00E676] animate-pulse" />
                  <span className="text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-widest">Socket Bound</span>
                </div>
              </div>
              <button onClick={() => setTestDockOpen(false)} className="text-[var(--text-muted)] hover:text-white transition text-xs font-mono">
                [X] Close
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
               <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
                 <div className="flex gap-4 opacity-50">
                   <span className="text-[9px] mt-0.5 w-16 text-right shrink-0">10:45:01</span>
                   <div className="flex-1">
                     <span className="text-[#9D4EDD] font-bold">USER_HOOK {">>>"}</span> Hello, I need help with my compliance routing.
                   </div>
                 </div>
                 
                 <div className="flex gap-4">
                   <span className="text-[9px] mt-0.5 w-16 text-right shrink-0 text-[var(--text-muted)]">10:45:02</span>
                   <div className="flex-1 flex flex-col gap-1">
                     <div><span className="text-[#00E5FF] font-bold">AGENT_RSP {"<<<"}</span> Yes absolutely! I can help you set up Azmeth AI compliance routing. What specific regulations are you looking to enforce?</div>
                     <div className="flex items-center gap-2 mt-1">
                       <div className="flex items-center gap-0.5">
                         {[1,2,3,4,3,2,1].map((h, i) => (
                           <motion.div 
                             key={i} 
                             animate={{ height: [Math.random() * 8 + 4, Math.random() * 8 + 4] }} 
                             transition={{ repeat: Infinity, duration: 0.2 }} 
                             className="w-1 bg-[#00E5FF] rounded-full" 
                           />
                         ))}
                       </div>
                       <span className="text-[9px] text-[var(--text-muted)]">STREAMING TOKENS...</span>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="w-[300px] border-l border-[var(--border)] bg-[#050505] p-4 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-3">Payload Injector</span>
                  <textarea 
                    placeholder="Enter raw JSON hook or message string..."
                    className="flex-1 bg-[#111111] border border-[var(--border)] rounded text-xs text-[#E5E5E5] font-mono p-3 resize-none focus:border-[#00E5FF] outline-none"
                  />
                  <button className="mt-3 w-full py-2 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 rounded font-bold text-xs uppercase tracking-widest hover:bg-[#00E5FF] hover:text-black transition shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                    Send Packet
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toggle button if dock is closed */}
      {!isTestDockOpen && (
        <button 
           onClick={() => setTestDockOpen(true)}
           className="absolute bottom-4 right-4 bg-[#111111] border border-[var(--border)] text-[#00E5FF] px-4 py-2 rounded-full text-xs font-mono shadow-xl hover:bg-[#1A1A1A] transition z-40"
        >
          _open_console();
        </button>
      )}

    </div>
  );
}
