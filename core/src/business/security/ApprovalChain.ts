import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { IronPassAdapter } from './IronPassAdapter.js'
import { GovernanceLayer } from './GovernanceLayer.js'
import { DataMasker } from './DataMasker.js'
import type { RiskClassification, GovernanceResult } from '../types.js'

interface RiskRule {
  pattern: RegExp
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  delay_ms?: number
}

export class ApprovalChain {
  private _supabase: SupabaseClient | null = null
  private ironPass: IronPassAdapter | null = null
  private governance: GovernanceLayer | null = null
  private dataMasker: DataMasker | null = null

  constructor(ironPassConfig?: { endpoint: string; apiKey?: string; timeout?: number; retryAttempts?: number }) {
    if (ironPassConfig) {
      this.ironPass = new IronPassAdapter({
        endpoint: ironPassConfig.endpoint,
        apiKey: ironPassConfig.apiKey,
        timeout: ironPassConfig.timeout || 5000,
        retryAttempts: ironPassConfig.retryAttempts || 3,
      })
      this.dataMasker = new DataMasker(this.ironPass)
      this.governance = new GovernanceLayer(this.ironPass, this.dataMasker)
    }
  }

  private get supabase(): SupabaseClient {
    if (!this._supabase) {
      const url = process.env.SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_KEY
      if (!url || url.includes('mockup')) {
        throw new Error('[ApprovalChain] SUPABASE_URL not configured — using static rules only')
      }
      this._supabase = createClient(url, key!)
    }
    return this._supabase
  }

  // Static rules — applied before role-specific rules
  private rules: RiskRule[] = [
    // LOW: read and draft operations — execute silently, log only
    { pattern: /^(read_|search_|lookup_|get_|list_|analyze_|summarize_|draft_|slack_send_message)/, level: 'LOW' },

    // MEDIUM: write operations — notify manager, auto-execute after delay
    { pattern: /^(write_|update_|create_|send_internal_|add_|hubspot_)/, level: 'MEDIUM', delay_ms: 60_000 },
    { pattern: /^(generate_invoice|create_task|schedule_)/, level: 'MEDIUM', delay_ms: 30_000 },

    // HIGH: external communication, sharing, financial — block until approved
    { pattern: /^(send_external_|email_external|share_|publish_|gmail_send_email|execute_javascript|browser_navigate|browser_screenshot|browser_click|browser_extract|browser_input)/, level: 'HIGH' },
    { pattern: /^(delete_|remove_|archive_)/, level: 'HIGH' },
    { pattern: /^(payment_|billing_|invoice_send|wire_)/, level: 'HIGH' },

    // CRITICAL: permission and identity changes — always block
    { pattern: /^(modify_permissions|add_user|remove_user|change_role|admin_)/, level: 'CRITICAL' },
  ]

  async classify(
    toolName: string,
    input: any,
    roleId: string,
    tenantId: string
  ): Promise<RiskClassification> {
    // 1. Check with IronPass Governance Layer first (if available)
    if (this.governance) {
      try {
        const governanceResult = await this.governance.evaluateOperation(
          toolName,
          input,
          roleId,
          tenantId,
          { level: 'LOW', reason: 'Initial classification' } // Default starting point
        )

        // Log the governance check
        await this.governance.logGovernanceEvent({
          operation: toolName,
          agentId: roleId,
          tenantId,
          parameters: input,
          result: governanceResult,
          timestamp: new Date(),
        })

        // If governance provides a definitive classification, use it
        if (governanceResult.riskLevel !== 'LOW') {
          return {
            level: governanceResult.riskLevel,
            reason: governanceResult.reason,
            auto_execute_after_ms: governanceResult.approved && governanceResult.riskLevel === 'MEDIUM' ? 60000 : undefined,
            governance_result: governanceResult,
          }
        }
      } catch (error) {
        console.warn('[ApprovalChain] IronPass governance check failed, falling back to static rules:', error)
      }
    }

    // 2. Check static rules (always works, no DB needed)
    for (const rule of this.rules) {
      if (rule.pattern.test(toolName)) {
        return {
          level: rule.level,
          reason: `Tool "${toolName}" matched ${rule.level} risk pattern`,
          auto_execute_after_ms: rule.delay_ms,
        }
      }
    }

    // 3. Check role-specific blocked actions from identity (requires Supabase)
    try {
      const { data: identity } = await this.supabase
        .from('role_identities')
        .select('blocked_actions, permissions')
        .eq('id', roleId)
        .single()

      const inputStr = JSON.stringify(input).toLowerCase()

      for (const blocked of (identity?.blocked_actions ?? [])) {
        if (toolName.includes(blocked.pattern) || inputStr.includes(blocked.pattern.toLowerCase())) {
          return {
            level: 'CRITICAL',
            reason: blocked.reason,
            auto_execute_after_ms: undefined,
          }
        }
      }

      // 4. Check if tool is in permitted actions
      const permitted = (identity?.permissions ?? []).some((p: any) =>
        p.resource === toolName || toolName.startsWith(p.resource)
      )

      if (!permitted) {
        return {
          level: 'HIGH',
          reason: `Tool "${toolName}" is not in permitted actions for this role`,
          auto_execute_after_ms: undefined,
        }
      }
    } catch {
      // Supabase not available — fall through to LOW for dev/test mode
    }

    // 5. Default unknown tools to LOW in dev (no Supabase), MEDIUM in prod
    const hasSupa = !!process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('mockup')
    return {
      level: hasSupa ? 'MEDIUM' : 'LOW',
      reason: `Tool "${toolName}" not explicitly classified`,
      auto_execute_after_ms: hasSupa ? 120_000 : undefined,
    }
  }

  async writeToQueue(
    tenantId: string, roleId: string, sessionId: string,
    toolName: string, toolInput: any, risk: RiskClassification
  ): Promise<string> {
    // Apply data masking before storing in queue (if available)
    let maskedInput = toolInput
    if (this.dataMasker && risk.level !== 'LOW') {
      try {
        const maskingResult = await this.dataMasker.maskInput(toolInput, `approval_queue_${toolName}`)
        if (maskingResult.masked) {
          maskedInput = maskingResult.data
        }
      } catch (error) {
        console.warn('[ApprovalChain] Data masking failed for approval queue:', error)
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('approval_queue')
        .insert({
          tenant_id: tenantId,
          role_id: roleId,
          session_id: sessionId,
          tool_name: toolName,
          tool_input: maskedInput,
          original_input: toolInput, // Store original for approved executions
          risk_level: risk.level,
          reason: risk.reason,
          status: 'pending',
          governance_data: risk.governance_result,
        })
        .select('id')
        .single()

      if (error) {
        console.warn(`[ApprovalChain] DB sync failed, using fallback ID. error=${error.message}`)
        return `fallback_approval_${Date.now()}`
      }
      return data!.id
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn(`[ApprovalChain] Failed to write to queue, using fallback ID. error=${msg}`)
      return `fallback_approval_${Date.now()}`
    }
  }

  async resolveApproval(approvalId: string, approved: boolean, decidedBy: string): Promise<void> {
    await this.supabase
      .from('approval_queue')
      .update({
        status: approved ? 'approved' : 'declined',
        decided_by: decidedBy,
        decided_at: new Date(),
      })
      .eq('id', approvalId)
  }

  async checkGovernance(
    toolName: string,
    input: any,
    roleId: string,
    tenantId: string
  ): Promise<{ approved: boolean; reason: string }> {
    const classification = await this.classify(toolName, input, roleId, tenantId)
    const approved = classification.level === 'LOW'
    return {
      approved,
      reason: classification.reason,
    }
  }

  /**
   * Gets the governance layer for external access
   */
  getGovernanceLayer(): GovernanceLayer | null {
    return this.governance
  }

  /**
   * Gets the data masker for external access
   */
  getDataMasker(): DataMasker | null {
    return this.dataMasker
  }
}
