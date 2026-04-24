/**
 * @file server-engine-ws.ts
 * @description Azmeth Engine WebSocket Handler
 *
 * Hooks the OpenCode AzmethSessionEngine into the existing Azmeth gateway server
 * via the established WebSocket broadcast + agent event patterns.
 *
 * Registers two things:
 *  1. A new WS route: `ws://gateway/engine` — dedicated channel for the autonomous engine
 *  2. Forwards engine NodeEvents into the server's existing `broadcast("agent", ...)` pipeline
 *     so the frontend's existing event handling works without any UI changes.
 *
 * Message protocol (client → server):
 *   { type: "engine:start",  message: string, sessionId: string, tenantId: string, roleId: string }
 *   { type: "engine:abort",  sessionId: string }
 *   { type: "engine:approve", approvalId: string, approved: boolean, decidedBy: string }
 *
 * Message protocol (server → client):
 *   { type: "engine:thinking",     content: string, sessionId: string, timestamp: string }
 *   { type: "engine:tool_use",     toolName: string, input: unknown, sessionId: string }
 *   { type: "engine:observation",  toolName: string, result: unknown, sessionId: string }
 *   { type: "engine:interruption", toolName: string, riskLevel: string, reason: string, approvalId: string }
 *   { type: "engine:complete",     sessionId: string }
 *   { type: "engine:error",        content: string, sessionId: string }
 */

import type WebSocket from 'ws'
import type { WebSocketServer } from 'ws'
import { rawDataToString } from '../infra/ws.js'
import {
  AzmethSessionEngine,
  resolveApproval,
  type NodeEvent,
} from '../opencode/azmeth-integration/index.js'
import { createSubsystemLogger } from '../logging/subsystem.js'

const log = createSubsystemLogger('engine-ws')

/** Active engine sessions, keyed by sessionId */
const activeSessions = new Map<string, AzmethSessionEngine>()

export type BroadcastFn = (event: string, payload: unknown) => void

/**
 * Wraps a NodeEvent with the `engine:` prefix for the frontend to distinguish
 * engine events from regular chat/agent events.
 */
function prefixEvent(evt: NodeEvent): { type: string; [key: string]: unknown } {
  const { type, ...rest } = evt
  return { type: `engine:${type}`, ...rest }
}

/**
 * Attaches the Azmeth Engine WebSocket handler to an existing WebSocketServer.
 *
 * Call this from server.impl.ts during gateway startup:
 *   attachEngineWsHandler(wss, (event, payload) => broadcast(event, payload))
 */
export function attachEngineWsHandler(
  wss: WebSocketServer,
  broadcast: BroadcastFn,
): void {
  wss.on('connection', (ws: WebSocket, req) => {
    // Only handle connections to the /engine path
    const url = req.url ?? ''
    if (!url.includes('/engine')) return

    log.info('Engine WS client connected', { url })

    ws.on('message', async (raw) => {
      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(rawDataToString(raw))
      } catch {
        ws.send(JSON.stringify({ type: 'engine:error', content: 'Invalid JSON message' }))
        return
      }

      switch (msg.type) {
        case 'engine:start': {
          const { message, sessionId, tenantId, roleId } = msg as {
            message: string
            sessionId: string
            tenantId: string
            roleId: string
          }

          if (!message || !sessionId || !tenantId || !roleId) {
            ws.send(JSON.stringify({
              type: 'engine:error',
              content: 'Missing required fields: message, sessionId, tenantId, roleId',
              sessionId,
              timestamp: new Date().toISOString(),
            }))
            return
          }

          // Abort any existing session for this sessionId
          const existing = activeSessions.get(sessionId)
          if (existing) {
            existing.abort()
            activeSessions.delete(sessionId)
          }

          // Create a new engine session
          const engine = new AzmethSessionEngine(ws, { sessionId, tenantId, roleId })
          activeSessions.set(sessionId, engine)

          log.info('Starting engine session', { sessionId, tenantId, roleId })

          // Run engine — NodeEvents flow to ws.send inside AzmethSessionEngine
          // AND we mirror them into the gateway broadcast for dashboard visibility
          engine.start(message).then(() => {
            activeSessions.delete(sessionId)
            // Broadcast completion to all gateway clients (dashboard etc.)
            broadcast('agent', {
              runId: sessionId,
              stream: 'lifecycle',
              ts: Date.now(),
              data: { phase: 'end' },
              seq: Date.now(),
            })
          }).catch((err: Error) => {
            log.error('Engine session error', { sessionId, error: err.message })
            activeSessions.delete(sessionId)
          })

          break
        }

        case 'engine:abort': {
          const { sessionId } = msg as { sessionId: string }
          const session = activeSessions.get(sessionId)
          if (session) {
            session.abort()
            activeSessions.delete(sessionId)
            log.info('Engine session aborted', { sessionId })
          }
          ws.send(JSON.stringify({
            type: 'engine:complete',
            content: 'Session aborted.',
            sessionId: sessionId ?? '',
            timestamp: new Date().toISOString(),
          }))
          break
        }

        case 'engine:approve': {
          const { approvalId, approved, decidedBy } = msg as {
            approvalId: string
            approved: boolean
            decidedBy: string
          }
          try {
            await resolveApproval(approvalId, approved, decidedBy ?? 'human')
            ws.send(JSON.stringify({
              type: 'engine:approve:ack',
              approvalId,
              approved,
              timestamp: new Date().toISOString(),
            }))
            log.info('Approval resolved', { approvalId, approved, decidedBy })
          } catch (err: unknown) {
            ws.send(JSON.stringify({
              type: 'engine:error',
              content: `Failed to resolve approval: ${err instanceof Error ? err.message : String(err)}`,
              timestamp: new Date().toISOString(),
            }))
          }
          break
        }

        default:
          log.warn('Unknown engine message type', { type: msg.type })
      }
    })

    ws.on('close', () => {
      log.info('Engine WS client disconnected')
      // Do NOT abort sessions on disconnect — engine runs autonomously
      // The session will complete and clean up itself
    })

    ws.on('error', (err) => {
      log.error('Engine WS error', { error: err.message })
    })

    // Send ready signal
    ws.send(JSON.stringify({
      type: 'engine:ready',
      message: 'Azmeth Engine connected. Send engine:start to begin.',
      timestamp: new Date().toISOString(),
    }))
  })

  log.info('Azmeth Engine WS handler attached')
}

/**
 * Returns a list of active engine sessions.
 * Used by the gateway health/status endpoint.
 */
export function getActiveEngineSessions(): string[] {
  return Array.from(activeSessions.keys())
}
