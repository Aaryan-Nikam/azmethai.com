/**
 * PATCH /api/agent-registry/[id]   — Update agent
 * DELETE /api/agent-registry/[id]  — Deactivate agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = createServerClient();
  const body = await req.json();

  const allowed = ['name', 'specializations', 'system_prompt', 'model', 'temperature', 'tools_enabled', 'is_active', 'priority'];
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) {
    if (k in body) patch[k] = body[k];
  }

  const { data, error } = await db.from('agent_registry').update(patch).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agent: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const db = createServerClient();
  // Soft delete — deactivate rather than hard delete (preserves assignment history)
  const { error } = await db.from('agent_registry').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
