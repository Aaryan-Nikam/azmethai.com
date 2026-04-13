'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, LayoutDashboard, Users, Cpu, GitMerge, FolderTree, Activity, Inbox, Users2, BarChart2, Rocket, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { AzmethLogo } from '@/components/ui/AzmethLogo';

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { href: '/dashboard/agent', icon: MessageSquare, label: 'Azmeth Agent' },
    ],
  },
  {
    label: 'Build',
    items: [
      { href: '/dashboard/command-center', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/employees', icon: Users, label: 'AI Employees' },
      { href: '/dashboard/systems', icon: Cpu, label: 'Systems' },
      { href: '/dashboard/sandbox', icon: GitMerge, label: 'Sandbox' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/dashboard/library', icon: FolderTree, label: 'Library' },
      { href: '/dashboard/monitoring', icon: Activity, label: 'Audit Log' },
    ],
  },
  {
    label: 'Sales Engine',
    items: [
      { href: '/dashboard/inbox', icon: Inbox, label: 'Live Inbox' },
      { href: '/dashboard/leads', icon: Users2, label: 'Leads CRM' },
      { href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' },
    ],
  },
  {
    label: 'Outbound Engine',
    items: [
      { href: '/dashboard/outbound', icon: Rocket, label: 'Campaigns' },
      { href: '/dashboard/outbound/leads', icon: Database, label: 'Lead Pool' },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname() || '';
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isHovered ? 240 : 64 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="border-r border-gray-200 bg-white flex flex-col shrink-0 z-50 shadow-sm relative overflow-hidden h-full"
    >
      {/* Logo area */}
      <div className="h-16 flex items-center border-b border-gray-100 min-w-[240px]">
        <div className="pl-5 flex w-full justify-start">
          <AzmethLogo size="md" variant={isHovered ? "full" : "icon"} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5 custom-scrollbar min-w-[240px]">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className={`text-[10px] uppercase font-semibold tracking-widest text-gray-400 px-3 mb-1.5 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                const isAgent = item.href === '/dashboard/agent';

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={!isHovered ? item.label : undefined}
                    className={`flex items-center rounded-lg text-sm transition-all overflow-hidden px-3 py-2 gap-3 mx-1 ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:scale-[1.02]'
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      className={`shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}
                    />
                    <motion.span 
                      initial={false}
                      animate={{ opacity: isHovered ? 1 : 0, width: isHovered ? 'auto' : 0 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                    {isAgent && isHovered && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-gray-900 text-white px-1.5 py-0.5 rounded shadow-sm shrink-0"
                      >
                        New
                      </motion.span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Status Footer */}
      <div className="p-2 mt-auto border-t border-gray-100 min-w-[240px]">
        <div className={`bg-gray-50 border border-gray-200 rounded-xl transition-all h-12 flex items-center ${isHovered ? 'p-3 flex-row gap-2' : 'justify-center'}`}>
          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <motion.div 
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0, width: isHovered ? 'auto' : 0 }}
            className="flex flex-col overflow-hidden whitespace-nowrap"
          >
            <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest leading-tight">Proxy Active</span>
            <span className="text-[9px] text-gray-400 font-mono leading-tight">api.azmeth.io</span>
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
};
