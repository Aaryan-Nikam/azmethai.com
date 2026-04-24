import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = createServerClient();

    const [{ data: workflow, error: workflowError }, { data: nodes, error: nodesError }, { data: edges, error: edgesError }] = await Promise.all([
      db.from('workflows').select('*').eq('id', params.id).maybeSingle(),
      db.from('workflow_nodes').select('*').eq('workflow_id', params.id),
      db.from('workflow_edges').select('*').eq('workflow_id', params.id),
    ]);

    if (workflowError && workflowError.code !== 'PGRST116') throw workflowError;
    if (nodesError) throw nodesError;
    if (edgesError) throw edgesError;

    return NextResponse.json({
      workflow: workflow || { id: params.id, name: 'Untitled Workflow' },
      nodes: nodes || [],
      edges: edges || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = createServerClient();
    const body = await req.json() as {
      name?: string;
      data?: {
        nodes?: Array<Record<string, unknown>>;
        edges?: Array<Record<string, unknown>>;
      };
    };

    const now = new Date().toISOString();
    const workflowName = typeof body.name === 'string' && body.name.trim().length
      ? body.name.trim()
      : 'Untitled Workflow';

    const { error: workflowError } = await db
      .from('workflows')
      .upsert({ id: params.id, name: workflowName, updated_at: now }, { onConflict: 'id' });

    if (workflowError) throw workflowError;

    const nodes = Array.isArray(body.data?.nodes) ? body.data!.nodes : [];
    const edges = Array.isArray(body.data?.edges) ? body.data!.edges : [];

    if (nodes.length > 0) {
      const nodeRows = nodes.map((node, idx) => ({
        id: typeof node.id === 'string' ? node.id : undefined,
        workflow_id: params.id,
        type: typeof node.type === 'string' ? node.type : 'action',
        label: typeof (node as any)?.label === 'string' ? (node as any).label : `Node ${idx + 1}`,
        config: typeof (node as any)?.config === 'object' && (node as any).config !== null ? (node as any).config : {},
        state: typeof (node as any)?.state === 'string' ? (node as any).state : 'draft',
        position_x: Number((node as any)?.position_x ?? (node as any)?.position?.x ?? 200),
        position_y: Number((node as any)?.position_y ?? (node as any)?.position?.y ?? 200),
        updated_at: now,
      }));

      const { error: nodeError } = await db
        .from('workflow_nodes')
        .upsert(nodeRows, { onConflict: 'id' });

      if (nodeError) throw nodeError;
    }

    if (edges.length > 0) {
      const edgeRows = edges
        .map((edge) => ({
          id: typeof edge.id === 'string' ? edge.id : undefined,
          workflow_id: params.id,
          source_id: typeof (edge as any)?.source_id === 'string' ? (edge as any).source_id : (edge as any)?.source,
          target_id: typeof (edge as any)?.target_id === 'string' ? (edge as any).target_id : (edge as any)?.target,
          updated_at: now,
        }))
        .filter((edge) => typeof edge.source_id === 'string' && typeof edge.target_id === 'string');

      if (edgeRows.length > 0) {
        const { error: edgeError } = await db
          .from('workflow_edges')
          .upsert(edgeRows, { onConflict: 'id' });

        if (edgeError) throw edgeError;
      }
    }

    return NextResponse.json({ ok: true, workflow_id: params.id, nodes_saved: nodes.length, edges_saved: edges.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
