'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, LayoutDashboard, Users, Cpu, GitMerge, FolderTree, Activity, Inbox, Users2, BarChart2, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { AzmethLogo } from '@/components/ui/AzmethLogo';

export interface SidebarNavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface SidebarNavGroup {
  label: string | null;
  items: SidebarNavItem[];
}

interface SidebarProps {
  forceExpanded?: boolean;
  hideWorkspaceEntry?: boolean;
  hideBrand?: boolean;
  activeHref?: string;
  onNavigate?: (href: string) => void;
  hideFooter?: boolean;
}

export const NAV_GROUPS: SidebarNavGroup[] = [
  {
    label: null,
    items: [
      { href: '/dashboard/agent', icon: MessageSquare, label: 'Workspace' },
    ],
  },
  {
    label: 'Build',
    items: [
      { href: '/dashboard/command-center', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/employees', icon: Users, label: 'AI Employees' },
      { href: '/dashboard/systems', icon: Cpu, label: 'Systems' },
      { href: '/dashboard/sandbox', icon: GitMerge, label: 'App Window' },
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
      { href: '/dashboard/leads', icon: Users2, label: 'Lead Pool' },
      { href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' },
    ],
  },
  {
    label: 'Outbound Engine',
    items: [
      { href: '/dashboard/outbound', icon: Rocket, label: 'Campaigns' },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  forceExpanded,
  hideWorkspaceEntry = false,
  hideBrand = false,
  activeHref,
  onNavigate,
  hideFooter = false,
}) => {
  const pathname = usePathname() || '';
  const [isHovered, setIsHovered] = useState(false);
  const isControlled = typeof forceExpanded === 'boolean';
  const isExpanded = isControlled ? forceExpanded : isHovered;
  const navGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: hideWorkspaceEntry
      ? group.items.filter((item) => item.href !== '/dashboard/agent')
      : group.items,
  })).filter((group) => group.items.length > 0);

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isExpanded ? 240 : 64 }}
      onMouseEnter={() => {
        if (!isControlled) setIsHovered(true);
      }}
      onMouseLeave={() => {
        if (!isControlled) setIsHovered(false);
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative z-50 flex h-full shrink-0 flex-col overflow-hidden border-r border-[#e7e1d6] bg-[#fcfbf7] shadow-sm"
    >
      {!hideBrand && (
        <div className="h-16 flex items-center border-b border-gray-100 min-w-[240px]">
          <div className="pl-5 flex w-full justify-start">
            <AzmethLogo size="md" variant={isExpanded ? "full" : "icon"} />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto px-2 ${hideBrand ? 'py-3' : 'py-4'} space-y-5 custom-scrollbar min-w-[240px]`}>
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              isExpanded ? (
                <p className="text-[10px] uppercase font-semibold tracking-widest text-gray-400 px-3 mb-1.5 transition-opacity duration-200">
                  {group.label}
                </p>
              ) : (
                <div className="px-3 mb-2">
                  <div className="h-px w-6 rounded-full bg-gray-200" />
                </div>
              )
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeHref ? activeHref.startsWith(item.href) : pathname.startsWith(item.href);
                const Icon = item.icon;
                const isAgent = item.href === '/dashboard/agent';
                const itemClasses = `flex items-center rounded-lg text-sm transition-all overflow-hidden px-3 py-2 gap-3 mx-1 ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:scale-[1.02]'
                }`;
                const content = (
                  <>
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      className={`shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}
                    />
                    <motion.span 
                      initial={false}
                      animate={{ opacity: isExpanded ? 1 : 0, width: isExpanded ? 'auto' : 0 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                    {isAgent && isExpanded && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-gray-900 text-white px-1.5 py-0.5 rounded shadow-sm shrink-0"
                      >
                        New
                      </motion.span>
                    )}
                  </>
                );

                if (onNavigate) {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      title={!isExpanded ? item.label : undefined}
                      onClick={() => onNavigate(item.href)}
                      className={itemClasses}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={!isExpanded ? item.label : undefined}
                    className={itemClasses}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Status Footer */}
      {!hideFooter && (
        <div className="p-2 mt-auto border-t border-gray-100 min-w-[240px]">
          <div className={`bg-gray-50 border border-gray-200 rounded-xl transition-all h-12 flex items-center ${isExpanded ? 'p-3 flex-row gap-2' : 'justify-center'}`}>
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <motion.div 
              initial={false}
              animate={{ opacity: isExpanded ? 1 : 0, width: isExpanded ? 'auto' : 0 }}
              className="flex flex-col overflow-hidden whitespace-nowrap"
            >
              <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest leading-tight">Proxy Active</span>
              <span className="text-[9px] text-gray-400 font-mono leading-tight">api.azmeth.io</span>
            </motion.div>
          </div>
        </div>
      )}
    </motion.aside>
  );
};
