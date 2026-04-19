/**
 * outbound-service.ts
 * ─────────────────────────────────────────────────────────────────
 * Pure service functions for the Outbound AI pipeline.
 * Called directly by the background worker (no HTTP round-trips).
 * Each API route now just enqueues a job and returns 200 immediately.
 * ─────────────────────────────────────────────────────────────────
 */

import {
  createOutboundClient,
  fetchWebsiteContent,
  callKimi,
  callGPT4o,
  triggerStage,
  CampaignConfig,
} from '@/lib/outbound';
import { resolveLatestDraftMessageIdForLead, sendOutboundMessageById } from '@/lib/outbound-email';

// ─── Research ────────────────────────────────────────────────────────────────

const RESEARCH_SYSTEM_PROMPT = `You are an expert B2B sales researcher. 
Your job is to analyse company information and produce a concise, sales-relevant research brief.
Focus on: what the company does, their stage/size, recent signals (hiring, funding, growth), 
likely pain points, and why they might be a good prospect.
Be specific and factual. Do not invent information. Keep it under 4 sentences.`;

export async function runResearch(lead_id: string): Promise<{ ok: boolean; summary?: string; skipped?: boolean }> {
  const db = createOutboundClient();

  const { data: lead, error: leadErr } = await db
    .from('outbound_leads')
    .select('*')
    .eq('id', lead_id)
    .single();

  if (leadErr || !lead) throw new Error(`Lead ${lead_id} not found`);

  const doneStages = ['researched', 'qualified', 'personalised', 'ready_to_send', 'sent', 'replied'];
  if (doneStages.includes(lead.stage)) return { ok: true, skipped: true };

  const { data: campaign } = await db
    .from('outbound_campaigns')
    .select('config')
    .eq('id', lead.campaign_id)
    .single();

  const config = (campaign?.config ?? {}) as { research_depth?: string };
  const depth = config.research_depth ?? 'standard';

  let websiteContent = '';
  if (lead.website) websiteContent = await fetchWebsiteContent(lead.website);

  let linkedinContent = '';
  if (depth !== 'surface' && lead.linkedin_url) {
    linkedinContent = await fetchWebsiteContent(lead.linkedin_url);
  }

  const contextParts: string[] = [];
  if (lead.company) contextParts.push(`Company: ${lead.company}`);
  if (lead.title) contextParts.push(`Lead's job title: ${lead.title}`);
  if (lead.first_name || lead.last_name)
    contextParts.push(`Lead name: ${[lead.first_name, lead.last_name].filter(Boolean).join(' ')}`);
  if (websiteContent) contextParts.push(`\n--- Website content ---\n${websiteContent.slice(0, 3000)}`);
  if (linkedinContent) contextParts.push(`\n--- LinkedIn content ---\n${linkedinContent.slice(0, 2000)}`);

  if (contextParts.length === 0) {
    await db.from('outbound_leads').update({
      research_summary: `${lead.company ?? 'Unknown company'} — no public web presence found.`,
      stage: 'researched',
    }).eq('id', lead_id);
    await triggerStage('qualify', lead_id);
    return { ok: true, summary: 'no_content' };
  }

  const userPrompt = `Write a concise B2B sales research brief:\n\n${contextParts.join('\n')}`;
  const summary = await callKimi(RESEARCH_SYSTEM_PROMPT, userPrompt);

  await db.from('outbound_leads').update({ research_summary: summary, stage: 'researched' }).eq('id', lead_id);
  await triggerStage('qualify', lead_id);
  return { ok: true, summary };
}

// ─── Qualify ─────────────────────────────────────────────────────────────────

const QUALIFY_SYSTEM_PROMPT = `You are a B2B sales qualification engine. 
Analyse the provided lead data against the ICP criteria and return ONLY valid JSON.
No extra text. No markdown. Just the raw JSON object.

JSON format:
{
  "score": <integer 0-100>,
  "status": "<qualified|rejected>",
  "reason": "<one-sentence explanation>",
  "signals_found": [<array of signal strings found>],
  "gaps": [<array of missing or disqualifying factors>]
}`;

export async function runQualify(lead_id: string): Promise<{ ok: boolean; score?: number; status?: string; skipped?: boolean }> {
  const db = createOutboundClient();

  const { data: lead, error: leadErr } = await db
    .from('outbound_leads')
    .select('*')
    .eq('id', lead_id)
    .single();

  if (leadErr || !lead) throw new Error(`Lead ${lead_id} not found`);

  const doneStages = ['qualified', 'personalised', 'ready_to_send', 'sent', 'replied'];
  if (doneStages.includes(lead.stage) && lead.qualification_status !== 'pending') {
    return { ok: true, skipped: true };
  }

  const { data: campaign } = await db
    .from('outbound_campaigns')
    .select('config, icp')
    .eq('id', lead.campaign_id)
    .single();

  const config = (campaign?.config ?? {}) as CampaignConfig;
  const minScore = config.min_score ?? 60;
  const requiredSignals = config.required_signals ?? [];
  const titleKeywords = config.title_keywords ?? [];
  const icpSummary = config.icp_summary ?? '';

  const userPrompt = `
ICP Summary: ${icpSummary || 'Target B2B companies, decision-makers, active buying signals'}
Minimum score threshold: ${minScore}/100
Required signals: ${requiredSignals.length ? requiredSignals.join(', ') : 'any'}
Required title keywords: ${titleKeywords.length ? titleKeywords.join(', ') : 'any decision-maker'}

Lead data:
- Name: ${[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown'}
- Title: ${lead.title || 'Unknown'}
- Company: ${lead.company || 'Unknown'}
- Email: ${lead.email ? 'Available' : 'Missing'}
- Website: ${lead.website || 'Not provided'}
- Research: ${lead.research_summary || 'No research available yet'}
`.trim();

  const raw = await callKimi(QUALIFY_SYSTEM_PROMPT, userPrompt);

  let result: { score: number; status: 'qualified' | 'rejected'; reason: string; signals_found: string[]; gaps: string[] };
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    result = JSON.parse(cleaned);
  } catch {
    result = { score: 40, status: 'rejected', reason: 'AI parse error — conservative rejection.', signals_found: [], gaps: [] };
  }

  const finalStatus: 'qualified' | 'rejected' = result.score >= minScore ? 'qualified' : 'rejected';

  await db.from('outbound_leads').update({
    qualification_score: Math.min(100, Math.max(0, result.score)),
    qualification_status: finalStatus,
    stage: 'qualified',
    research_summary: lead.research_summary
      ? `${lead.research_summary}\n\n[Qualification: ${result.reason} Score: ${result.score}/100]`
      : `[Qualification: ${result.reason} Score: ${result.score}/100]`,
  }).eq('id', lead_id);

  if (finalStatus === 'qualified') await triggerStage('personalise', lead_id);

  return { ok: true, score: result.score, status: finalStatus };
}

// ─── Personalise ─────────────────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are an elite B2B copywriter who writes 
cold outreach emails that get replies. You write in a direct, human, 
non-corporate voice. You never use buzzwords. You make every email feel 
like it was written specifically for one person at one company — because it was.`;

const FRAMEWORK_PROMPTS: Record<string, string> = {
  aida: `Write a cold outreach email using AIDA (Attention, Interest, Desire, Action). 3-5 short paragraphs. Max 150 words. First line must NOT start with "I" or "My company".`,
  pas:  `Write a cold outreach email using PAS (Problem, Agitate, Solution). 3 tight paragraphs. End with "Worth a quick chat?" Max 120 words.`,
  bab:  `Write a cold outreach email using BAB (Before, After, Bridge). 3 paragraphs. End with a 1-line CTA. Max 130 words.`,
};

function injectPlaceholders(template: string, lead: Record<string, unknown>): string {
  return template
    .replace(/{{first_name}}/g, (lead.first_name as string) ?? 'there')
    .replace(/{{last_name}}/g, (lead.last_name as string) ?? '')
    .replace(/{{company}}/g, (lead.company as string) ?? 'your company')
    .replace(/{{title}}/g, (lead.title as string) ?? 'your role')
    .replace(/{{website}}/g, (lead.website as string) ?? '')
    .replace(/{{linkedin_url}}/g, (lead.linkedin_url as string) ?? '')
    .replace(/{{pain_point}}/g, 'scaling outbound efficiently');
}

function safeParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()) as T;
  } catch { return null; }
}

export async function runPersonalise(lead_id: string): Promise<{ ok: boolean; message_id?: string; skipped?: boolean }> {
  const db = createOutboundClient();

  const { data: lead, error: leadErr } = await db.from('outbound_leads').select('*').eq('id', lead_id).single();
  if (leadErr || !lead) throw new Error(`Lead ${lead_id} not found`);

  if (lead.qualification_status !== 'qualified') return { ok: false };
  if (['personalised', 'ready_to_send', 'sent', 'replied'].includes(lead.stage)) return { ok: true, skipped: true };

  const { data: campaign } = await db.from('outbound_campaigns').select('config').eq('id', lead.campaign_id).single();
  const config = (campaign?.config ?? {}) as CampaignConfig;
  const framework = config.framework ?? 'aida';

  let subject: string;
  let body: string;

  if (framework === 'custom' && config.custom_body) {
    subject = injectPlaceholders(config.custom_subject ?? 'Quick note for {{company}}', lead);
    body = injectPlaceholders(config.custom_body, lead);
    const polishPrompt = `Polish this cold email copy to sound natural. Return only JSON: { "subject": "...", "body": "..." }\n\nSubject: ${subject}\n\nBody:\n${body}`;
    const raw = await callGPT4o(BASE_SYSTEM_PROMPT, polishPrompt);
    const parsed = safeParseJson<{ subject: string; body: string }>(raw);
    subject = parsed?.subject ?? subject;
    body = parsed?.body ?? body;
  } else {
    const frameworkPrompt = FRAMEWORK_PROMPTS[framework] ?? FRAMEWORK_PROMPTS.aida;
    const userPrompt = `${frameworkPrompt}\n\nLead context:\n- First name: ${lead.first_name ?? 'there'}\n- Company: ${lead.company ?? 'your company'}\n- Title: ${lead.title ?? 'decision maker'}\n- Research: ${lead.research_summary ?? 'Limited info'}\n\nReturn ONLY JSON: { "subject": "...", "body": "..." }`;
    const raw = await callGPT4o(BASE_SYSTEM_PROMPT, userPrompt);
    const parsed = safeParseJson<{ subject: string; body: string }>(raw);
    if (!parsed) throw new Error('GPT-4o returned unparseable response');
    subject = parsed.subject;
    body = parsed.body;
  }

  const { data: message, error: msgErr } = await db.from('outbound_messages').insert({
    lead_id: lead.id,
    campaign_id: lead.campaign_id,
    channel: 'email',
    subject,
    body,
    framework,
    status: 'draft',
  }).select().single();

  if (msgErr) throw msgErr;

  const autoSend = config.auto_send !== false;
  await db.from('outbound_leads').update({ stage: autoSend ? 'personalised' : 'ready_to_send' }).eq('id', lead_id);
  if (autoSend) await triggerStage('send', lead_id);
  return { ok: true, message_id: message?.id };
}

export async function runSend(lead_id: string): Promise<{ ok: boolean; message_id?: string; skipped?: boolean }> {
  const db = createOutboundClient();
  const { data: lead, error: leadErr } = await db
    .from('outbound_leads')
    .select('id, stage')
    .eq('id', lead_id)
    .single();

  if (leadErr || !lead) throw new Error(`Lead ${lead_id} not found`);
  if (['sent', 'replied'].includes(lead.stage)) return { ok: true, skipped: true };

  const messageId = await resolveLatestDraftMessageIdForLead(lead_id);
  if (!messageId) return { ok: true, skipped: true };

  await sendOutboundMessageById(messageId);
  return { ok: true, message_id: messageId };
}
