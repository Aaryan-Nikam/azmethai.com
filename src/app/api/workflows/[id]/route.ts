import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'edge';
import prisma from '@/lib/prisma';

// Temporary mock auth
const auth = () => ({ user: { id: "cm0n83vw10000y81g5fbc8j7q" } }); 

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Check if workflow exists first
    const existing = await prisma.workflow.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      // Create if it doesn't exist for demo logic functionality, or return 404
      // We will create it to ensure the save button always works during the sprint
      const created = await prisma.workflow.create({
        data: {
          id: params.id,
          userId: session.user.id,
          name: body.name || 'Untitled Workflow',
          description: body.description || '',
          status: 'draft',
          flowDefinition: body.data
        }
      });
      return NextResponse.json(created);
    }

    const updated = await prisma.workflow.update({
      where: {
        id: params.id,
      },
      data: {
        name: body.name || existing.name,
        description: body.description ?? existing.description,
        flowDefinition: body.data 
      }
    });
    
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[Workflow API] Failed to update workflow:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: params.id }
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error: any) {
    console.error('[Workflow API] Failed to fetch workflow:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
