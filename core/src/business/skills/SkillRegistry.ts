// Skill Registry — Cowork-style skill library with persistence and discovery

import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export interface SkillMetadata {
  id: string
  name: string
  description: string
  domain: string // 'email', 'scraping', 'crm', 'pdf', 'workflow', etc.
  successRate: number // 0-1
  lastUsed: Date
  createdAt: Date
  updatedAt: Date
  tags: string[]
  dependencies: string[] // other skills needed
  cost: number // compute cost estimate
  timeout: number // max execution time
  examples: Array<{
    input: string
    output: string
    timestamp: Date
  }>
}

export interface SkillDefinition {
  metadata: SkillMetadata
  code: string // The actual implementation
  requirements?: string[] // npm packages needed
  instructions?: string // Human-readable guide
}

export interface SkillQuery {
  domain?: string
  tags?: string[]
  minSuccessRate?: number
  maxCost?: number
}

export class SkillRegistry {
  private skillsPath: string
  private registry: Map<string, SkillDefinition> = new Map()
  private refreshInterval?: NodeJS.Timeout

  constructor(skillsBasePath: string = './skills') {
    this.skillsPath = skillsBasePath
    this.initializeRegistry()
    // Auto-refresh every 5 minutes
    this.refreshInterval = setInterval(() => this.loadAllSkills(), 5 * 60 * 1000)
  }

  /**
   * Initialize registry and load all available skills
   */
  private async initializeRegistry(): Promise<void> {
    try {
      await mkdir(this.skillsPath, { recursive: true })
      await this.loadAllSkills()
    } catch (error) {
      console.error('Failed to initialize skill registry:', error)
    }
  }

  /**
   * Load all skills from disk
   */
  async loadAllSkills(): Promise<void> {
    try {
      const files = await readdir(this.skillsPath)
      const skillFiles = files.filter(f => f.endsWith('.skill.json') || f.endsWith('.skill.ts'))

      for (const file of skillFiles) {
        const skillId = file.replace(/\.(skill\.json|skill\.ts)$/, '')
        try {
          await this.loadSkill(skillId)
        } catch (error) {
          console.error(`Failed to load skill ${skillId}:`, error)
        }
      }

      console.log(`Loaded ${this.registry.size} skills`)
    } catch (error) {
      console.error('Failed to load skills directory:', error)
    }
  }

  /**
   * Load a specific skill by ID
   */
  async loadSkill(skillId: string): Promise<SkillDefinition | null> {
    try {
      // Try JSON format first
      const jsonPath = join(this.skillsPath, `${skillId}.skill.json`)
      try {
        const content = await readFile(jsonPath, 'utf-8')
        const skill = JSON.parse(content) as SkillDefinition
        this.registry.set(skillId, skill)
        return skill
      } catch (e) {
        // Try TypeScript format
        const tsPath = join(this.skillsPath, `${skillId}.skill.ts`)
        const tsContent = await readFile(tsPath, 'utf-8')
        
        // Parse TypeScript file to extract metadata + code
        const skill = this.parseTypeScriptSkill(skillId, tsContent)
        this.registry.set(skillId, skill)
        return skill
      }
    } catch (error) {
      console.error(`Failed to load skill ${skillId}:`, error)
      return null
    }
  }

  /**
   * Find skills matching criteria (like Cowork's skill discovery)
   */
  findSkills(query: SkillQuery): SkillDefinition[] {
    const results: SkillDefinition[] = []

    for (const skill of this.registry.values()) {
      // Check domain match
      if (query.domain && skill.metadata.domain !== query.domain) {
        continue
      }

      // Check tags
      if (query.tags && !query.tags.some(tag => skill.metadata.tags.includes(tag))) {
        continue
      }

      // Check success rate
      if (query.minSuccessRate && skill.metadata.successRate < query.minSuccessRate) {
        continue
      }

      // Check cost
      if (query.maxCost && skill.metadata.cost > query.maxCost) {
        continue
      }

      results.push(skill)
    }

    // Sort by success rate (best first)
    results.sort((a, b) => b.metadata.successRate - a.metadata.successRate)
    return results
  }

  /**
   * Get skill by ID
   */
  getSkill(skillId: string): SkillDefinition | null {
    return this.registry.get(skillId) || null
  }

  /**
   * Check if skill exists
   */
  hasSkill(skillId: string): boolean {
    return this.registry.has(skillId)
  }

  /**
   * Save a new skill (crystallized from successful execution)
   */
  async saveSkill(skillId: string, skill: SkillDefinition): Promise<void> {
    try {
      const path = join(this.skillsPath, `${skillId}.skill.json`)
      await writeFile(path, JSON.stringify(skill, null, 2), 'utf-8')
      this.registry.set(skillId, skill)
      console.log(`Saved skill: ${skillId}`)
    } catch (error) {
      console.error(`Failed to save skill ${skillId}:`, error)
      throw error
    }
  }

  /**
   * Update skill metadata (success rate, last used, etc.)
   */
  async updateSkillMetadata(skillId: string, updates: Partial<SkillMetadata>): Promise<void> {
    const skill = this.registry.get(skillId)
    if (!skill) {
      throw new Error(`Skill ${skillId} not found`)
    }

    skill.metadata = {
      ...skill.metadata,
      ...updates,
      updatedAt: new Date(),
    }

    await this.saveSkill(skillId, skill)
  }

  /**
   * Record a successful execution for skill feedback
   */
  async recordSuccessfulExecution(
    skillId: string,
    input: string,
    output: string,
    executionTime: number
  ): Promise<void> {
    const skill = this.registry.get(skillId)
    if (!skill) return

    // Update success rate
    const examples = skill.metadata.examples || []
    examples.push({
      input,
      output,
      timestamp: new Date(),
    })

    // Keep only last 10 examples
    if (examples.length > 10) {
      examples.shift()
    }

    // Boost success rate (exponential moving average)
    const alpha = 0.3 // Weight for new success
    skill.metadata.successRate = skill.metadata.successRate * (1 - alpha) + 1.0 * alpha

    await this.updateSkillMetadata(skillId, {
      successRate: skill.metadata.successRate,
      lastUsed: new Date(),
      examples,
    })
  }

  /**
   * Record a failed execution
   */
  async recordFailedExecution(skillId: string): Promise<void> {
    const skill = this.registry.get(skillId)
    if (!skill) return

    // Slightly lower success rate on failure
    const alpha = 0.1
    skill.metadata.successRate = Math.max(0, skill.metadata.successRate * (1 - alpha) + 0 * alpha)

    await this.updateSkillMetadata(skillId, {
      successRate: skill.metadata.successRate,
      lastUsed: new Date(),
    })
  }

  /**
   * List all available skills
   */
  listAllSkills(): SkillMetadata[] {
    return Array.from(this.registry.values()).map(s => s.metadata)
  }

  /**
   * Get skills by domain
   */
  getSkillsByDomain(domain: string): SkillDefinition[] {
    return Array.from(this.registry.values()).filter(s => s.metadata.domain === domain)
  }

  /**
   * Suggest best skill for a task
   */
  suggestBestSkill(query: SkillQuery): SkillDefinition | null {
    const candidates = this.findSkills(query)
    return candidates.length > 0 ? candidates[0] : null
  }

  /**
   * Check if skill is ready (has dependencies)
   */
  isSkillReady(skillId: string): boolean {
    const skill = this.registry.get(skillId)
    if (!skill) return false

    // Check if all dependencies are available
    if (skill.metadata.dependencies && skill.metadata.dependencies.length > 0) {
      return skill.metadata.dependencies.every(dep => this.hasSkill(dep))
    }

    return true
  }

  /**
   * Get dependency chain for a skill
   */
  getDependencyChain(skillId: string): string[] {
    const skill = this.registry.get(skillId)
    if (!skill) return []

    const chain: string[] = [skillId]
    const dependencies = skill.metadata.dependencies || []

    for (const dep of dependencies) {
      chain.push(...this.getDependencyChain(dep))
    }

    return [...new Set(chain)] // Remove duplicates
  }

  private parseTypeScriptSkill(skillId: string, tsContent: string): SkillDefinition {
    // Extract metadata from TSDoc comments
    const metadataMatch = tsContent.match(/\/\*\*([\s\S]*?)\*\//)
    const metadata: SkillMetadata = {
      id: skillId,
      name: skillId.replace(/-/g, ' '),
      description: 'TypeScript skill',
      domain: 'custom',
      successRate: 0.5,
      lastUsed: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      dependencies: [],
      cost: 10,
      timeout: 30000,
      examples: [],
    }

    // Try to extract metadata from comments
    if (metadataMatch) {
      const comment = metadataMatch[1]
      const domainMatch = comment.match(/@domain\s+(\w+)/)
      const tagsMatch = comment.match(/@tags\s+(.+)/)
      const descMatch = comment.match(/@description\s+(.+?)(?:\n|@)/)

      if (domainMatch) metadata.domain = domainMatch[1]
      if (tagsMatch) metadata.tags = tagsMatch[1].split(',').map(t => t.trim())
      if (descMatch) metadata.description = descMatch[1].trim()
    }

    return {
      metadata,
      code: tsContent,
    }
  }

  destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  }
}