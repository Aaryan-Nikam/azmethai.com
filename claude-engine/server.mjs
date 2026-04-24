import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const PORT = 3001;
const CLAUDE_CLI_PATH = '/Users/aaryannikam/nocobase/claude-code-main/cli.mjs';
const WORKSPACE_BASE = '/Users/aaryannikam/Azmeth AI/Azmeth/workspaces';

// Ensure workspace base exists
if (!fs.existsSync(WORKSPACE_BASE)) {
  fs.mkdirSync(WORKSPACE_BASE, { recursive: true });
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const userId = req.headers['x-user-id'] || 'default-user';

  // POST /sessions/:id/message
  const messageMatch = url.pathname.match(/^\/sessions\/([^\/]+)\/message$/);
  if (req.method === 'POST' && messageMatch) {
    const sessionId = messageMatch[1];
    let body = '';
    
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      let prompt = '';
      try {
        const parsed = JSON.parse(body);
        prompt = parsed.prompt;
      } catch (e) {
        res.writeHead(400);
        res.end('Invalid JSON');
        return;
      }

      // Set up Server-Sent Events (SSE)
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const userWorkspace = path.join(WORKSPACE_BASE, userId);
      if (!fs.existsSync(userWorkspace)) {
        fs.mkdirSync(userWorkspace, { recursive: true });
      }

      const args = [
        CLAUDE_CLI_PATH,
        '--print',
        '--resume', sessionId,
        '-p', prompt
      ];

      console.log(`[Claude Engine] Spawning session ${sessionId} in ${userWorkspace}`);

      const child = spawn('node', args, {
        cwd: userWorkspace,
        env: { ...process.env }, // Inherits ANTHROPIC_API_KEY
      });

      child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          // Output is already JSON from Claude Code's --print mode
          res.write(`data: ${line}\n\n`);
        }
      });

      child.stderr.on('data', (data) => {
        console.error(`[Claude Stderr]: ${data}`);
      });

      child.on('close', (code) => {
        res.write(`data: {"type": "done", "code": ${code}}\n\n`);
        res.end();
      });
      
      child.on('error', (err) => {
        res.write(`data: {"type": "error", "message": ${JSON.stringify(err.message)}}\n\n`);
        res.end();
      });
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Claude Engine running on port ${PORT}`);
});
