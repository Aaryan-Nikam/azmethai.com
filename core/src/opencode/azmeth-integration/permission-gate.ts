/**
 * @file permission-gate.ts
 * @description Azmeth Permission Gate
 *
 * Bridges the OpenCode permission system (`permissions/permissions.ts` + the
 * `canUseTool` callback in query.ts) with Azmeth's production `ApprovalChain`.
 *
 * How it works:
 *  1. The query loop calls `canUseTool(tool, input)` before every tool execution.
 *  2. This module implements that function, delegating to `ApprovalChain.classify()`.
 *  3. Based on risk level:
 *     - LOW    → immediately approved, logged
 *     - MEDIUM → auto-approved after delay, manager notified via Supabase
 *     - HIGH   → blocks the query loop, emits `interruption` event to frontend
 *     - CRITICAL → permanently blocks, requires human approval before continuing
 *
 * The `InterruptionEvent` is picked up by the WebSocket server and sent to the
 * frontend Live Node Graph for display.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { ApprovalChain } from '../../business/security/ApprovalChain.js'
import type { CanUseToolFn } from '../hooks/useCanUseTool.js'

export interface AzmethSession {
  sessionId: string
  tenantId: string
  roleId: string
}

export interface InterruptionEvent {
  type: 'interruption'
  toolName: string
  toolInput: unknown
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  reason: string
  approvalId?: string
  /** Milliseconds to auto-execute after, or undefined if manual approval required */
  autoExecuteAfterMs?: number
}

const approvalChain = new ApprovalChain()

/** Lazy singleton for DB access within the gate */
let _supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    if (!url || url.includes('mockup')) {
      throw new Error('[PermissionGate] SUPABASE_URL not configured')
    }
    _supabase = createClient(url, key!)
  }
  return _supabase
}

/**
 * Factory: creates the `canUseTool` callback injected into the query loop.
 * Emit interruption events to the provided callback for WebSocket broadcasting.
 */
export function createPermissionGate(
  session: AzmethSession,
  onInterruption: (evt: InterruptionEvent) => void,
): CanUseToolFn {
  return async (tool: any, input: any) => {
    const risk = await approvalChain.classify(
      tool.name,
      input,
      session.roleId,
      session.tenantId,
    )

    // LOW — silent, execute immediately
    if (risk.level === 'LOW') {
      return { result: true }
    }

    // MEDIUM — auto-execute after delay, notify
    if (risk.level === 'MEDIUM') {
      const approvalId = await approvalChain.writeToQueue(
        session.tenantId,
        session.roleId,
        session.sessionId,
        tool.name,
        input,
        risk,
      )
      onInterruption({
        type: 'interruption',
        toolName: tool.name,
        toolInput: input,
        riskLevel: 'MEDIUM',
        reason: risk.reason,
        approvalId,
        autoExecuteAfterMs: risk.auto_execute_after_ms,
      })
      // Auto-execute continues after the delay — query loop is NOT paused for MEDIUM
      return { result: true }
    }

    // HIGH / CRITICAL — block and emit interruption event
    // The query loop will pause here until the frontend sends an approval signal
    const approvalId = await approvalChain.writeToQueue(
      session.tenantId,
      session.roleId,
      session.sessionId,
      tool.name,
      input,
      risk,
    )

    onInterruption({
      type: 'interruption',
      toolName: tool.name,
      toolInput: input,
      riskLevel: risk.level,
      reason: risk.reason,
      approvalId,
      autoExecuteAfterMs: undefined,
    })

    // --- Wait for Human Approval ---
    if (!approvalId || approvalId.startsWith('fallback_')) {
      return {
        result: false,
        message: `[ApprovalChain] ${risk.level} risk — action requires authorization, but database persistence failed. Check server logs.`,
      }
    }

    const POLL_INTERVAL_MS = 2000
    const TIMEOUT_MINUTES = 10
    const start = Date.now()

    while (Date.now() - start < TIMEOUT_MINUTES * 60 * 1000) {
      const { data: row } = await getSupabase()
        .from('approval_queue')
        .select('status')
        .eq('id', approvalId)
        .single()

      if (row?.status === 'approved') {
        return { result: true }
      }
      if (row?.status === 'declined') {
        return {
          result: false,
          message: `[ApprovalChain] User declined the ${risk.level} risk action.`,
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    }

    // Timeout fallback
    return {
      result: false,
      message: `[ApprovalChain] ${risk.level} risk — timed out waiting for approval after ${TIMEOUT_MINUTES}m.`,
    }
  }
}

/**
 * Resolves a pending approval from the frontend (called by the API route handler).
 * Once approved, the session should be resumed via the session websocket.
 */
export async function resolveApproval(
  approvalId: string,
  approved: boolean,
  decidedBy: string,
): Promise<void> {
  await approvalChain.resolveApproval(approvalId, approved, decidedBy)
}
