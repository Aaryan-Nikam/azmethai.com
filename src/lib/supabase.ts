import { createClient } from '@supabase/supabase-js';

function getValidUrl(urls: (string | undefined)[]): string {
  for (let u of urls) {
    if (!u) continue;
    u = u.trim();
    if (u === '' || u.includes('<') || u === 'your_supabase_url') continue;
    if (!u.startsWith('http')) u = `https://${u}`;
    return u;
  }
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment.");
}

function getValidKey(keys: (string | undefined)[]): string {
  for (let k of keys) {
    if (!k) continue;
    k = k.trim();
    if (k === '' || k.includes('<') || k === 'your_supabase_key') continue;
    return k;
  }
  throw new Error("Missing Supabase API key in environment.");
}

/**
 * Client-side Supabase client singleton — used in React components ("use client")
 * Safely wraps browser-accessible public env variables or defaults.
 */
export const supabase = createClient(
  getValidUrl([process.env.NEXT_PUBLIC_SUPABASE_URL]),
  getValidKey([process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY])
);

/**
 * Server-side Supabase client — used in /api routes only.
 * Uses server-only env vars (no NEXT_PUBLIC_ prefix).
 * Requires the SERVICE ROLE key — never call from browser code.
 */
export function createServerClient() {
  const url = getValidUrl([process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL]);
  // Try service role key first, then fall back to legacy env name
  // NEVER fall back to anon key — server routes require service_role to bypass RLS
  const key = getValidKey([
    process.env.SUPABASE_SERVICE_ROLE_KEY,  // preferred name
    process.env.SUPABASE_SERVICE_KEY,       // legacy name (kept for compat)
  ]);
  
  if (!key) {
    throw new Error(
      'Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY in your environment variables. ' +
      'Get it from: Supabase Dashboard → Project Settings → API → service_role (secret)'
    );
  }
  
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type Channel = 'instagram' | 'whatsapp' | 'email' | 'linkedin' | 'voice';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'meeting_set' | 'disqualified';

export interface ChatLead {
  lead_id: string;
  channel: Channel;
  sender_name: string;
  sender_contact: string;
  latest_score: number;
  last_intent: string | null;
  paused: boolean;
  last_seen: string;
  status: LeadStatus;
  agent_name: string;
  starred: boolean;
  company_name: string | null;
  role_title: string | null;
}

export interface ChatMessage {
  id: number;
  session_id: string;
  message: {
    type: 'human' | 'ai';
    content: string;
  };
}

export interface AgentConfig {
  id: string;
  business_name: string | null;
  business_description: string | null;
  brand_voice: string;
  knowledge_base: string | null;
  model_provider: string;
  model_version: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string | null;
  fallback_message: string;
  primary_goal: string;
  strict_boundaries: string | null;
  llm_billing_mode: 'trial' | 'custom';
  provider_api_key: string | null;
}
