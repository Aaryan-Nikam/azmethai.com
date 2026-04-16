'use client';

import React, { useState } from 'react';
import { useBreaches } from '@/hooks/compliance/useBreaches';

export default function GatewayTerminal({ 
  entityId, 
  tenantId, 
  mode,
  onClose 
}: { 
  entityId: string, 
  tenantId: string, 
  mode: 'vendors' | 'payments' | 'employees',
  onClose: () => void 
}) {
  const [consequence, setConsequence] = useState('');
  const [signatory, setSignatory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionLog, setActionLog] = useState<string | null>(null);
  const [errorLog, setErrorLog] = useState<string | null>(null);

  const { breaches, loading, error } = useBreaches(tenantId, mode === 'vendors' ? entityId : null);

  const consequenceOptions = [
    'may entitle us to terminate the agreement per our standard terms.',
    'will result in immediate suspension of invoice processing.',
    'will be escalated to your corporate executive team for review.',
    'requires curing within the formal 30-day grace period.'
  ];

  const executeTerminalGate = async () => {
    setIsGenerating(true);
    setErrorLog(null);
    setActionLog(null);
    
    if (!signatory.trim()) {
       setErrorLog('Execution Blocked: authorised_signatory parameter is required.');
       setIsGenerating(false);
       return;
    }

    try {
      if (mode === 'vendors') {
        const res = await fetch('/api/approvals/compliance-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendorId: entityId, tenantId, consequence, authorised_signatory: signatory })
        });

        if (!res.ok) {
          const payload = await res.json();
          throw new Error(payload.error || 'Server Gate Rejection.');
        }

        setActionLog(`Success: Execution authorized and committed to ae_audit_log.`);
        setTimeout(onClose, 2500);
      } else {
        throw new Error('Terminal Gate locked for non-vendor arrays.');
      }
    } catch (err: any) {
      setErrorLog(`${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full font-sans bg-white relative">
      <div className="p-8 pb-6 flex justify-between items-start shrink-0">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Execution Gate</h2>
          <p className="text-xs text-slate-500 font-mono mt-2 tracking-wider">TARGET: {entityId.split('-')[0]}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 p-2 rounded-full">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 1l12 12m0-12L1 13"></path></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 space-y-5">
        {mode !== 'vendors' ? (
           <div className="text-slate-400 italic font-serif mt-10">Workflow parameters pending resolution...</div>
        ) : (
          <>
            {error && <div className="text-red-600 text-xs font-mono bg-red-50 p-3 rounded">{error.message}</div>}
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                 <div className="h-24 bg-slate-50 rounded-xl w-full"></div>
                 <div className="h-24 bg-slate-50 rounded-xl w-full"></div>
              </div>
            ) : breaches.map((b, i) => (
              <div key={b.id} className="bg-white border border-slate-100 p-5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center mb-3 border-b border-slate-50 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                     {b.breach_type.replace(/_/g, ' ')}
                  </h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                    DUE: {b.due_date || 'IMMEDIATE'}
                  </span>
                </div>
                <div className="flex gap-3">
                  <div className="w-1 bg-red-100 rounded-full shrink-0"></div>
                  <p className="text-sm text-slate-600 leading-relaxed font-serif">
                    "{b.evidence}"
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="p-8 pt-6 border-t border-slate-100 shrink-0 space-y-5 bg-white">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-1">Authorization Block</h3>
        <div>
           <input 
             type="text" 
             placeholder="Authorised Signatory [Required]" 
             className="w-full bg-slate-50 border-transparent rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-slate-200 focus:ring-2 focus:ring-slate-100 transition-all font-mono placeholder:text-slate-400"
             value={signatory}
             onChange={e => setSignatory(e.target.value)}
           />
        </div>
        
        <div>
          <select 
            className="w-full bg-slate-50 border-transparent rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-slate-200 focus:ring-2 focus:ring-slate-100 transition-all font-serif cursor-pointer appearance-none"
            value={consequence}
            onChange={e => setConsequence(e.target.value)}
          >
            <option value="" disabled className="text-slate-400">Select Workflow Consequence...</option>
            {consequenceOptions.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {errorLog && (
          <div className="p-3 bg-red-50 text-red-600 text-[10px] uppercase tracking-widest font-bold rounded-lg break-words text-center">
            {errorLog}
          </div>
        )}

        {actionLog && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-[10px] uppercase tracking-widest font-bold rounded-lg break-words text-center">
            {actionLog}
          </div>
        )}

        <button 
          disabled={!consequence || isGenerating || breaches.length === 0}
          onClick={executeTerminalGate}
          className="w-full py-3.5 bg-slate-900 text-white font-semibold text-sm rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 shadow-md mt-2"
        >
          {isGenerating ? <span className="animate-pulse">Authorizing Protocol...</span> : 'Execute Compliance Action'}
        </button>
      </div>
    </div>
  );
}
