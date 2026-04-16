import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Vendor {
  id: string;
  vendor_name: string;
  category: string;
  risk_tier: string;
  overall_status: string;
  open_breach_count: number;
  next_expiry_date: string | null;
  next_expiry_type: string | null;
  last_reviewed_at: string | null;
}

export function useVendors(tenantId: string) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    let mounted = true;

    async function fetchVendors() {
      try {
        setLoading(true);
        // Initial fetch of ae_vendors for the tenant
        const { data, error } = await supabase
          .from('ae_vendors')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('next_expiry_date', { ascending: true, nullsFirst: false });

        if (error) throw error;
        
        if (mounted && data) {
          setVendors(data as Vendor[]);
        }
      } catch (err: any) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchVendors();

    // Subscribe to realtime Postgres changes
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ae_vendors', filter: `tenant_id=eq.${tenantId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setVendors(prev => [...prev, payload.new as Vendor]);
          } else if (payload.eventType === 'UPDATE') {
            setVendors(prev => prev.map(v => v.id === payload.new.id ? payload.new as Vendor : v));
          } else if (payload.eventType === 'DELETE') {
            setVendors(prev => prev.filter(v => v.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  return { vendors, loading, error };
}
