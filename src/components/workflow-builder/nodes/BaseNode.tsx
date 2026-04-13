import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface BaseNodeProps {
  id: string;
  data: any;
  selected: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function BaseNode({ data, selected, icon, children }: BaseNodeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]';
      case 'Error': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
      case 'Done': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]';
      default: return 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]'; // Idle
    }
  };


  return (
    <div className={`w-[220px] min-h-[140px] flex flex-col bg-white rounded-2xl border-2 transition-all group ${
      selected ? 'border-[var(--accent-main)] shadow-[0_0_15px_rgba(99,102,241,0.2)] scale-105' : 'border-[var(--border-subtle)] hover:border-gray-300 shadow-sm hover:shadow-md hover:scale-105'
    }`}>
      {/* Input Handle (Left) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 !rounded-full !bg-white !border-2 !border-[var(--border-strong)] -left-1.5 transition-all group-hover:bg-[var(--accent-main)] group-hover:border-[var(--accent-main)]" 
      />

      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-[var(--border-subtle)] bg-gray-50/50 rounded-t-2xl">
        <div className="text-[var(--text-muted)] group-hover:text-[var(--accent-main)] transition-colors">
          {icon}
        </div>
        <h3 className="text-sm font-bold tracking-tight text-[var(--text-main)] truncate">{data.label}</h3>
      </div>
      
      {/* Dynamic Content Body */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        {children}
      </div>

      {/* Bottom Status Bar */}
      <div className="mt-auto px-3 py-2 bg-gray-50 border-t border-[var(--border-subtle)] rounded-b-2xl flex items-center justify-between">
         <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">{data.status || 'Idle'}</span>
         <div className={`w-2 h-2 rounded-full ${getStatusColor(data.status)}`} />
      </div>

      {/* Output Handle (Right) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 !rounded-full !bg-white !border-2 !border-[var(--border-strong)] -right-1.5 transition-all group-hover:bg-[var(--accent-main)] group-hover:border-[var(--accent-main)]" 
      />
    </div>
  );
}
