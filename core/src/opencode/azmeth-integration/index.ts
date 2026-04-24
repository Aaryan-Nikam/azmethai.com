/**
 * @file index.ts
 * @description Azmeth Integration Public API
 *
 * The single import surface for the entire Azmeth-OpenCode integration layer.
 * Import from this file to wire the engine into your HTTP/WebSocket server.
 *
 * @example
 * ```typescript
 * import { AzmethSessionEngine, resolveApproval } from './opencode/azmeth-integration/index.js'
 *
 * // In your WebSocket handler:
 * ws.on('connection', (socket, req) => {
 *   const engine = new AzmethSessionEngine(socket, {
 *     tenantId: req.headers['x-tenant-id'] as string,
 *     roleId:   req.headers['x-role-id'] as string,
 *     sessionId: req.headers['x-session-id'] as string,
 *   })
 *   socket.on('message', async (data) => {
 *     const { message } = JSON.parse(data.toString())
 *     await engine.start(message)
 *   })
 * })
 *
 * // In your approval resolution route (POST /api/approvals/:id/resolve):
 * await resolveApproval(approvalId, approved, decidedBy)
 * ```
 */

export { AzmethSessionEngine } from './session-engine.js'
export type { NodeEvent, SessionEngineOptions } from './session-engine.js'

export { createPermissionGate, resolveApproval } from './permission-gate.js'
export type { AzmethSession, InterruptionEvent } from './permission-gate.js'

export { loadSessionMemory, persistMemory, appendToMemory } from './memory-bridge.js'
export type { AzmethMemoryEntry } from './memory-bridge.js'

export { callModel, resolveModelConfig } from './model-bridge.js'
export type { ModelBridgeConfig, ModelCallParams, SupportedProvider } from './model-bridge.js'
