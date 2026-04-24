# Azmeth OS Architecture Brain

This document is the definitive source of truth for the **Azmeth AI** platform's architecture. It is written for AI Coding Agents to understand the system's design, constraints, and operational model.

For the non-invasive Azmeth + Builder fusion design, also read:

- `docs/azmeth-builder-fusion-architecture.md`

## 🌟 The Vision: "IDE-Style Autonomous Operator"

Azmeth has pivoted away from a standalone "Visual Node-Based Workflow Builder" product surface.

The current architecture is a **Unified Workspace IDE** where:
- the entire app is the workspace
- Azmeth is embedded as the orchestrator interface inside that workspace by default
- the operator can detach the app view or the agent view into separate windows when needed

---

## 🏗️ The Two-Engine Architecture

Azmeth is powered by two distinct systems working in tandem:

- **UI Paradigm:** `dashboard/agent` is the primary runtime surface. The default layout is a combined workspace shell: app map on the left, active app workspace in the center, Azmeth on the right, and runtime traces at the bottom.

### 3. The Control Layer: Systems Hub
- **Role:** High-level operating map for every engine, connector, and agent lane.
- **Location:** `frontend/src/app/dashboard/systems/`
- **Purpose:** Provides a "Command Center" view of all active agents and pipelines (AI Setter, Outbound Engine, etc.).

### 2. The Hands: Claude Engine (Bun Sidecar)
- **Role:** A dedicated background service that gives the agent actual "hands" to execute Bash commands, edit files, scrape the web, and run multi-agent tasks natively.
- **Location:** `claude-engine/server.ts`
- **Tech Stack:** Bun, `@anthropic-ai/claude-code` official NPM package.
- **How it works:** 
  - Runs on `http://localhost:3001`.
  - Uses `Bun.spawn` to execute the local `claude` CLI binary inside a user-specific workspace (`workspaces/{userId}/`).
  - Passes the `--resume {sessionId}` flag to maintain **stateful, multi-turn conversations** across API calls using Claude's native JSONL transcripts.
  - Streams raw text back to Next.js via Server-Sent Events (SSE).

---

## 🔌 API Communication Flow

1. **User types prompt** in `frontend/src/app/dashboard/agent/page.tsx`.
2. Request hits the Next.js proxy route: `frontend/src/app/api/claude-engine/[...path]/route.ts`.
3. Proxy forwards it to `http://localhost:3001/sessions/{id}/message`.
4. Bun Server spawns `claude` binary with the prompt.
5. Bun Server streams stdout (wrapping it in JSON payload: `{ type: "assistant", message: { content: "..." } }`).
6. Frontend parses the SSE stream, appending text in real-time.
7. Frontend regex monitors for `Tool use: ` strings to update the visual `SystemMonitor.tsx` trace.

---

## ⚠️ Known Constraints & Agent Rules

1. **NPM Package Limitation:** The `@anthropic-ai/claude-code` npm package **does not export an importable JS module/SDK**. It is strictly a compiled CLI binary wrapper. Do NOT attempt to `import { query } from '@anthropic-ai/claude-code'`. You must use the `Bun.spawn` subprocess architecture.
2. **File System Sandboxing:** Always ensure Claude Engine execution restricts its `cwd` to `/workspaces/{userId}/` so users do not corrupt the platform code or see other users' data.
3. **UI Updates:** Standalone sandbox is deprecated as a product concept. The app itself is the workspace. Legacy sandbox routes should only exist as compatibility redirects into workspace-only mode.
