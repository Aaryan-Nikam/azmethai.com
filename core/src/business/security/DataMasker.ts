import { IronPassAdapter, type DataProtectionRequest } from './IronPassAdapter.js'
import type { DataMaskingResult } from '../types.js'

export interface MaskingRule {
  pattern: RegExp
  replacement: string
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted'
  description: string
}

export class DataMasker {
  private ironPass: IronPassAdapter
  private fallbackRules: MaskingRule[] = [
    // Email addresses
    {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[EMAIL_MASKED]',
      sensitivity: 'confidential',
      description: 'Mask email addresses',
    },
    // Phone numbers
    {
      pattern: /(\+?\d{1,3}[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g,
      replacement: '[PHONE_MASKED]',
      sensitivity: 'confidential',
      description: 'Mask phone numbers',
    },
    // Social Security Numbers
    {
      pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
      replacement: '[SSN_MASKED]',
      sensitivity: 'restricted',
      description: 'Mask Social Security Numbers',
    },
    // Credit card numbers
    {
      pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{2}\d{2}\b/g,
      replacement: '[CARD_MASKED]',
      sensitivity: 'restricted',
      description: 'Mask credit card numbers',
    },
    // API keys and tokens
    {
      pattern: /\b[A-Za-z0-9]{32,}\b/g,
      replacement: '[API_KEY_MASKED]',
      sensitivity: 'restricted',
      description: 'Mask API keys and tokens',
    },
  ]

  constructor(ironPass: IronPassAdapter) {
    this.ironPass = ironPass
  }

  /**
   * Masks sensitive data in input before processing
   */
  async maskInput(input: any, context: string = 'agent_input'): Promise<DataMaskingResult> {
    const request: DataProtectionRequest = {
      data: input,
      context,
      sensitivity: this.inferSensitivity(input),
      operation: 'mask_input',
    }

    // Try IronPass first
    const ironPassResult = await this.ironPass.maskSensitiveData(request)
    if (ironPassResult.masked) {
      return ironPassResult
    }

    // Fallback to local rules
    console.warn('[DataMasker] IronPass masking failed, using fallback rules')
    return this.applyFallbackMasking(input, context)
  }

  /**
   * Masks sensitive data in tool outputs
   */
  async maskOutput(output: any, toolName: string): Promise<DataMaskingResult> {
    const request: DataProtectionRequest = {
      data: output,
      context: `tool_output_${toolName}`,
      sensitivity: this.inferSensitivity(output),
      operation: 'mask_output',
    }

    const ironPassResult = await this.ironPass.maskSensitiveData(request)
    if (ironPassResult.masked) {
      return ironPassResult
    }

    // Fallback to local rules
    return this.applyFallbackMasking(output, `tool_output_${toolName}`)
  }

  /**
   * Unmasks data for authorized recipients
   */
  async unmaskData(maskedData: any, maskingTokens: string[]): Promise<any> {
    return await this.ironPass.unmaskData(maskedData, maskingTokens)
  }

  /**
   * Applies local fallback masking rules
   */
  private applyFallbackMasking(data: any, context: string): DataMaskingResult {
    let maskedData = data
    const appliedRules: string[] = []

    if (typeof data === 'string') {
      for (const rule of this.fallbackRules) {
        if (data.match(rule.pattern)) {
          maskedData = maskedData.replace(rule.pattern, rule.replacement)
          appliedRules.push(rule.description)
        }
      }
    } else if (typeof data === 'object' && data !== null) {
      maskedData = this.maskObject(data, appliedRules)
    }

    return {
      masked: appliedRules.length > 0,
      data: maskedData,
      tokens: [], // Fallback doesn't generate tokens
      policy: 'fallback-local-rules',
      appliedRules,
    }
  }

  /**
   * Recursively masks sensitive data in objects
   */
  private maskObject(obj: any, appliedRules: string[]): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }

    const masked = Array.isArray(obj) ? [...obj] : { ...obj }

    for (const key in masked) {
      if (typeof masked[key] === 'string') {
        for (const rule of this.fallbackRules) {
          if (masked[key].match(rule.pattern)) {
            masked[key] = masked[key].replace(rule.pattern, rule.replacement)
            appliedRules.push(`${rule.description} in field '${key}'`)
          }
        }
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.maskObject(masked[key], appliedRules)
      }
    }

    return masked
  }

  /**
   * Infers data sensitivity level
   */
  private inferSensitivity(data: any): 'public' | 'internal' | 'confidential' | 'restricted' {
    if (typeof data === 'string') {
      // Check for highly sensitive patterns
      if (/\b\d{3}-?\d{2}-?\d{4}\b/.test(data) || // SSN
          /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{2}\d{2}\b/.test(data)) { // Credit card
        return 'restricted'
      }

      // Check for moderately sensitive patterns
      if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(data) || // Email
          /(\+?\d{1,3}[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b/.test(data)) { // Phone
        return 'confidential'
      }
    }

    return 'internal' // Default sensitivity
  }

  /**
   * Validates masking tokens for unmasking operations
   */
  validateMaskingTokens(tokens: string[]): boolean {
    // Basic validation - tokens should be non-empty strings
    return tokens.every(token => typeof token === 'string' && token.length > 0)
  }
}