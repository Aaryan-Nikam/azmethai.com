/**
 * Pre-work: Migrate workflows route from Prisma → Supabase
 * Removes the only runtime Prisma dependency so we can delete prisma.ts
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const ANON_USER = '00000000-0000-0000-0000-000000000000'; // temporary until Auth is wired

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = createServerClient();
    const body = await req.json();

    const { data: existing } = await db
      .from('workflows')
      .select('id')
      .eq('id', params.id)
      .maybeSingle();

    if (!existing) {
      const { data, error } = await db.from('workflows').insert({
        id: params.id,
        user_id: ANON_USER,
        name: body.name || 'Untitled Workflow',
        description: body.description || '',
        status: 'draft',
        flow_definition: body.data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await db.from('workflows').update({
      name: body.name,
      description: body.description,
      flow_definition: body.data,
      updated_at: new Date().toISOString(),
    }).eq('id', params.id).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Workflow API] PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = createServerClient();
    const { data, error } = await db
      .from('workflows')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Workflow API] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
