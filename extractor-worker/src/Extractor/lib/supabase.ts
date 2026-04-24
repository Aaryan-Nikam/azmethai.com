import { createClient } from '@supabase/supabase-js';

function getValidUrl(urls: (string | undefined)[]): string {
  for (let u of urls) {
    if (!u) continue;
    u = u.trim();
    if (u === '' || u.includes('<') || u === 'your_supabase_url') continue;
    if (!u.startsWith('http')) u = `https://${u}`;
    return u;
  }
  return 'https://uruvtlrchjmnutgkanpl.supabase.co';
}

function getValidKey(keys: (string | undefined)[]): string {
  for (let k of keys) {
    if (!k) continue;
    k = k.trim();
    if (k === '' || k.includes('<') || k === 'your_supabase_key') continue;
    return k;
  }
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVydXZ0bHJjaGptbnV0Z2thbnBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTgxNDQsImV4cCI6MjA4OTY5NDE0NH0.6BjES6k9f9CkTKef6o6532lhuQkEolBVpU2IBWyew2A';
}

const supabaseUrl = getValidUrl([
  process.env.SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_URL
]);
const supabaseServiceKey = getValidKey([
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  process.env.SUPABASE_SERVICE_KEY,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
]);

// Service role client bypasses RLS, which is appropriate for a backend worker.
// The worker is trusted to insert records on behalf of organizations using the job payload's orgId.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
