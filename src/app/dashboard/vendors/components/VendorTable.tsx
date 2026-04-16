'use client';

import React, { useState } from 'react';
import BreachDrawer from './BreachDrawer';
import { useVendors } from '@/hooks/compliance/useVendors';

// Generic tenantId placeholder; in a real app this comes from Context or JWT token
const CURRENT_TENANT_ID = '00000000-0000-0000-0000-000000000000'; // NOTE: The exact tenant token resolution varies

function SkeletonTable() {
  return (
    <div className="w-full animate-pulse p-4">
      <div className="h-10 bg-[#1f2025] rounded w-full mb-4"></div>
      <div className="space-y-3">
        <div className="h-12 bg-[#1a1a20] rounded w-full"></div>
        <div className="h-12 bg-[#1a1a20] rounded w-full"></div>
        <div className="h-12 bg-[#1a1a20] rounded w-full"></div>
      </div>
    </div>
  );
}

export default function VendorTable() {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  
  // Realtime hook fetching from Supabase
  const { vendors, loading, error } = useVendors(CURRENT_TENANT_ID);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'compliant': return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md text-xs font-semibold">Compliant</span>;
      case 'advisory': return <span className="px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md text-xs font-semibold">Advisory</span>;
      case 'breach': return <span className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md text-xs font-semibold">Breach</span>;
      case 'critical_breach': return <span className="px-2 py-1 bg-red-600/20 text-red-400 border border-red-500/50 rounded-md text-xs font-bold uppercase tracking-wider">Critical Breach</span>;
      default: return <span className="px-2 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded-md text-xs font-semibold">Pending</span>;
    }
  };

  const getRiskBadge = (risk: string) => {
    return <span className="text-gray-400 capitalize text-sm">{risk?.replace('_', ' ') || 'Standard'}</span>;
  };

  if (loading) return <SkeletonTable />;

  if (error) {
    return (
      <div className="w-full bg-red-900/20 border border-red-500/50 text-red-400 p-4 rounded-md">
        <strong>Vendor Matrix Failure:</strong> {error.message}
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="w-full p-8 text-center text-gray-500">
        No vendors currently anchored to this tenant.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#1f2025] bg-[#0d0d12] text-xs uppercase tracking-wider text-gray-500">
            <th className="py-4 px-6 font-medium">Vendor Name</th>
            <th className="py-4 px-6 font-medium">Category</th>
            <th className="py-4 px-6 font-medium">Risk Tier</th>
            <th className="py-4 px-6 font-medium">Status</th>
            <th className="py-4 px-6 font-medium">Open Breaches</th>
            <th className="py-4 px-6 font-medium">Next Expiry</th>
            <th className="py-4 px-6 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1f2025]">
          {vendors.map((vendor) => (
            <tr key={vendor.id} className="hover:bg-[#1a1a20] transition-colors group">
              <td className="py-4 px-6">
                <p className="font-semibold text-gray-100">{vendor.vendor_name}</p>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{vendor.id.split('-')[1] || vendor.id.substring(0, 8)}</p>
              </td>
              <td className="py-4 px-6 text-sm text-gray-400 capitalize">{vendor.category?.replace('_', ' ') || 'Unknown'}</td>
              <td className="py-4 px-6">{getRiskBadge(vendor.risk_tier)}</td>
              <td className="py-4 px-6">{getStatusBadge(vendor.overall_status)}</td>
              <td className="py-4 px-6">
                {vendor.open_breach_count > 0 ? (
                  <button 
                    onClick={() => setSelectedVendorId(vendor.id)}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer"
                  >
                    <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-xs">
                      {vendor.open_breach_count}
                    </span>
                    View Breaches
                  </button>
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </td>
              <td className="py-4 px-6">
                <div className="flex flex-col">
                  {vendor.next_expiry_date ? (
                    <>
                      <span className="text-sm font-medium text-gray-300">
                        {vendor.next_expiry_date}
                      </span>
                      <span className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                        {vendor.next_expiry_type?.replace(/_/g, ' ')}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </div>
              </td>
              <td className="py-4 px-6 text-right">
                <button className="text-sm text-gray-400 hover:text-white transition-colors">
                  Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedVendorId && (
        <BreachDrawer 
          vendorId={selectedVendorId} 
          tenantId={CURRENT_TENANT_ID}
          onClose={() => setSelectedVendorId(null)} 
        />
      )}
    </div>
  );
}
