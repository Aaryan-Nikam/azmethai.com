import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client — used in /api routes only.
 * Uses server-only env vars (no NEXT_PUBLIC_ prefix).
 * Never called from browser code.
 */
export function createServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment');
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
