import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Breach {
  id: string;
  vendor_id: string;
  breach_type: string;
  severity: string;
  evidence: string;
  status: string;
  due_date: string;
}

export function useBreaches(tenantId: string, vendorId: string | null) {
  const [breaches, setBreaches] = useState<Breach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId || !vendorId) return;

    let mounted = true;

    async function fetchBreaches() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('ae_compliance_breaches')
          .select('id, vendor_id, breach_type, severity, evidence, status, due_date')
          .eq('tenant_id', tenantId)
          .eq('vendor_id', vendorId)
          .in('status', ['pending_review', 'approved']); // Isolate open breaches

        if (error) throw error;
        
        if (mounted && data) {
          setBreaches(data as Breach[]);
        }
      } catch (err: any) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchBreaches();

    const channel = supabase.channel(`breaches-${vendorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ae_compliance_breaches', filter: `vendor_id=eq.${vendorId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBreaches(prev => [...prev, payload.new as Breach]);
          } else if (payload.eventType === 'UPDATE') {
            setBreaches(prev => prev.map(b => b.id === payload.new.id ? payload.new as Breach : b));
          } else if (payload.eventType === 'DELETE') {
            setBreaches(prev => prev.filter(b => b.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [tenantId, vendorId]);

  return { breaches, loading, error };
}
