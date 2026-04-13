'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Network, Search, Bot } from 'lucide-react';
import { mockEmployees, AIEmployee } from '@/lib/mock-data';

function EmployeeCard({ emp }: { emp: AIEmployee }) {
  return (
    <Card className="flex flex-col h-full !p-0 overflow-hidden cursor-pointer hover:border-slate-300">
      <div className="p-5 pb-0 flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Bot size={20} className="text-slate-600" />
           </div>
           <div>
             <h3 className="font-semibold text-slate-900 text-sm mb-0.5">{emp.name}</h3>
             <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{emp.role}</p>
           </div>
        </div>
        <Badge variant={
          emp.status === 'Executing' ? 'executing' : 
          emp.status === 'Online' ? 'online' : 
          emp.status === 'Building' ? 'building' : 'slate'
        }>{emp.status}</Badge>
      </div>

      <div className="px-5 grid grid-cols-2 gap-3 mb-5">
         <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex flex-col items-center justify-center">
           <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wide text-center">Tasks (7d)</span>
           <span className="text-lg font-bold text-slate-900 mt-0.5">{emp.tasksLast7d}</span>
         </div>
         <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex flex-col items-center justify-center">
           <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wide text-center">Workflows</span>
           <span className="text-lg font-bold text-slate-900 mt-0.5">{emp.workflowsOwned}</span>
         </div>
      </div>

      <div className="px-5 py-3.5 mt-auto border-t border-slate-100 bg-slate-50/50">
         <div className="flex items-center gap-2 mb-2.5">
           <Network size={14} className="text-slate-400" />
           <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Attached Systems:</span>
         </div>
         <div className="flex flex-wrap gap-2">
           {emp.systems.length > 0 ? emp.systems.map(sys => (
             <Badge key={sys} variant={sys === 'Sales Engine' ? 'cyan' : 'purple'} className="!text-[9px] !px-2">{sys}</Badge>
           )) : (
             <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Unattached</span>
           )}
         </div>
      </div>
    </Card>
  );
}

export default function AIEmployeesHub() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = mockEmployees.filter(emp => {
    if (filter !== 'All' && emp.role !== filter) return false;
    if (search && !emp.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-6 lg:p-10 pb-16 max-w-7xl mx-auto">
      <PageHeader 
        title="AI Employees" 
        description="Autonomous agents that build and run your workflows, tools, and systems."
        primaryAction={{ label: 'Create AI Employee', onClick: () => console.log('Create new') }}
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8 border-b border-slate-200 pb-6">
        <Tabs 
          activeTab={filter} 
          onChange={setFilter}
          tabs={[
            { id: 'All', label: 'All Roles' },
            { id: 'Sales', label: 'Sales' },
            { id: 'Ops', label: 'Operations' },
            { id: 'Distribution', label: 'Distribution' },
            { id: 'Support', label: 'Support' },
          ]} 
        />
        
        <div className="relative w-full md:w-64">
           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
             value={search}
             onChange={e => setSearch(e.target.value)}
             type="text" 
             placeholder="Search agents..." 
             className="w-full bg-white border border-slate-200 rounded-md py-1.5 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-shadow"
           />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filtered.map(emp => <EmployeeCard key={emp.id} emp={emp} />)}
         {filtered.length === 0 && (
           <div className="col-span-full py-24 flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
             <Bot size={32} className="text-slate-400 mb-4" />
             <p className="text-slate-500 font-medium text-sm text-center">No operatives match search criteria.</p>
           </div>
         )}
      </div>
    </div>
    </div>
  );
}
