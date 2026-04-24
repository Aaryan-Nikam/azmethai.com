'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, MessageSquareShare, Database, Activity, LayoutGrid, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard/agents', label: 'Agents', icon: Bot },
  { href: '/dashboard/channels', label: 'Channels', icon: MessageSquareShare },
  { href: '/dashboard/memory', label: 'Memory', icon: Database },
  { href: '/dashboard/squads', label: 'Squads', icon: LayoutGrid },
];

export default function Sidebar() {
  const pathname = usePathname() || '';

  return (
    <aside className="w-[280px] bg-[var(--bg)] flex flex-col py-6 px-4 z-20">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-[-0_0_15px_rgba(6,182,212,0.4)]">
          <Bot size={18} className="text-white" />
        </div>
        <span className="font-semibold text-lg tracking-tight">Azmeth AI</span>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link 
              key={href} 
              href={href} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                isActive 
                  ? 'bg-cyan-500/10 text-[var(--accent)] border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
              <span className="font-medium text-sm">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[var(--text-secondary)] hover:bg-white/5 hover:text-white transition-all duration-200">
          <Settings size={18} className="text-[var(--text-muted)]" />
          <span className="font-medium text-sm">Settings</span>
        </button>
      </div>
    </aside>
  );
}
