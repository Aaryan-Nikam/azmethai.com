/**
 * GET  /api/agent-registry          — List all agents
 * POST /api/agent-registry          — Create a new agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const activeOnly = searchParams.get('active_only') !== 'false';

  const db = createServerClient();
  let query = db.from('agent_registry').select('*').order('priority', { ascending: false });
  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agents: data });
}

export async function POST(req: NextRequest) {
  const db = createServerClient();
  const body = await req.json();

  const { data, error } = await db.from('agent_registry').insert({
    name: body.name,
    specializations: body.specializations || ['*'],
    system_prompt: body.system_prompt,
    model: body.model || 'gpt-4o-mini',
    temperature: body.temperature ?? 0.3,
    tools_enabled: body.tools_enabled || [],
    priority: body.priority ?? 0,
    is_active: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agent: data });
}
