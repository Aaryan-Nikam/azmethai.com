import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Activity, Zap, Server } from 'lucide-react';
import { motion } from 'framer-motion';

interface AgentNodeProps {
  data: {
    label: string;
    description: string;
    model: string;
    status: 'idle' | 'active' | 'error';
    stats?: { latency: string; throughput: string };
  };
  selected: boolean;
}

export default function AgentNode({ data, selected }: AgentNodeProps) {
  const isError = data.status === 'error';
  const isActive = data.status === 'active';
  
  return (
    <div className={`relative min-w-[320px] rounded bg-[#0A0A0A] border transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${
      selected 
        ? 'border-[#00E5FF] shadow-[0_0_30px_rgba(0,229,255,0.2)] z-10' 
        : isError ? 'border-[#FF3366]/50' : 'border-[#222222] hover:border-[#444444]'
    }`}>
      
      {/* Hardware Top Rail */}
      <div className="h-2 w-full bg-[#111111] rounded-t flex gap-1 px-2 items-center border-b border-[#222222]">
         {[1,2,3,4,5,6].map(i => <div key={i} className="w-2 h-0.5 bg-[#333333] rounded-full" />)}
      </div>

      <div className="p-1">
        {/* Main Display Panel */}
        <div className="bg-[#050505] p-3 rounded-sm border border-[#1A1A1A] relative overflow-hidden group">
          {/* Subtle Grid overlay inside the screen */}
          <div className="absolute inset-0 texture-grid opacity-20 pointer-events-none" />
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded border flex items-center justify-center ${
                isActive 
                  ? 'bg-[#00E5FF]/10 border-[#00E5FF]/50 shadow-[0_0_15px_rgba(0,229,255,0.4)]' 
                  : 'bg-[#111111] border-[#333333]'
              }`}>
                <Bot size={20} className={isActive ? 'text-[#00E5FF]' : 'text-[#888888]'} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#555555] tracking-widest font-mono">
                  Module_ID: 0x{((data.label.length * 73) + (data.model.length * 11)).toString(16).toUpperCase()}A2
                </span>
                <h3 className="text-sm font-bold text-[#E5E5E5] tracking-wide mt-0.5">{data.label}</h3>
              </div>
            </div>

            {/* Server Status Icon */}
            <div className="flex items-center justify-center p-1.5 rounded bg-[#111111] border border-[#222222]">
              <Server size={14} className={isActive ? 'text-[#00E676] animate-pulse shadow-[0_0_5px_#00E676]' : 'text-[#555555]'} />
            </div>
          </div>
          
          <p className="text-[10px] text-[#888888] mt-3 font-mono border-l-2 border-[#333333] pl-2">{data.description}</p>
        </div>

        {/* LED Metrics Strip */}
        <div className="mt-2 grid grid-cols-3 gap-1">
          <div className="bg-[#111111] border border-[#222222] rounded-sm p-1.5 flex flex-col items-center">
             <span className="text-[8px] text-[#555555] font-mono tracking-widest uppercase">Engine</span>
             <span className="text-[10px] text-[#00E5FF] font-mono font-bold mt-0.5 flex items-center gap-1"><Zap size={8}/> {data.model.split(' ')[0]}</span>
          </div>
          <div className="bg-[#111111] border border-[#222222] rounded-sm p-1.5 flex flex-col items-center">
             <span className="text-[8px] text-[#555555] font-mono tracking-widest uppercase">Latency</span>
             <span className="text-[10px] text-[#00E676] font-mono font-bold mt-0.5">{data.stats?.latency || '--'}</span>
          </div>
          <div className="bg-[#111111] border border-[#222222] rounded-sm p-1.5 flex flex-col items-center">
             <span className="text-[8px] text-[#555555] font-mono tracking-widest uppercase">TPS</span>
             <span className="text-[10px] text-[#9D4EDD] font-mono font-bold mt-0.5">{data.stats?.throughput || '--'}</span>
          </div>
        </div>

        {/* Live Audio/Processing Waveform (Only visible when active) */}
        <div className="h-6 mt-2 bg-[#050505] border border-[#1A1A1A] rounded-sm flex items-center justify-center gap-0.5 overflow-hidden">
          {isActive ? (
            Array.from({ length: 40 }).map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: [Math.random() * 4 + 2, Math.random() * 16 + 4, Math.random() * 4 + 2] }}
                transition={{ repeat: Infinity, duration: Math.random() * 0.5 + 0.3 }}
                className="w-1 bg-[#00E5FF] rounded-full opacity-80"
              />
            ))
          ) : (
            <span className="text-[8px] text-[#333333] font-mono uppercase tracking-widest">Awaiting Signal</span>
          )}
        </div>
      </div>

      {/* Hardware Base Rail */}
      <div className="h-1.5 w-full bg-[#111111] rounded-b border-t border-[#222222]" />

      {/* Heavy-Duty Connection Ports */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-4 h-6 bg-[#000000] border-2 border-[#333333] rounded-[2px] transition-colors -ml-1 flex items-center justify-center overflow-visible"
      >
        <div className="w-1 h-3 bg-[#555555] rounded-full" />
      </Handle>
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className={`w-4 h-6 bg-[#000000] border-2 rounded-[2px] -mr-1 flex items-center justify-center transition-all ${
          selected ? 'border-[#00E5FF]' : 'border-[#333333] hover:border-[#00E5FF]'
        }`}
      >
        <div className={`w-1 h-3 rounded-full ${isActive ? 'bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]' : 'bg-[#555555]'}`} />
      </Handle>

    </div>
  );
}
