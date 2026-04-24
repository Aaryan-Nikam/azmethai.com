'use client';

import React, { useEffect, useState } from 'react';

interface FeedEvent {
  id: string;
  timestamp: string;
  status: 'ingested' | 'parsing' | 'success' | 'abort';
  file_name: string;
  confidence?: number;
  message?: string;
}

export default function ExtractionTicker() {
  const [events, setEvents] = useState<FeedEvent[]>([]);

  // Simulation of Webhook / Supabase realtime Feed for the Agent Operations
  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count % 3 === 0) {
        setEvents(prev => [{
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          status: 'success' as const,
          file_name: `inv-10${count}.pdf`,
          confidence: 0.98,
          message: 'Parsed 25+ fields. Net Terms extrapolated.'
        }, ...prev].slice(0, 15));
      } else if (count % 7 === 0) {
        setEvents(prev => [{
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          status: 'abort' as const,
          file_name: `contract_dpa_${count}.pdf`,
          confidence: 0.2,
          message: 'EXTRACTION_ABORT: Ambiguous clause detected.'
        }, ...prev].slice(0, 15));
      } else {
        setEvents(prev => [{
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          status: 'ingested' as const,
          file_name: `storage-uid-${count}.pdf`,
          message: 'Received via pg_net trigger -> BullMQ'
        }, ...prev].slice(0, 15));
      }
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'success': return 'border-l-emerald-500 bg-emerald-50 text-emerald-700';
      case 'abort': return 'border-l-red-500 bg-red-50 text-red-700';
      case 'parsing': return 'border-l-indigo-500 bg-indigo-50 text-indigo-700';
      default: return 'border-l-slate-400 bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 text-[11px]">
      {events.length === 0 ? (
        <div className="text-slate-400 text-center py-10 tracking-widest text-xs uppercase animate-pulse">
          Listening on Queue...
        </div>
      ) : (
        events.map((ev, i) => (
          <div key={ev.id} className={`p-3 border-l-2 rounded-r flex flex-col gap-1 transition-all ${getStatusColor(ev.status)} shadow-sm`}>
            <div className="flex justify-between items-center opacity-80 font-mono">
              <span>{ev.timestamp}</span>
              <span className="uppercase tracking-widest text-[9px] font-bold">{ev.status}</span>
            </div>
            <div className="text-slate-800 font-sans text-sm font-medium truncate mt-1">
              {ev.file_name}
            </div>
            <div className="text-slate-600 mt-1 leading-relaxed bg-white/50 p-2 rounded">
              {ev.message}
            </div>
            {ev.confidence && (
              <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex items-center">
                <div 
                  className={`h-full ${ev.confidence > 0.8 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                  style={{ width: `${ev.confidence * 100}%` }}
                />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
