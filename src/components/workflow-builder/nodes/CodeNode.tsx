import React from 'react';
import { BaseNode } from './BaseNode';
import { Code2 } from 'lucide-react';

export function CodeNode(props: any) {
  return (
    <BaseNode {...props} icon={<Code2 size={18} />}>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1">
        <span>Language:</span>
        <select className="bg-gray-50 border border-gray-200 rounded px-1 min-w-[60px] outline-none text-[var(--text-main)] focus:border-indigo-500">
           <option>Python</option>
           <option>JS</option>
           <option>Shell</option>
        </select>
      </div>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-2">
        <span>Timeout:</span>
        <span className="text-[var(--text-main)] font-medium">{props.data.timeout || '30s'}</span>
      </div>
      
      {/* Mini Monaco representation / Editor box */}
      <div className="bg-white border border-gray-200 shadow-inner rounded-lg p-2 font-mono text-[10px] leading-relaxed text-gray-800 h-[60px] overflow-hidden relative group">
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
           <div className="w-2 h-2 rounded-full bg-red-400" />
           <div className="w-2 h-2 rounded-full bg-yellow-400" />
           <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <div className="text-blue-600">import</div> json<br/>
        <div className="text-purple-600">return</div> <span className="text-orange-600">"{"{}"}"</span>
      </div>
    </BaseNode>
  );
}
