import React from 'react';
import { BaseNode } from './BaseNode';
import { Image as ImageIcon } from 'lucide-react';

export function ImageGenNode(props: any) {
  return (
    <BaseNode {...props} icon={<ImageIcon size={18} />}>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1">
        <span>Model:</span>
        <span className="text-[var(--text-main)] font-medium">{props.data.model || 'DALL-E 3'}</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-2">
        <span>Size:</span>
        <span className="text-[var(--text-main)] font-mono bg-gray-100 px-1 rounded">{props.data.size || '1024x1024'}</span>
      </div>
      
      {/* Prompt Input Representation */}
      <div className="mb-2">
        <div className="w-full h-6 bg-white border border-gray-200 shadow-inner rounded-md text-[10px] text-gray-400 px-2 flex items-center italic truncate">
           {props.data.prompt || 'Enter image prompt...'}
        </div>
      </div>
      
      {/* Thumbnail Preview area */}
      <div className="h-16 w-full rounded-lg bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group hover:bg-gray-100 transition-colors cursor-pointer">
         <ImageIcon size={24} className="text-gray-300 group-hover:scale-110 group-hover:text-gray-400 transition-all" />
      </div>
    </BaseNode>
  );
}
