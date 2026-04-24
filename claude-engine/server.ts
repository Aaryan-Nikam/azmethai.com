import { serve } from 'bun';
import * as path from 'path';
import * as fs from 'fs';

const PORT = 3001;
const WORKSPACE_BASE = '/Users/aaryannikam/Azmeth AI/Azmeth/workspaces';
const CLAUDE_CMD = path.join(import.meta.dir, 'node_modules', '.bin', 'claude');

// Ensure workspace base exists
if (!fs.existsSync(WORKSPACE_BASE)) {
  fs.mkdirSync(WORKSPACE_BASE, { recursive: true });
}

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
        },
      });
    }

    const userId = req.headers.get('x-user-id') || 'default-user';

    if (req.method === 'GET' && url.pathname === '/') {
      return new Response('Claude Engine is running normally. It is waiting for POST requests from the Azmeth Dashboard.', { status: 200 });
    }

    // POST /sessions/:id/message
    const messageMatch = url.pathname.match(/^\/sessions\/([^\/]+)\/message$/);
    if (req.method === 'POST' && messageMatch) {
      const sessionId = messageMatch[1];
      
      let prompt = '';
      try {
        const body = await req.json();
        prompt = body.prompt;
      } catch (e) {
        return new Response('Invalid JSON', { status: 400 });
      }

      if (!prompt) {
        return new Response('Missing prompt', { status: 400 });
      }

      const userWorkspace = path.join(WORKSPACE_BASE, userId);
      if (!fs.existsSync(userWorkspace)) {
        fs.mkdirSync(userWorkspace, { recursive: true });
      }

      console.log(`[Claude Engine] Spawning session ${sessionId} for ${userId}`);

      // We stream the Server-Sent Events (SSE) back to Next.js using Bun.spawn
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          try {
            const proc = Bun.spawn([CLAUDE_CMD, '--print', '--resume', sessionId, '-p', prompt], {
              cwd: userWorkspace,
              env: { ...process.env }, // Injects ANTHROPIC_API_KEY
              stdout: "pipe",
              stderr: "pipe",
            });

            const reader = proc.stdout.getReader();
            const decoder = new TextDecoder();

            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              
              // Keep the last partial line in the buffer
              buffer = lines.pop() || '';
              
              for (const line of lines) {
                // The CLI outputs raw text, so we must wrap it in JSON for the frontend
                const payload = JSON.stringify({ 
                  type: 'assistant', 
                  message: { content: line + '\n' } 
                });
                controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
              }
            }

            const exitCode = await proc.exited;
            controller.enqueue(encoder.encode(`data: {"type": "done", "code": ${exitCode}}\n\n`));
            controller.close();
          } catch (err: any) {
            console.error('[Claude Engine Error]', err);
            const errorPayload = JSON.stringify({ type: 'error', message: err.message });
            controller.enqueue(encoder.encode(`data: ${errorPayload}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`🚀 Claude Engine (Bun Subprocess) running on http://localhost:${PORT}`);
