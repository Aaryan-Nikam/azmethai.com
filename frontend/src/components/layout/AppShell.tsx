'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname() || '';
  const [isEmbedded, setIsEmbedded] = useState(false);
  const isAgentWorkspace = pathname === '/dashboard/agent';

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const embeddedFlag = params.get('embedded') === '1';
      setIsEmbedded(embeddedFlag || window.self !== window.top);
    } catch {
      setIsEmbedded(true);
    }
  }, []);

  if (isEmbedded || isAgentWorkspace) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
        <main className="h-full w-full overflow-hidden bg-slate-50">{children}</main>
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
