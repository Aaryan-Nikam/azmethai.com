import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface ExtractionJob {
  id: string;
  document_id: string;
  tenant_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  confidence_avg: number | null;
  latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
  failure_reason: string | null;
  document_name?: string; // Appended by join if possible
}

export function useExtractionJobs(tenantId: string) {
  const [jobs, setJobs] = useState<ExtractionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchJobs() {
      try {
        setLoading(true);
        // Fetch last 15 extraction jobs explicitly for this tenant with document join
        const { data, error: sbError } = await supabase
          .from('ae_extraction_jobs')
          .select(`
            id, document_id, tenant_id, status, confidence_avg, latency_ms, 
            input_tokens, output_tokens, created_at, failure_reason,
            document:ae_documents(original_filename)
          `)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(15);

        if (sbError) throw sbError;
        
        if (mounted && data) {
          const mappedJobs = data.map((job: any) => ({
            ...job,
            document_name: job.document?.original_filename || 'Unknown Document'
          }));
          setJobs(mappedJobs);
        }
      } catch (err: any) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchJobs();

    // Subscribe to realtime Postgres changes
    const channel = supabase.channel('schema-db-changes-jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ae_extraction_jobs', filter: `tenant_id=eq.${tenantId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newJob = payload.new as ExtractionJob;
            // Fetch document name explicitly since trigger won't have the foreign key join
            supabase.from('ae_documents').select('original_filename').eq('id', newJob.document_id).single()
              .then(({ data }) => {
                 setJobs(prev => [{...newJob, document_name: data?.original_filename || 'Processing Document'}, ...prev].slice(0, 15));
              });
          } else if (payload.eventType === 'UPDATE') {
             setJobs(prev => prev.map(job => 
                job.id === payload.new.id ? { ...job, ...payload.new } : job
             ));
          } else if (payload.eventType === 'DELETE') {
             setJobs(prev => prev.filter(job => job.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  return { jobs, loading, error };
}
