/**
 * agent-router.ts
 * Queries the agent_registry and routes an incoming message to the right agent
 * based on classified intent. Falls back to the catch-all (*) agent.
 */

import { createServerClient } from '@/lib/supabase';
import { type IntentType } from '@/lib/intent-classifier';

export interface RoutedAgent {
  id: string;
  name: string;
  system_prompt: string;
  model: string;
  temperature: number;
  tools_enabled: string[];
}

export async function routeToAgent(intent: IntentType): Promise<RoutedAgent | null> {
  const db = createServerClient();

  // Fetch all active agents ordered by priority desc
  const { data: agents, error } = await db
    .from('agent_registry')
    .select('id, name, specializations, system_prompt, model, temperature, tools_enabled, priority')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error || !agents?.length) return null;

  // 1. Try exact intent match first (highest priority agent wins)
  const exactMatch = agents.find(a =>
    Array.isArray(a.specializations) && a.specializations.includes(intent)
  );
  if (exactMatch) return exactMatch as RoutedAgent;

  // 2. Fall back to catch-all agent (specializations includes '*')
  const catchAll = agents.find(a =>
    Array.isArray(a.specializations) && a.specializations.includes('*')
  );
  if (catchAll) return catchAll as RoutedAgent;

  // 3. Return the highest-priority agent if no match at all
  return agents[0] as RoutedAgent;
}

/**
 * Generate a reply using the routed agent's config + the full conversation context.
 * Returns the draft reply text.
 */
export async function generateAgentReply(
  agent: RoutedAgent,
  messageHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  currentMessage: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return '';

  const messages = [
    { role: 'system', content: agent.system_prompt },
    ...messageHistory.slice(-6), // Keep last 6 messages for context
    { role: 'user', content: currentMessage },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: agent.model || 'gpt-4o-mini',
        messages,
        max_tokens: 400,
        temperature: agent.temperature ?? 0.3,
      }),
    });

    if (!response.ok) return '';
    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  } catch {
    return '';
  }
}
