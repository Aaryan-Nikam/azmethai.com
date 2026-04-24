import React from 'react';

interface TabItem {
  id: string;
  label: string;
  badge?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg border border-slate-200">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              isActive 
                ? 'text-slate-900 bg-white shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
