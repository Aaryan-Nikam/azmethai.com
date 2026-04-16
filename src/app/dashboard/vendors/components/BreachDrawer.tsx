'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useBreaches } from '@/hooks/compliance/useBreaches';

export default function BreachDrawer({ vendorId, tenantId, onClose }: { vendorId: string, tenantId: string, onClose: () => void }) {
  const [consequence, setConsequence] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Hook directly subscribing to Supabase pg_changes for real-time drawer updates
  const { breaches, loading, error } = useBreaches(tenantId, vendorId);

  // The consequence list defined structurally rejecting AI hallucinations
  const consequenceOptions = [
    'may entitle us to terminate the agreement per our standard terms.',
    'will result in immediate suspension of invoice processing.',
    'will be escalated to your corporate executive team for review.',
    'requires curing within the formal 30-day grace period.'
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      // Connect to the actual Express API router inside /api/approvals 
      const res = await fetch('/api/approvals/compliance-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          tenantId,
          consequence: consequence,
          authorised_signatory: 'AZMETH_AUTO_SIG' // Required by strict backend rules
        })
      });

      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || 'API routing bounds enforcement block');
      }

      alert('Batch generated successfully and logged into ae_audit_log.');
      onClose();
    } catch (err: any) {
      setGenerationError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-2xl bg-[#0a0a0d] border-l border-[#1f2025] h-full overflow-y-auto flex flex-col shadow-2xl">
        <div className="p-6 border-b border-[#1f2025] flex justify-between items-center bg-[#121217]">
          <div>
            <h2 className="text-xl font-semibold text-white">Open Breaches</h2>
            <p className="text-sm text-gray-400 mt-1">Vendor ID: {vendorId}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-900/20 text-red-500 rounded border border-red-900/50">
              Database Sync Failed: {error.message}
            </div>
          )}
          
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-[#1f2025] rounded-xl w-full"></div>
              <div className="h-24 bg-[#1f2025] rounded-xl w-full"></div>
            </div>
          ) : breaches.length === 0 ? (
            <p className="text-gray-500 p-4 border border-dashed border-[#1f2025] rounded-lg text-center">
              No open breaches found.
            </p>
          ) : (
            breaches.map((breach) => (
              <Card key={breach.id} className="p-5 bg-[#121217] border-[#1f2025] flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-1 bg-red-600/20 text-red-400 border border-red-500/50 rounded-md text-xs font-bold uppercase tracking-wider">
                    {breach.severity} Severity
                  </span>
                  <span className="text-sm font-medium text-red-400">Due: {breach.due_date}</span>
                </div>
                <h3 className="text-base font-medium text-white">{breach.breach_type.replace(/_/g, ' ').toUpperCase()}</h3>
                <p className="text-sm text-gray-400 leading-relaxed bg-black/30 p-3 rounded-md border border-[#1f2025]">
                  {breach.evidence}
                </p>
              </Card>
            ))
          )}
        </div>

        <div className="p-6 border-t border-[#1f2025] bg-[#121217] space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Demand Consequence (Mandatory)
            </label>
            <select 
              className="w-full bg-[#0a0a0d] border border-[#1f2025] rounded-md px-3 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500"
              value={consequence}
              onChange={e => setConsequence(e.target.value)}
            >
              <option value="" disabled>-- Select explicit consequence clause --</option>
              {consequenceOptions.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {generationError && (
            <p className="text-xs text-red-500">{generationError}</p>
          )}

          <button 
            disabled={!consequence || isGenerating || breaches.length === 0}
            onClick={handleGenerate}
            className="w-full py-3 bg-white text-black font-medium text-sm rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isGenerating ? (
              <span className="animate-pulse">Batching Demand Draft...</span>
            ) : (
              'Generate Bulk Review Notice'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
