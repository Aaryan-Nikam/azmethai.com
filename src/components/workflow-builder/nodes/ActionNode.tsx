import React from 'react';
import { BaseNode } from './BaseNode';
import { Settings } from 'lucide-react';

export function ActionNode(props: any) {
  return (
    <BaseNode {...props} icon={<Settings size={18} className="text-blue-500" />}>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-2">
        <span>Operation:</span>
        <span className="text-[var(--text-main)] font-medium">{props.data.operation || 'Execute'}</span>
      </div>
      
      {/* Parameter representation */}
      <div className="space-y-1 bg-gray-50 p-2 rounded-lg border border-[var(--border-subtle)] shadow-inner">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
            <span className="text-[10px] text-[var(--text-muted)] font-mono">Input: mapped</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
            <span className="text-[10px] text-[var(--text-muted)] font-mono">Output: JSON</span>
         </div>
      </div>
      
      {/* Execution mock bar */}
      <div className="mt-3 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
         <div className="h-full bg-blue-500 w-[60%]" />
      </div>
    </BaseNode>
  );
}
