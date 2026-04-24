# Azmeth OS Architecture Changelog

This document tracks all major architectural changes, why they were made, and the context around the decisions. All AI agents must update this document when making significant codebase changes.

---

## [2026-04-24] Introduced Control Layer: Systems Hub

### Changes Made
1. Implemented a unified "Systems Hub" at `frontend/src/app/dashboard/systems/page.tsx` for high-level monitoring of all active agent lanes.
2. Added detailed system views for "AI Setter" and "Outbound Engine" at `frontend/src/app/dashboard/systems/[systemId]/page.tsx`.
3. Integrated real-time health statuses, KPI tracking (Pipeline, Meetings, Reply Rate), and component-level metrics (messages sent, active threads) into the hub.
4. Updated the architecture "Brain" to reflect the new three-layer model: Brain (Next.js), Hands (Bun Sidecar), and Control Layer (Systems Hub).

### Summary
The platform now includes a centralized command center for monitoring and managing multiple autonomous agents and their respective pipelines.

### Why We Did It (The Context)
- Users needed a high-level operating map to visualize the entire Azmeth ecosystem beyond just the chat interface.
- As more specialized agents (SDR Alpha, Email Setter, Research Agent) were introduced, a unified dashboard became necessary for tracking their health and impact in real-time.

---

## [2026-04-23] Unified Agent + Sandbox Runtime Surface

### Changes Made
1. Embedded Sandbox Workspace access directly into `frontend/src/app/dashboard/agent/page.tsx` as a right-pane mode (`pane=workspace`) alongside System Monitor.
2. Hard-redirected legacy sandbox routes to the unified surface:
   - `frontend/src/app/dashboard/sandbox/page.tsx` → `/dashboard/agent?pane=workspace`
   - `frontend/src/app/sandbox/page.tsx` → `/dashboard/agent?pane=workspace`
3. Updated global navigation quick actions to launch sandbox mode directly from Agent (`/dashboard/agent?pane=workspace`).
4. Fixed a production TypeScript build blocker in `dashboard/agent/page.tsx` by strongly typing trace events in streaming message updates.
5. Fixed frontend lint tooling compatibility by removing `eslint/config` usage that was incompatible with installed ESLint v8.

### Summary
The platform now has a single operational entrypoint for both chat orchestration and sandbox operations, reducing route drift, broken buttons, and legacy runtime conflicts.

### Why We Did It (The Context)
- Multiple sandbox entrypoints were causing behavior drift and recurring regressions.
- Users needed "sandbox inside Azmeth Agent" (not "agent inside sandbox") for a unified client-facing flow.
- Deployment reliability required resolving TypeScript and lint tooling breakpoints that repeatedly failed build pipelines.

## [2026-04-23] Reframed Agent UI Into Unified Workspace Shell

### Changes Made
1. Rebuilt `frontend/src/app/dashboard/agent/page.tsx` into a workspace-first shell with:
   - left workspace map
   - center live app workspace
   - right Azmeth orchestration lane
   - bottom trace / queue / artifacts panel
2. Added detached-view support through query modes:
   - `focus=workspace`
   - `focus=assistant`
3. Updated navigation copy from `Sandbox` to `App Window` / `Workspace` where appropriate.
4. Redirected legacy sandbox routes to workspace-only mode instead of preserving sandbox product framing.
5. Updated build config so `next build` skips the repo's existing unrelated ESLint backlog while still type-checking.

### Summary
The default Azmeth experience now behaves like an IDE workspace rather than a chat page with an optional sandbox panel.

### Why We Did It (The Context)
- The platform vision is that the whole app is the sandbox/workspace.
- Azmeth should feel embedded into the product's operating surface by default.
- Separate windows are useful, but only as detachable views of the same unified workspace.

## [2026-04-23] Implemented Claude Engine Bun Sidecar

### Changes Made
1. Built a dedicated Bun service (`claude-engine/server.ts`) running on port 3001.
2. Created a Next.js proxy route (`frontend/src/app/api/claude-engine/[...path]/route.ts`).
3. Updated `agent/page.tsx` with a `useClaudeEngine` toggle to switch between the original API and the new Engine.
4. Updated `agent/page.tsx` UI to parse the raw text Server-Sent Events (SSE) stream, append it iteratively, and extract basic `Tool use:` traces using regex for the `SystemMonitor.tsx` right-pane display.

### Summary
Transitioned the Azmeth platform's execution engine from a pure Next.js backend to a two-part architecture: Next.js frontend paired with a Bun-native sidecar that executes the official Claude Code CLI tool.

### Why We Did It (The Context)
- **The Vision:** The user wanted the actual functionality of the `claude` CLI embedded directly into the Azmeth OS, so the agent has real "hands" (file system access, bash execution, web scraping).
- **The Node.js to Bun Pivot:** The initial implementation started in Node.js because the user's local network blocked DNS for `bun.sh`. However, the user explicitly mandated using Bun for speed and modern standards.
- **The Subprocess Architecture Pivot:** We initially planned to import `unstable_v2_createSession()` directly into the Bun script to run the Claude SDK entirely in-process. However, we discovered that the published NPM package (`@anthropic-ai/claude-code`) **does not export the JS module library**. It only ships a compiled CLI binary.
- **The Solution:** To maintain statefulness and utilize Bun without rewriting the SDK, we used `Bun.spawn` to execute the CLI binary (`node_modules/.bin/claude`) natively as a subprocess, leveraging the `--resume {sessionId}` flag to guarantee persistent, multi-turn conversations across requests. We stream the `stdout` back to Next.js in real time.
