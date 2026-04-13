'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerminalSquare, X, Activity } from 'lucide-react';

export default function ObservabilityDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  // Fake streams to demonstrate the UI
  const [logs] = useState([
    { id: 1, type: 'info', msg: '[System] Supabase Realtime Connected.', time: '10:00:23' },
    { id: 2, type: 'pending', msg: '[Agent-Alpha] Processing inbound IG Direct Message.', time: '10:01:05' },
    { id: 3, type: 'success', msg: '[Agent-Alpha] LLM Generation time: 1.2s.', time: '10:01:06' },
    { id: 4, type: 'info', msg: '[Router] Webhook dispatched to main engine.', time: '10:01:08' },
  ]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 right-6 p-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:scale-105 transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)] z-30"
      >
        <TerminalSquare size={22} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-[400px] bg-[#0F0F0F] border-l border-white/10 shadow-[-20px_0_40px_rgba(0,0,0,0.6)] z-40 flex flex-col backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-cyan-400 animate-pulse" />
                <h3 className="text-sm font-medium text-white tracking-wide">Live Event Queue</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[var(--text-secondary)] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono">
              {logs.map((log) => (
                <div key={log.id} className="text-xs flex flex-col gap-1.5 p-3 rounded-md bg-black/40 border border-white/5 shadow-inner">
                  <div className="flex justify-between items-center text-[var(--text-muted)]">
                    <span className="opacity-70">{log.time}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold ${
                      log.type === 'success' ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 
                      log.type === 'pending' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' : 
                      'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                    }`}>
                      {log.type}
                    </span>
                  </div>
                  <span className="text-[var(--text-primary)] leading-relaxed">{log.msg}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
