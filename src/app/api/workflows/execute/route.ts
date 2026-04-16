import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { AzmethWorkflowEngine } from '@/lib/execution/AzmethWorkflowEngine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nodes, edges, triggerPayload } = body;

    if (!nodes || !edges) {
      return NextResponse.json({ error: 'Nodes and edges are required' }, { status: 400 });
    }

    const engine = new AzmethWorkflowEngine(nodes, edges);
    
    // Start Execution
    const result = await engine.execute(triggerPayload);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Workflow Execution Error:', error);
    return NextResponse.json({ error: error.message || 'Execution Failed' }, { status: 500 });
  }
}
