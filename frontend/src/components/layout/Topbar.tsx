'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, Search, UserPlus, Rocket, GitMerge, Bug } from 'lucide-react';

const QUICK_ACTIONS = [
  { icon: UserPlus, label: 'New Employee', href: '/dashboard/employees' },
  { icon: Rocket, label: 'Launch System', href: '/dashboard/systems' },
  { icon: GitMerge, label: 'App Window', href: '/dashboard/agent?focus=workspace' },
  { icon: Bug, label: 'Debug', href: '/dashboard/monitoring' },
];

// Map route segments to human-readable page names
const PAGE_NAMES: Record<string, string> = {
  'command-center': 'Command Center',
  'agent': 'Workspace',
  'builder': 'Agent Builder',
  'employees': 'AI Employees',
  'systems': 'Systems',
  'sandbox': 'App Window',
  'library': 'Library',
  'monitoring': 'Audit Log',
  'inbox': 'Live Inbox',
  'leads': 'Lead Pool',
  'analytics': 'Analytics',
  'squads': 'Squad Flow',
  'agents': 'Agent Matrix',
  'channels': 'Channels',
  'memory': 'Global Memory',
};

export const Topbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname() || '';
  const isDashboard = pathname.includes('/command-center');

  // Derive page name from pathname
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || '';
  const pageName = PAGE_NAMES[lastSegment] || 'Overview';

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-40 relative">
      {/* Left — dynamic page name */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-800">{pageName}</span>
      </div>

      {/* Middle — Quick Actions only on Command Center */}
      {isDashboard && (
        <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
          {QUICK_ACTIONS.map(({ icon: Icon, label, href }) => (
            <button key={label} onClick={() => router.push(href)}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors"
            >
              <Icon size={12} className="text-gray-500" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-xs cursor-text hover:bg-gray-100 transition-colors">
          <Search size={13} />
          <span>Search...</span>
          <kbd className="ml-6 text-gray-400 font-mono text-[10px]">⌘K</kbd>
        </div>

        <button className="text-gray-500 hover:text-gray-800 transition-colors relative">
          <Bell size={17} />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-400 rounded-full" />
        </button>

        <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer border border-gray-300">
          <span className="text-[10px] font-bold text-gray-600">AK</span>
        </div>
      </div>
    </header>
  );
};
