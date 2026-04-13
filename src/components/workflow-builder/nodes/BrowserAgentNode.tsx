import React from 'react';
import { BaseNode } from './BaseNode';
import { Globe } from 'lucide-react';

export function BrowserAgentNode(props: any) {
  return (
    <BaseNode {...props} icon={<Globe size={18} />}>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1">
        <span>URL:</span>
        <span className="text-blue-600 font-mono truncate max-w-[120px] bg-blue-50 px-1 rounded">{props.data.url || 'google.com'}</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-2">
        <span>Actions:</span>
        <span className="text-[var(--text-main)] font-bold">{props.data.actions || '3'}</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-2">
        <span>Session:</span>
        <span className="text-emerald-500 font-bold animate-pulse">{props.data.sessionStatus || 'Live'}</span>
      </div>
      
      {/* Mock Browser Screenshot Thumbnail */}
      <div className="h-16 w-full rounded-lg bg-gray-100 border border-[var(--border-subtle)] flex flex-col overflow-hidden group shadow-inner">
         <div className="h-2 w-full bg-white border-b border-gray-200 flex items-center px-1 gap-0.5">
            <div className="w-1 h-1 rounded-full bg-red-400" />
            <div className="w-1 h-1 rounded-full bg-yellow-400" />
            <div className="w-1 h-1 rounded-full bg-green-400" />
         </div>
         <div className="flex-1 w-full bg-white flex items-center justify-center">
            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider group-hover:text-[var(--accent-main)] transition-colors">[Screenshot]</span>
         </div>
      </div>
    </BaseNode>
  );
}
