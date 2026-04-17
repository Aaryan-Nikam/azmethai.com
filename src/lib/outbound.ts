/**
 * Outbound Engine — Shared Lib
 * AI helpers (Kimi K2.5 for research/qualify, GPT-4o for personalise),
 * website fetcher, Supabase client, and pipeline chain utilities.
 */

import { createClient } from '@supabase/supabase-js';

// ─── Supabase ─────────────────────────────────────────────────────────────────

export function createOutboundClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://uruvtlrchjmnutgkanpl.supabase.co';
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVydXZ0bHJjaGptbnV0Z2thbnBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTgxNDQsImV4cCI6MjA4OTY5NDE0NH0.6BjES6k9f9CkTKef6o6532lhuQkEolBVpU2IBWyew2A';

  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OutboundCampaign {
  id: string;
  name: string;
  status: string;
  config: CampaignConfig;
  icp: object;
}

export interface CampaignConfig {
  /** Step 0: ICP */
  icp_summary?: string;
  industries?: string[];
  company_sizes?: string[];
  target_titles?: string[];
  geos?: string[];
  pain_points?: string;
  /** Step 1: Scraping */
  scrape_source?: 'apify' | 'crunchbase';
  actor_url?: string;
  apify_fields?: Record<string, unknown>;
  /** Step 2: Qualification */
  min_score?: number;
  required_signals?: string[];
  title_keywords?: string[];
  /** Step 3: Research */
  research_depth?: 'surface' | 'standard' | 'deep';
  /** Step 4: Personalisation */
  framework?: 'aida' | 'pas' | 'bab' | 'custom';
  custom_subject?: string;
  custom_body?: string;
  /** Step 5: Channels */
  channels?: string[];
}

export interface OutboundLead {
  id: string;
  campaign_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company: string | null;
  title: string | null;
  linkedin_url: string | null;
  website: string | null;
  source: string | null;
  raw_data: object;
  qualification_score: number | null;
  qualification_status: string;
  research_summary: string | null;
  stage: string;
}

export interface OutboundMessage {
  id: string;
  lead_id: string;
  campaign_id: string;
  channel: string;
  subject: string | null;
  body: string | null;
  framework: string | null;
  status: string;
  sent_at: string | null;
}

// ─── AI: Model Fetcher (OpenAI Standard Fallback) ──────────────────────────────

export async function callGPT4o(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY;

  if (azureEndpoint && azureKey) {
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o';
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? '2025-01-01-preview';
    const url = `${azureEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`GPT-4o Azure error ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  if (openAIKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  throw new Error('No OpenAI or Azure credentials configured');
}

// Reuse GPT-4o for Kimi tasks if Azure Kimi isn't configured, but standard OpenAI is.
export async function callKimi(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const endpoint = process.env.AZURE_KIMI_ENDPOINT;
  const apiKey = process.env.AZURE_KIMI_API_KEY;

  if (!endpoint || !apiKey) {
    // Fall back to standard OpenAI (gpt-4o-mini is best for simple fast tasks like qualification)
    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) throw new Error('Azure Kimi credentials and OpenAI fallback are not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI fallback API error ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  const apiVersion = process.env.AZURE_KIMI_API_VERSION ?? '2024-05-01-preview';
  const url = `${endpoint}/chat/completions?api-version=${apiVersion}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      model: process.env.AZMETH_MODEL_ID ?? 'kimi-K2.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1200,
      temperature: 0.3,
    }),
  });

  if (!response.ok) throw new Error(`Kimi API error ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// ─── Website Content Fetcher ──────────────────────────────────────────────────

/** 
 * Primary: plain fetch + HTML strip (fast, works for ~80% of sites).
 * Falls back to Browserbase for JS-rendered sites.
 */
export async function fetchWebsiteContent(url: string): Promise<string> {
  if (!url || !url.startsWith('http')) return '';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return await fetchWithBrowserbase(url);

    const html = await response.text();
    const text = stripHtml(html);

    // If we got very little content, the site requires JS — use Browserbase
    if (text.length < 200) return await fetchWithBrowserbase(url);

    return text.slice(0, 6000); // Cap at 6k chars for AI context
  } catch {
    return await fetchWithBrowserbase(url);
  }
}

/**
 * Browserbase fallback: spins up a real Chrome session via their REST API
 * and captures the rendered page text.
 */
export async function fetchWithBrowserbase(url: string): Promise<string> {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;
  if (!apiKey || !projectId) return '';

  try {
    // 1. Create a Browserbase session
    const sessionRes = await fetch('https://api.browserbase.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BB-API-Key': apiKey,
      },
      body: JSON.stringify({
        projectId,
        browserSettings: {
          viewport: { width: 1280, height: 720 },
        },
      }),
    });

    if (!sessionRes.ok) return '';
    const session = await sessionRes.json() as { id: string };

    // 2. Navigate and get content via Browserbase's REST extension
    const contentRes = await fetch(
      `https://api.browserbase.com/v1/sessions/${session.id}/content?url=${encodeURIComponent(url)}`,
      { headers: { 'X-BB-API-Key': apiKey } },
    );

    if (!contentRes.ok) return '';
    const { text } = await contentRes.json() as { text: string };

    // 3. Clean up session
    await fetch(`https://api.browserbase.com/v1/sessions/${session.id}`, {
      method: 'DELETE',
      headers: { 'X-BB-API-Key': apiKey },
    });

    return (text ?? '').slice(0, 6000);
  } catch {
    return '';
  }
}

// ─── HTML Stripper ────────────────────────────────────────────────────────────

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// ─── Pipeline Chain Helper ────────────────────────────────────────────────────

/**
 * Fire-and-forget: triggers the next pipeline stage for a lead.
 * Runs asynchronously so the caller can return immediately.
 */
export async function triggerStage(
  stage: 'research' | 'qualify' | 'personalise',
  leadId: string,
): Promise<void> {
  const db = createOutboundClient();
  try {
    const { data: lead } = await db
      .from('outbound_leads')
      .select('campaign_id')
      .eq('id', leadId)
      .single();

    if (lead?.campaign_id) {
      await db.from('outbound_queue').insert({
        type: stage,
        lead_id: leadId,
        campaign_id: lead.campaign_id,
        status: 'pending'
      });
    }
  } catch (err) {
    console.error(`[triggerStage] Failed to queue ${stage} for lead ${leadId}`, err);
  }
}

// ─── Apify Helpers ────────────────────────────────────────────────────────────

export interface ApifyRunResult {
  runId: string;
  datasetId: string;
  status: string;
}

export async function triggerApifyActor(
  actorUrl: string,
  inputConfig: Record<string, unknown>,
  webhookUrl?: string,
): Promise<ApifyRunResult> {
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) throw new Error('APIFY_API_KEY not configured in .env.local');

  // actorUrl is already the full run URL e.g.
  // https://api.apify.com/v2/acts/apify~linkedin-scraper/runs
  const url = new URL(actorUrl);
  url.searchParams.set('token', apiKey);
  if (webhookUrl) url.searchParams.set('webhookPayloadTemplate', JSON.stringify({ campaignId: '{{campaignId}}' }));

  const body: Record<string, unknown> = { ...inputConfig };
  if (webhookUrl) {
    body.webhooks = [
      {
        eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'],
        requestUrl: webhookUrl,
      },
    ];
  }

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Apify actor trigger failed: ${err}`);
  }

  const data = await res.json() as { data: { id: string; defaultDatasetId: string; status: string } };
  return {
    runId: data.data.id,
    datasetId: data.data.defaultDatasetId,
    status: data.data.status,
  };
}

export async function fetchApifyDataset(runId: string): Promise<Record<string, unknown>[]> {
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) throw new Error('APIFY_API_KEY not configured');

  const url = `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiKey}&format=json&limit=1000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch Apify dataset: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>[]>;
}

/** Normalise whatever shape an Apify actor returns into our lead schema */
export function normaliseLead(item: Record<string, unknown>): Partial<OutboundLead> {
  // Crunchbase actor often nests data in `properties` or `cards`
  const cbProps = (item.properties as Record<string, unknown>) || item;
  
  // Try to extract an initial contact if the scraper returns people arrays
  const contacts = Array.isArray(item.contacts) ? item.contacts : [];
  const firstContact = (contacts[0] as Record<string, unknown>) || {};

  const companyName = cbProps.title ?? cbProps.identifier?.value ?? item.companyName ?? item.company ?? item.organization ?? null;
  const companyWebsite = cbProps.website_url ?? item.website ?? item.companyWebsite ?? item.url ?? null;
  const linkedin = cbProps.linkedin?.value ?? item.linkedInUrl ?? item.profileUrl ?? item.linkedin ?? null;

  return {
    first_name: (firstContact.first_name ?? item.firstName ?? item.first_name ?? item.name?.toString().split(' ')[0] ?? null) as string | null,
    last_name: (firstContact.last_name ?? item.lastName ?? item.last_name ?? item.name?.toString().split(' ').slice(1).join(' ') ?? null) as string | null,
    email: (firstContact.email ?? item.email ?? item.workEmail ?? item.personalEmail ?? null) as string | null,
    company: companyName as string | null,
    title: (firstContact.title ?? cbProps.short_description ?? item.jobTitle ?? item.title ?? item.position ?? null) as string | null,
    linkedin_url: linkedin as string | null,
    website: companyWebsite as string | null,
    raw_data: item,
  };
}
