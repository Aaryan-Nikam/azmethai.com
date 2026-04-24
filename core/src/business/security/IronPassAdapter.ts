import type { RiskClassification, DataMaskingResult } from '../types.js'

export interface IronPassConfig {
  endpoint: string
  apiKey?: string
  timeout: number
  retryAttempts: number
}

export interface DataProtectionRequest {
  data: any
  context: string
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted'
  operation: string
}

export interface GovernanceCheck {
  operation: string
  parameters: Record<string, any>
  agentId: string
  tenantId: string
  riskLevel: RiskClassification
}

export class IronPassAdapter {
  private config: IronPassConfig

  constructor(config: IronPassConfig) {
    this.config = config
  }

  /**
   * Masks sensitive data before agent processing
   */
  async maskSensitiveData(request: DataProtectionRequest): Promise<DataMaskingResult> {
    try {
      const response = await this.callIronPass('mask', {
        data: request.data,
        context: request.context,
        sensitivity: request.sensitivity,
        operation: request.operation,
      })

      return {
        masked: true,
        data: response.maskedData,
        tokens: response.maskingTokens,
        policy: response.appliedPolicy,
      }
    } catch (error) {
      console.error('[IronPassAdapter] Data masking failed:', error)
      // Fallback: return original data with warning
      return {
        masked: false,
        data: request.data,
        error: error.message,
        policy: 'fallback-no-masking',
      }
    }
  }

  /**
   * Unmasks data for authorized operations
   */
  async unmaskData(maskedData: any, maskingTokens: string[]): Promise<any> {
    try {
      const response = await this.callIronPass('unmask', {
        data: maskedData,
        tokens: maskingTokens,
      })

      return response.unmaskedData
    } catch (error) {
      console.error('[IronPassAdapter] Data unmasking failed:', error)
      throw new Error(`Failed to unmask sensitive data: ${error.message}`)
    }
  }

  /**
   * Performs governance check for agent operations
   */
  async checkGovernance(check: GovernanceCheck): Promise<{
    approved: boolean
    riskAssessment: RiskClassification
    requiredApprovals: string[]
    auditLog: any
  }> {
    try {
      const response = await this.callIronPass('governance-check', {
        operation: check.operation,
        parameters: check.parameters,
        agentId: check.agentId,
        tenantId: check.tenantId,
        currentRiskLevel: check.riskLevel.level,
      })

      return {
        approved: response.approved,
        riskAssessment: {
          level: response.riskLevel,
          reason: response.reason,
          delay_ms: response.delayMs,
        },
        requiredApprovals: response.requiredApprovals || [],
        auditLog: response.auditLog,
      }
    } catch (error) {
      console.error('[IronPassAdapter] Governance check failed:', error)
      // Fallback: use original risk assessment
      return {
        approved: check.riskLevel.level !== 'CRITICAL',
        riskAssessment: check.riskLevel,
        requiredApprovals: [],
        auditLog: { error: error.message, fallback: true },
      }
    }
  }

  /**
   * Logs security events for audit trail
   */
  async logSecurityEvent(event: {
    type: string
    agentId: string
    tenantId: string
    operation: string
    data: any
    risk: RiskClassification
    outcome: 'success' | 'blocked' | 'error'
  }): Promise<void> {
    try {
      await this.callIronPass('log-event', event)
    } catch (error) {
      console.error('[IronPassAdapter] Security event logging failed:', error)
      // Don't throw - logging failures shouldn't break operations
    }
  }

  private async callIronPass(endpoint: string, payload: any): Promise<any> {
    const url = `${this.config.endpoint}/${endpoint}`

    let lastError: Error | null = null

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.config.timeout),
        })

        if (!response.ok) {
          throw new Error(`IronPass API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        lastError = error as Error
        console.warn(`[IronPassAdapter] Attempt ${attempt + 1} failed:`, error)

        if (attempt < this.config.retryAttempts - 1) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    throw lastError || new Error('All IronPass API attempts failed')
  }
}