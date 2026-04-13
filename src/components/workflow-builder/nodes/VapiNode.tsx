import React from 'react';
import { BaseNode } from './BaseNode';
import { Mic } from 'lucide-react';

export function VapiNode(props: any) {
  return (
    <BaseNode {...props} icon={<Mic size={18} />}>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1">
        <span>Assistant:</span>
        <span className="text-[var(--text-main)] font-medium truncate max-w-[100px]">{props.data.assistant || 'Sales Caller'}</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1">
        <span>Model:</span>
        <span className="text-indigo-600 font-mono font-bold bg-indigo-50 px-1 rounded">{props.data.model || 'GPT-4o'}</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-2">
        <span>Max Turns:</span>
        <span className="text-[var(--text-main)] font-medium">{props.data.maxTurns || '5'}</span>
      </div>
      
      {/* Visual Audio Waveform representation */}
      <div className="h-8 flex flex-col justify-end gap-0.5 overflow-hidden border border-[var(--border-subtle)] rounded-lg p-1 bg-gray-50/50 shadow-inner">
         <div className="flex items-end justify-center gap-[2px] h-full opacity-80">
            {[2,5,3,8,4,9,3,7,2,5,8,3].map((h, i) => (
                <div key={i} className="w-1 bg-[var(--accent-main)] rounded-t-sm" style={{ height: `${h * 10}%` }} />
            ))}
         </div>
      </div>
    </BaseNode>
  );
}
