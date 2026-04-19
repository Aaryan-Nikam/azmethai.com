import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = createServerClient();
    const body = await req.json().catch(() => ({})) as { inputData?: Record<string, unknown> };

    const { data: nodes, error: nodeError } = await db
      .from('workflow_nodes')
      .select('id, state, label')
      .eq('workflow_id', params.id)
      .order('created_at', { ascending: true });

    if (nodeError) throw nodeError;

    if (!nodes || nodes.length === 0) {
      return NextResponse.json({ error: 'Workflow has no nodes to execute.' }, { status: 404 });
    }

    const draftNodes = nodes.filter((n: any) => n.state === 'draft');
    if (draftNodes.length > 0) {
      return NextResponse.json({
        requires_input: true,
        request: {
          key: 'workflow_approval',
          label: 'Draft Node Approval',
          question: `This workflow still has ${draftNodes.length} draft node(s). Should I approve all and continue execution?`,
          reason: 'Execution is blocked while draft nodes exist.',
          sensitive: false,
        },
        draft_nodes: draftNodes.map((n: any) => ({ id: n.id, label: n.label })),
      }, { status: 409 });
    }

    const now = new Date().toISOString();
    const nodeIds = nodes.map((n: any) => n.id);

    // Step 1: mark as running
    await db
      .from('workflow_nodes')
      .update({ state: 'running', updated_at: now })
      .in('id', nodeIds);

    // Step 2: simulate deterministic completion in-order
    await db
      .from('workflow_nodes')
      .update({ state: 'done', updated_at: new Date().toISOString() })
      .in('id', nodeIds);

    return NextResponse.json({
      ok: true,
      workflow_id: params.id,
      status: 'completed',
      executed_nodes: nodeIds.length,
      input_data_received: body.inputData || {},
      started_at: now,
      completed_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
