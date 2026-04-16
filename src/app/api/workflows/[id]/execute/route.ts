import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'edge';
import prisma from '@/lib/prisma';

// Mock Auth wrapper since NextAuth isn't fully set up in this repo yet
const auth = async () => ({ user: { id: "user_test_123" } });

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { AzmethWorkflowEngine } = await import('@/lib/execution/AzmethWorkflowEngine');
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get workflow from database
    const workflow = await prisma.workflow.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });
    
    if (!workflow) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }
    
    // Parse input data from request body
    const body = await req.json();
    const inputData = body.inputData || {};
    
    // Execute workflow using the local Azmeth engine
    const engine = new AzmethWorkflowEngine();
    const result = await engine.execute(
      workflow.flowDefinition as any, // Azmeth workflow format stored in JSON
      session.user.id,
      inputData
    );
    
    // Save execution log telemetry
    await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        status: result.success ? 'success' : 'failed',
        startedAt: new Date(Date.now() - (result.executionTime || 0)),
        completedAt: new Date(),
        result: result.data || {},
        logs: { error: result.error } // Store error in JSON logs block
      }
    });
    
    return Response.json(result);
    
  } catch (error: any) {
    console.error('Execute API error:', error);
    return Response.json(
      { error: error.message || 'Execution failed' },
      { status: 500 }
    );
  }
}
