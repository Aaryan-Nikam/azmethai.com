import React from 'react';
import { BaseNode } from './BaseNode';
import { Zap } from 'lucide-react';

export function TriggerNode(props: any) {
  return (
    <BaseNode {...props} icon={<Zap size={18} className="text-[var(--accent-main)]" />}>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1">
        <span>Event Source:</span>
        <span className="text-[var(--accent-main)] font-medium">Webhook</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-2">
        <span>Path:</span>
        <span className="text-[var(--text-main)] font-mono text-[10px] bg-gray-50 px-1 rounded">/api/webhook/v1</span>
      </div>
      
      {/* Waiting state representation */}
      <div className="mt-2 h-10 w-full rounded-lg bg-[var(--accent-main)]/5 border border-[var(--accent-main)]/20 flex items-center justify-center relative overflow-hidden shadow-inner">
         <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-main)] animate-pulse" />
         <span className="ml-2 text-[10px] text-[var(--accent-main)] uppercase font-bold tracking-wider opacity-80">Listening</span>
      </div>
    </BaseNode>
  );
}
