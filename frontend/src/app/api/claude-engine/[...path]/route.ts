import { NextRequest, NextResponse } from 'next/server';

const ENGINE_URL = 'http://localhost:3001';

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const userId = 'local-dev-user'; 
  
  try {
    const body = await req.text();
    const response = await fetch(`${ENGINE_URL}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Engine returned ${response.status}` }, 
        { status: response.status }
      );
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (error: any) {
    console.error('Claude engine proxy error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
