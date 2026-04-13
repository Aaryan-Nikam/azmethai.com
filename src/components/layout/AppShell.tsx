import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Global Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10 relative">
        <Topbar />
        
        <main className="flex-1 overflow-hidden relative bg-slate-50">
          <div className="h-full w-full">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};
