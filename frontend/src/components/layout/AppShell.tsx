'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname() || '';
  const [shellMode, setShellMode] = useState<'app' | 'workspace' | 'surface'>(() => {
    if (typeof window === 'undefined') return 'app';
    try {
      const params = new URLSearchParams(window.location.search);
      const shell = params.get('shell');
      return shell === 'workspace' || shell === 'surface' ? shell : 'app';
    } catch {
      return 'app';
    }
  });
  const isAgentWorkspace = pathname === '/dashboard/agent';

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const shell = params.get('shell');
      if (shell === 'workspace' || shell === 'surface') {
        setShellMode(shell);
      } else {
        setShellMode('app');
      }
    } catch {
      setShellMode('app');
    }
  }, []);

  // When the agent workspace hosts the app in a side pane, we render the app chrome differently.
  // `shell=surface` renders only the page content; `shell=workspace` renders the app sidebar but
  // intentionally hides the app logo/footer so the agent pane can own the primary branding.
  if (shellMode !== 'app' || isAgentWorkspace) {
    const showSidebar = shellMode === 'workspace';
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
        <div className="flex h-full w-full overflow-hidden bg-slate-50">
          {showSidebar && (
            <Sidebar hideWorkspaceEntry hideBrand hideFooter />
          )}
          <main className="h-full min-w-0 flex-1 overflow-hidden bg-slate-50">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Global Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10 relative">
        <main className="flex-1 overflow-hidden relative bg-slate-50">
          <div className="h-full w-full">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};
