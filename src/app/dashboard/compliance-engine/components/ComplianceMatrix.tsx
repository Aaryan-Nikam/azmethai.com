'use client';

import React, { useState } from 'react';
import { useVendors } from '@/hooks/compliance/useVendors';
import GatewayTerminal from './GatewayTerminal';

const CURRENT_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export default function ComplianceMatrix() {
  const [activeTab, setActiveTab] = useState<'vendors' | 'payments' | 'employees'>('vendors');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const { vendors, loading, error } = useVendors(CURRENT_TENANT_ID);

  const handleEntitySelect = (id: string) => {
    setSelectedEntityId(id === selectedEntityId ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'compliant': return <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">Compliant</span>;
      case 'advisory': return <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">Advisory</span>;
      case 'breach': return <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">Breach</span>;
      case 'critical_breach': return <span className="text-red-900 bg-red-100 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border border-red-200">Critical</span>;
      default: return <span className="text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">Pending</span>;
    }
  };

  return (
    <div className="flex gap-8 h-full w-full relative">
      
      {/* Vault Structure */}
      <div className={`transition-all duration-500 ease-in-out ${selectedEntityId ? 'w-1/2 opacity-50' : 'w-full'} flex flex-col`}>
        
        {/* Minimalist Tabs */}
        <div className="flex gap-8 mb-6 border-b border-slate-100 pb-px">
          {['vendors', 'payments', 'employees'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab as any); setSelectedEntityId(null); }}
              className={`pb-4 px-1 text-xs font-semibold tracking-widest uppercase transition-all relative ${
                activeTab === tab ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'vendors' ? 'Vendors & DPA' : tab === 'payments' ? 'Cash Flow' : 'Credentials'}
              {activeTab === tab && (
                <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-slate-900"></span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Container - Extremely spacious table */}
        <div className="flex-1 w-full overflow-hidden flex flex-col pt-2">
          {activeTab === 'vendors' && (
            <div className="w-full h-full overflow-auto pr-4">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 z-10">
                  <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="py-4 px-2 font-semibold">Verification Target</th>
                    <th className="py-4 px-4 font-semibold">Tier Matrix</th>
                    <th className="py-4 px-4 font-semibold">State</th>
                    <th className="py-4 px-2 font-semibold text-right">Execute</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading && (
                    <tr><td colSpan={4} className="py-12 px-2 text-slate-400 text-sm italic font-serif">Awaiting Supabase response...</td></tr>
                  )}
                  {!loading && vendors.map((vendor) => (
                    <tr 
                      key={vendor.id} 
                      className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${selectedEntityId === vendor.id ? 'bg-slate-50/80' : ''}`}
                      onClick={() => {
                        if (vendor.open_breach_count > 0) handleEntitySelect(vendor.id);
                      }}
                    >
                      <td className="py-5 px-2">
                        <div className="font-semibold text-slate-900 tracking-tight text-sm">
                          {vendor.vendor_name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono uppercase">REF: {vendor.id.split('-')[0]}</div>
                      </td>
                      <td className="py-5 px-4 text-slate-500 capitalize text-sm">{vendor.risk_tier.replace('_', ' ')} / {vendor.category.replace('_', ' ')}</td>
                      <td className="py-5 px-4">{getStatusBadge(vendor.overall_status)}</td>
                      <td className="py-5 px-2 text-right">
                        <div className={`text-xs font-semibold uppercase tracking-widest ${
                            vendor.open_breach_count > 0 ? 'text-indigo-600 group-hover:text-indigo-800' : 'text-slate-300'
                        }`}>
                          {vendor.open_breach_count > 0 ? 'Review ➔' : 'Clear'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="py-12 px-4 text-slate-400 font-serif italic text-sm border-t border-slate-50">
               Cash Flow schedules currently pending live document upload binding...
            </div>
          )}
          
          {activeTab === 'employees' && (
            <div className="py-12 px-4 text-slate-400 font-serif italic text-sm border-t border-slate-50">
               Employee credential arrays syncing...
            </div>
          )}
        </div>
      </div>

      {/* Floating Modal / Overlay for Execution Terminal */}
      {selectedEntityId && (
        <div className="w-1/2 absolute right-0 top-0 h-full bg-white border-l border-slate-100 shadow-[-10px_0_30px_rgba(0,0,0,0.03)] z-50 animate-in slide-in-from-right-8 duration-300 flex flex-col">
          <GatewayTerminal 
            entityId={selectedEntityId} 
            tenantId={CURRENT_TENANT_ID}
            mode={activeTab}
            onClose={() => setSelectedEntityId(null)} 
          />
        </div>
      )}
    </div>
  );
}
