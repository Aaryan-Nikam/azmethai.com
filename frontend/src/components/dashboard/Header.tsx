'use client';

import React from 'react';
import { ToggleLeft, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname() || '';
  const pathParts = pathname.split('/').filter(Boolean);
  const currentSection = pathParts[1] || 'Dashboard';

  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-white/5 shrink-0 z-10 bg-[var(--bg)]">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-medium capitalize text-white tracking-tight">{currentSection}</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-white/5">
          <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">Managed Trial</span>
          <ToggleLeft size={20} className="text-[var(--accent)] cursor-pointer" />
          <span className="text-[11px] font-medium text-white uppercase tracking-wider">BYOK Mode</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:border-cyan-500/50 transition-colors cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.02)]">
            <User size={16} className="text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
