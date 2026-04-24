// Reflection Engine — Extract patterns from successful executions and crystallize skills
// Enables agents to learn and grow over time (self-evolution)

import type { TaskExecutionResult } from '../orchestrator/orchestrator-types.js'
import type { SkillMetadata, SkillDefinition } from '../skills/SkillRegistry.js'
import { SkillRegistry } from '../skills/SkillRegistry.js'

export interface ExecutionRecord {
  taskId: string
  taskType: string
  domain: string
  description: string
  input: any
  output: any
  executionTime: number
  status: 'success' | 'failure'
  actions: ExecutionAction[]
  decisions: DecisionPoint[]
  resources: ResourceUsage[]
  quality: QualityMetrics
  timestamp: Date
}

export interface ExecutionAction {
  type: 'browser' | 'filesystem' | 'terminal' | 'http' | 'cognitive'
  description: string
  selector?: string
  value?: string
  result?: any
  duration: number
  success: boolean
}

export interface DecisionPoint {
  description: string
  alternatives: string[]
  chosen: string
  reasoning: string
  confidence: number
}

export interface ResourceUsage {
  type: 'cpu' | 'memory' | 'network' | 'api_calls'
  amount: number
  cost?: number
}

export interface QualityMetrics {
  accuracy: number // 0-1
  completeness: number // 0-1
  efficiency: number // 0-1
}

export interface ExtractedPattern {
  name: string
  description: string
  domain: string
  pattern: string // Abstract description of the approach
  preconditions: string[]
  postconditions: string[]
  successRate: number
  averageCost: number
  examples: Array<{
    input: string
    output: string
  }>
  confidence: number // How confident are we this is a generalizable skill?
}

export interface SkillCrystal {
  basePattern: ExtractedPattern
  implementation: string // TypeScript code
  dependencies: string[]
  testCases: Array<{
    input: any
    expectedOutput: any
  }>
  metadata: {
    generalizationScore: number // How well does it generalize?
    specialization: string // What specific domain is it optimized for?
    preconditions: string[]
    risks: string[]
  }
}

export type ReviewStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'

export interface PatternReviewCandidate extends ExtractedPattern {
  status: ReviewStatus
  createdAt: Date
  updatedAt: Date
  reviewerComments?: string[]
}

export class ReflectionEngine {
  private skillRegistry: SkillRegistry
  private executionHistory: Map<string, ExecutionRecord> = new Map()
  private patterns: Map<string, ExtractedPattern> = new Map()
  private reviewCandidates: Map<string, PatternReviewCandidate> = new Map()
  private learningThreshold = 3 // Need 3 successful executions to crystallize a skill

  constructor(skillRegistry: SkillRegistry) {
    this.skillRegistry = skillRegistry
  }

  /**
   * Record an execution for later reflection
   */
  recordExecution(record: ExecutionRecord): void {
    this.executionHistory.set(record.taskId, record)

    // Immediately attempt pattern extraction
    this.analyzeExecution(record)
  }

  /**
   * Analyze a single execution for patterns
   */
  private analyzeExecution(record: ExecutionRecord): void {
    // Extract high-level pattern from execution trace
    const pattern = this.extractPatternFromActions(record)

    if (pattern) {
      const key = `${record.domain}:${pattern.name}`

      if (this.patterns.has(key)) {
        // Update frequency and confidence
        const existing = this.patterns.get(key)!
        existing.successRate = (existing.successRate + pattern.successRate) / 2
        existing.confidence = Math.min(1, existing.confidence + 0.1)
        existing.examples.push(...pattern.examples)
      } else {
        this.patterns.set(key, pattern)
      }

      this.enqueueReviewCandidate(key)
    }
  }

  /**
   * Extract a reusable pattern from execution actions
   */
  private extractPatternFromActions(record: ExecutionRecord): ExtractedPattern | null {
    if (record.status !== 'success') {
      return null
    }

    // Analyze action sequence to identify repeatable steps
    const actionSequence = record.actions.map(a => a.type).join(' → ')

    // Group similar actions
    const actionGroups = this.groupSimilarActions(record.actions)

    // Extract preconditions and postconditions
    const preconditions = this.identifyPreconditions(record)
    const postconditions = this.identifyPostconditions(record)

    return {
      name: `${record.taskType}_pattern`,
      description: `Learned pattern for ${record.taskType}: ${record.description}`,
      domain: record.domain,
      pattern: actionSequence,
      preconditions,
      postconditions,
      successRate: record.quality.accuracy,
      averageCost: record.resources.reduce((sum, r) => sum + (r.cost || 0), 0),
      examples: [
        {
          input: JSON.stringify(record.input),
          output: JSON.stringify(record.output),
        },
      ],
      confidence: 0.3, // Start low, increase with more examples
    }
  }

  /**
   * Check if patterns are ready to crystallize into skills
   */
  async checkForCrystallization(): Promise<string[]> {
    const crystallizedSkills: string[] = []

    for (const candidate of this.reviewCandidates.values()) {
      if (candidate.status === 'APPROVED') {
        const skillId = await this.crystallizeSkill(candidate)
        if (skillId) {
          crystallizedSkills.push(skillId)
          this.reviewCandidates.delete(`${candidate.domain}:${candidate.name}`)
          this.patterns.delete(`${candidate.domain}:${candidate.name}`)
        }
      }
    }

    return crystallizedSkills
  }

  getReviewCandidates(): PatternReviewCandidate[] {
    return Array.from(this.reviewCandidates.values())
  }

  approvePattern(patternKey: string, comment?: string): void {
    const candidate = this.reviewCandidates.get(patternKey)
    if (!candidate) {
      throw new Error(`No review candidate found for ${patternKey}`)
    }
    candidate.status = 'APPROVED'
    candidate.updatedAt = new Date()
    if (comment) {
      candidate.reviewerComments = [...(candidate.reviewerComments || []), comment]
    }
  }

  rejectPattern(patternKey: string, comment?: string): void {
    const candidate = this.reviewCandidates.get(patternKey)
    if (!candidate) {
      throw new Error(`No review candidate found for ${patternKey}`)
    }
    candidate.status = 'REJECTED'
    candidate.updatedAt = new Date()
    if (comment) {
      candidate.reviewerComments = [...(candidate.reviewerComments || []), comment]
    }
  }

  /**
   * Crystallize a pattern into a deployable skill
   */
  private async crystallizeSkill(pattern: ExtractedPattern): Promise<string | null> {
    try {
      const skillId = `learned_${pattern.domain}_${Math.random().toString(36).substr(2, 9)}`

      // Generate TypeScript implementation from pattern
      const implementation = this.generateImplementation(pattern)

      // Generate test cases
      const testCases = pattern.examples.map(ex => ({
        input: JSON.parse(ex.input),
        expectedOutput: JSON.parse(ex.output),
      }))

      // Create skill definition
      const skillDef: SkillDefinition = {
        metadata: {
          id: skillId,
          name: pattern.name,
          description: pattern.description,
          domain: pattern.domain,
          successRate: pattern.successRate,
          lastUsed: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [pattern.domain, 'learned', 'auto-generated'],
          dependencies: [],
          cost: pattern.averageCost,
          timeout: 30000,
          examples: pattern.examples.slice(0, 5).map(ex => ({
            input: ex.input,
            output: ex.output,
            timestamp: new Date(),
          })),
        },
        code: implementation,
        requirements: [],
        instructions: `Auto-generated skill for ${pattern.name}. Preconditions: ${pattern.preconditions.join(', ')}`,
      }

      await this.skillRegistry.saveSkill(skillId, skillDef)

      console.log(`✨ Crystallized skill: ${skillId}`)
      console.log(`   Domain: ${pattern.domain}`)
      console.log(`   Success Rate: ${(pattern.successRate * 100).toFixed(1)}%`)
      console.log(`   Examples: ${pattern.examples.length}`)

      return skillId
    } catch (error) {
      console.error('Failed to crystallize skill:', error)
      return null
    }
  }

  /**
   * Generate TypeScript implementation from pattern
   */
  private generateImplementation(pattern: ExtractedPattern): string {
    const code = `/**
 * @domain ${pattern.domain}
 * @tags ${['learned', pattern.domain].join(', ')}
 * @description ${pattern.description}
 */

export async function execute(input: any, env: EnvironmentInterface): Promise<any> {
  // Auto-generated from execution pattern
  // Pattern: ${pattern.pattern}
  // Success Rate: ${(pattern.successRate * 100).toFixed(1)}%

  try {
    // Preconditions
    ${pattern.preconditions.map(p => `// - ${p}`).join('\n    ')}

    // Execution steps (learned from ${pattern.examples.length} successful runs)
    const result = await executeLearnedPattern(input, env);

    // Postconditions
    ${pattern.postconditions.map(p => `// - ${p}`).join('\n    ')}

    return result;
  } catch (error) {
    console.error('Skill execution failed:', error);
    throw error;
  }
}

async function executeLearnedPattern(input: any, env: any): Promise<any> {
  // TODO: Fill in with actual implementation based on execution trace
  // For now, return structured template
  return {
    status: 'completed',
    result: input,
    appliedPattern: '${pattern.name}',
    timestamp: new Date().toISOString(),
  };
}
`
    return code
  }

  /**
   * Get reflection report (learning progress)
   */
  getReflectionReport(): {
    executionsTracked: number
    patternsIdentified: number
    pendingReviews: number
    skillsCrystallized: number
    learningProgress: Array<{
      pattern: string
      examples: number
      successRate: number
      readyForCrystallization: boolean
      status: ReviewStatus
    }>
  } {
    const report = {
      executionsTracked: this.executionHistory.size,
      patternsIdentified: this.patterns.size,
      pendingReviews: Array.from(this.reviewCandidates.values()).filter(c => c.status === 'PENDING_REVIEW').length,
      skillsCrystallized: this.skillRegistry.listAllSkills().filter(s => s.tags.includes('learned')).length,
      learningProgress: Array.from(this.patterns.values())
        .map(p => ({
          pattern: p.name,
          examples: p.examples.length,
          successRate: p.successRate,
          readyForCrystallization: p.examples.length >= this.learningThreshold && p.successRate > 0.8,
          status: this.reviewCandidates.get(`${p.domain}:${p.name}`)?.status ?? 'PENDING_REVIEW',
        }))
        .sort((a, b) => b.examples - a.examples),
    }

    return report
  }

  /**
   * Get insights from execution history
   */
  getExecutionInsights(): {
    averageExecutionTime: number
    successRate: number
    mostCommonDomains: Array<{ domain: string; count: number }>
    inefficiencies: string[]
  } {
    const executions = Array.from(this.executionHistory.values())

    if (executions.length === 0) {
      return {
        averageExecutionTime: 0,
        successRate: 0,
        mostCommonDomains: [],
        inefficiencies: [],
      }
    }

    // Calculate average execution time
    const avgTime = executions.reduce((sum, e) => sum + e.executionTime, 0) / executions.length

    // Calculate success rate
    const successRate = executions.filter(e => e.status === 'success').length / executions.length

    // Count by domain
    const domainCounts = new Map<string, number>()
    for (const exec of executions) {
      domainCounts.set(exec.domain, (domainCounts.get(exec.domain) || 0) + 1)
    }

    const mostCommonDomains = Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count }))

    // Identify inefficiencies
    const inefficiencies: string[] = []

    // Check for slow executions
    const slowExecutions = executions.filter(e => e.executionTime > avgTime * 2)
    if (slowExecutions.length > 0) {
      inefficiencies.push(
        `${slowExecutions.length} executions were 2x slower than average (${Math.round(avgTime)}ms)`
      )
    }

    // Check for high-error domains
    const errorRates = new Map<string, number>()
    for (const exec of executions) {
      const rate = exec.status === 'failure' ? 1 : 0
      errorRates.set(exec.domain, (errorRates.get(exec.domain) || 0) + rate)
    }

    for (const [domain, errors] of errorRates.entries()) {
      const count = domainCounts.get(domain) || 1
      if (errors / count > 0.2) {
        inefficiencies.push(`${domain} has ${((errors / count) * 100).toFixed(1)}% error rate`)
      }
    }

    return {
      averageExecutionTime: Math.round(avgTime),
      successRate,
      mostCommonDomains,
      inefficiencies,
    }
  }

  private groupSimilarActions(actions: ExecutionAction[]): ExecutionAction[][] {
    const groups: ExecutionAction[][] = []
    let currentGroup: ExecutionAction[] = []

    for (const action of actions) {
      if (currentGroup.length === 0 || currentGroup[0].type === action.type) {
        currentGroup.push(action)
      } else {
        groups.push(currentGroup)
        currentGroup = [action]
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    return groups
  }

  private identifyPreconditions(record: ExecutionRecord): string[] {
    return [
      `Task type: ${record.taskType}`,
      `Domain: ${record.domain}`,
      'Input validation passed',
    ]
  }

  private identifyPostconditions(record: ExecutionRecord): string[] {
    return [
      'Output generated successfully',
      'All resources cleaned up',
      `Quality score: ${(record.quality.accuracy * 100).toFixed(1)}%`,
    ]
  }

  private enqueueReviewCandidate(patternKey: string): void {
    if (this.reviewCandidates.has(patternKey)) {
      const candidate = this.reviewCandidates.get(patternKey)!
      candidate.updatedAt = new Date()
      return
    }

    const pattern = this.patterns.get(patternKey)
    if (!pattern) {
      return
    }

    const candidate: PatternReviewCandidate = {
      ...pattern,
      status: 'PENDING_REVIEW',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (
      candidate.examples.length >= this.learningThreshold &&
      candidate.successRate > 0.8 &&
      candidate.confidence > 0.6
    ) {
      this.reviewCandidates.set(patternKey, candidate)
    }
  }
}
