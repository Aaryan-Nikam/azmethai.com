/**
 * Pre-work: Migrate workflow execute route from Prisma → Supabase
 */
import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const ANON_USER = '00000000-0000-0000-0000-000000000000';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { AzmethWorkflowEngine } = await import('@/lib/execution/AzmethWorkflowEngine');
    const db = createServerClient();

    const { data: workflow, error } = await db
      .from('workflows')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (error) throw error;
    if (!workflow) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const body = await req.json();
    const inputData = body.inputData || {};

    const engine = new AzmethWorkflowEngine();
    const result = await engine.execute(
      workflow.flow_definition as any,
      ANON_USER,
      inputData
    );

    // Log execution
    await db.from('workflow_executions').insert({
      workflow_id: workflow.id,
      status: result.success ? 'success' : 'failed',
      started_at: new Date(Date.now() - (result.executionTime || 0)).toISOString(),
      completed_at: new Date().toISOString(),
      result: result.data || {},
      logs: { error: result.error },
    });

    return Response.json(result);
  } catch (error: any) {
    console.error('Execute API error:', error);
    return Response.json({ error: error.message || 'Execution failed' }, { status: 500 });
  }
}
