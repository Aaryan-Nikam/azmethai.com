'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, MessageSquareShare, Database, Activity, LayoutGrid, Settings, Power } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard/agents', icon: Bot, tooltip: 'Agent Matrix' },
  { href: '/dashboard/channels', icon: MessageSquareShare, tooltip: 'Channels' },
  { href: '/dashboard/memory', icon: Database, tooltip: 'Global RAG Memory' },
  { href: '/dashboard/squads', icon: LayoutGrid, tooltip: 'Squad Flow' },
];

export default function NarrowRail() {
  const pathname = usePathname() || '';

  return (
    <aside className="w-[60px] bg-transparent flex flex-col items-center py-4 z-20 border-r border-white/5 shadow-[20px_0_40px_rgba(0,0,0,0.5)]">
      <div className="mb-8 p-0.5 rounded-lg bg-gradient-to-tr from-[#00E5FF] to-[#9D4EDD] shadow-[0_0_20px_rgba(0,229,255,0.4)]">
         <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center">
            <Bot size={18} className="text-white" />
         </div>
      </div>

      <nav className="flex-1 space-y-4 w-full flex flex-col items-center">
        {NAV_ITEMS.map(({ href, icon: Icon, tooltip }) => {
          const isActive = pathname.startsWith(href);
          return (
            <div key={href} className="relative group">
              <Link 
                href={href} 
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 shadow-[0_0_15px_rgba(0,229,255,0.2)]' 
                    : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                }`}
              >
                <Icon size={18} className="transition-transform group-hover:scale-110" />
              </Link>
              {/* Tooltip */}
              <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-[var(--surface-3)] border border-white/10 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl">
                 {tooltip}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 w-full flex flex-col items-center">
        <button className="w-10 h-10 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
          <Settings size={18} />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500/50 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
          <Power size={18} />
        </button>
      </div>
    </aside>
  );
}
