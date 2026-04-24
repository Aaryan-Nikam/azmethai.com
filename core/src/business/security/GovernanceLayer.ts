import { IronPassAdapter, type GovernanceCheck } from './IronPassAdapter.js'
import { DataMasker } from './DataMasker.js'
import type { RiskClassification, GovernanceResult } from '../types.js'

export interface GovernancePolicy {
  id: string
  name: string
  description: string
  rules: GovernanceRule[]
  priority: number
  enabled: boolean
}

export interface GovernanceRule {
  condition: (operation: string, params: Record<string, any>) => boolean
  action: 'allow' | 'deny' | 'require_approval' | 'mask_data'
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  reason: string
  requiredApprovals?: string[]
}

export class GovernanceLayer {
  private ironPass: IronPassAdapter
  private dataMasker: DataMasker
  private policies: GovernancePolicy[] = []

  constructor(ironPass: IronPassAdapter, dataMasker: DataMasker) {
    this.ironPass = ironPass
    this.dataMasker = dataMasker
    this.initializeDefaultPolicies()
  }

  /**
   * Evaluates an operation against governance policies
   */
  async evaluateOperation(
    operation: string,
    parameters: Record<string, any>,
    agentId: string,
    tenantId: string,
    currentRisk: RiskClassification
  ): Promise<GovernanceResult> {
    // First check with IronPass
    const ironPassCheck: GovernanceCheck = {
      operation,
      parameters,
      agentId,
      tenantId,
      riskLevel: currentRisk,
    }

    const ironPassResult = await this.ironPass.checkGovernance(ironPassCheck)

    // If IronPass provides a definitive answer, use it
    if (ironPassResult.approved !== undefined) {
      return {
        approved: ironPassResult.approved,
        riskLevel: ironPassResult.riskAssessment.level,
        reason: ironPassResult.riskAssessment.reason,
        requiredApprovals: ironPassResult.requiredApprovals,
        maskingRequired: this.requiresDataMasking(operation, parameters),
        auditLog: ironPassResult.auditLog,
      }
    }

    // Fallback to local policy evaluation
    return this.evaluateLocalPolicies(operation, parameters, agentId, tenantId, currentRisk)
  }

  /**
   * Applies data masking based on governance requirements
   */
  async applyDataMasking(
    data: any,
    operation: string,
    context: string
  ): Promise<{ masked: boolean; data: any; tokens: string[] }> {
    const maskingResult = await this.dataMasker.maskInput(data, context)

    return {
      masked: maskingResult.masked,
      data: maskingResult.data,
      tokens: maskingResult.tokens || [],
    }
  }

  /**
   * Logs governance events for audit and compliance
   */
  async logGovernanceEvent(event: {
    operation: string
    agentId: string
    tenantId: string
    parameters: Record<string, any>
    result: GovernanceResult
    timestamp: Date
    sessionId?: string
  }): Promise<void> {
    await this.ironPass.logSecurityEvent({
      type: 'governance_check',
      agentId: event.agentId,
      tenantId: event.tenantId,
      operation: event.operation,
      data: {
        parameters: event.parameters,
        result: event.result,
        sessionId: event.sessionId,
      },
      risk: {
        level: event.result.riskLevel as any,
        reason: event.result.reason,
      },
      outcome: event.result.approved ? 'success' : 'blocked',
    })
  }

  /**
   * Updates governance policies dynamically
   */
  updatePolicies(newPolicies: GovernancePolicy[]): void {
    this.policies = newPolicies.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Gets current governance policies
   */
  getPolicies(): GovernancePolicy[] {
    return [...this.policies]
  }

  private evaluateLocalPolicies(
    operation: string,
    parameters: Record<string, any>,
    agentId: string,
    tenantId: string,
    currentRisk: RiskClassification
  ): GovernanceResult {
    // Evaluate against policies in priority order
    for (const policy of this.policies) {
      if (!policy.enabled) continue

      for (const rule of policy.rules) {
        if (rule.condition(operation, parameters)) {
          const result: GovernanceResult = {
            approved: rule.action !== 'deny',
            riskLevel: rule.riskLevel,
            reason: rule.reason,
            requiredApprovals: rule.requiredApprovals || [],
            maskingRequired: rule.action === 'mask_data',
            policyId: policy.id,
            policyName: policy.name,
          }

          // Override risk level if rule specifies higher
          if (this.compareRiskLevels(rule.riskLevel, currentRisk.level) > 0) {
            result.riskLevel = rule.riskLevel
          }

          return result
        }
      }
    }

    // Default: allow with current risk level
    return {
      approved: true,
      riskLevel: currentRisk.level,
      reason: 'No specific policy matched, using default approval',
      requiredApprovals: [],
      maskingRequired: false,
    }
  }

  private requiresDataMasking(operation: string, parameters: Record<string, any>): boolean {
    // Check if operation involves sensitive data handling
    const sensitiveOperations = [
      'send_external_email',
      'store_customer_data',
      'process_payment_info',
      'access_personal_records',
    ]

    return sensitiveOperations.some(op => operation.includes(op))
  }

  private compareRiskLevels(a: string, b: string): number {
    const levels = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
    return levels[a] - levels[b]
  }

  private initializeDefaultPolicies(): void {
    this.policies = [
      {
        id: 'data-protection',
        name: 'Data Protection Policy',
        description: 'Ensures sensitive data is properly masked and protected',
        priority: 100,
        enabled: true,
        rules: [
          {
            condition: (op, params) => op.includes('email') && params.recipient?.includes('@external.com'),
            action: 'require_approval',
            riskLevel: 'HIGH',
            reason: 'External email communication requires approval',
            requiredApprovals: ['manager', 'compliance'],
          },
          {
            condition: (op, params) => op.includes('payment') || params.amount > 1000,
            action: 'require_approval',
            riskLevel: 'CRITICAL',
            reason: 'Financial operations require approval',
            requiredApprovals: ['manager', 'finance', 'compliance'],
          },
          {
            condition: (op, params) => params.sensitiveData === true,
            action: 'mask_data',
            riskLevel: 'MEDIUM',
            reason: 'Sensitive data must be masked',
          },
        ],
      },
      {
        id: 'operational-security',
        name: 'Operational Security Policy',
        description: 'Controls access to system operations and tools',
        priority: 90,
        enabled: true,
        rules: [
          {
            condition: (op) => op.includes('delete') || op.includes('remove'),
            action: 'require_approval',
            riskLevel: 'HIGH',
            reason: 'Destructive operations require approval',
            requiredApprovals: ['manager'],
          },
          {
            condition: (op) => op.includes('admin') || op.includes('system'),
            action: 'require_approval',
            riskLevel: 'CRITICAL',
            reason: 'Administrative operations require approval',
            requiredApprovals: ['admin', 'security'],
          },
        ],
      },
    ]
  }
}