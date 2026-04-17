import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://uruvtlrchjmnutgkanpl.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVydXZ0bHJjaGptbnV0Z2thbnBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTgxNDQsImV4cCI6MjA4OTY5NDE0NH0.6BjES6k9f9CkTKef6o6532lhuQkEolBVpU2IBWyew2A';

// Service role client bypasses RLS, which is appropriate for a backend worker.
// The worker is trusted to insert records on behalf of organizations using the job payload's orgId.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
