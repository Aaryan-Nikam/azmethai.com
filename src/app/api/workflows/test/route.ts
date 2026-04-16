import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Mock Auth wrapper since NextAuth isn't fully set up in this repo yet
const auth = async () => ({ user: { id: "user_test_123" } });

export async function POST(req: NextRequest) {
  try {
    const { AzmethWorkflowEngine } = await import('@/lib/execution/AzmethWorkflowEngine');
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse workflow data directly from the canvas
    const body = await req.json();
    let { nodes, edges, inputData } = body;
    
    // Support workflow object wrapper if provided
    if (body.workflow) {
      nodes = nodes || body.workflow.nodes;
      edges = edges || body.workflow.edges;
    }
    
    if (!nodes || !edges) {
      return Response.json({ error: 'Missing workflow definition (nodes/edges)' }, { status: 400 });
    }
    
    const engine = new AzmethWorkflowEngine();
    
    // Construct the ad-hoc Azmeth workflow format for testing
    const workflowDef = {
      id: 'test-flow-' + Date.now(),
      name: 'Live Canvas Test',
      nodes,
      edges
    };
    
    const result = await engine.execute(
      workflowDef,
      session.user.id,
      inputData || {}
    );
    
    return Response.json(result);
    
  } catch (error: any) {
    console.error('Test Execution API error:', error);
    return Response.json(
      { error: error.message || 'Execution failed' },
      { status: 500 }
    );
  }
}
