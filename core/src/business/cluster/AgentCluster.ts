// Agent Cluster — Integration layer that wires OpenClaw + Cowork + Azmeth
// Orchestrates real agents with skills, environment access, and peer coordination

import { SkillRegistry } from '../skills/SkillRegistry.js'
import { EnvironmentInterface } from '../environment/EnvironmentInterface.js'
import { TaskBus } from '../collaboration/TaskBus.js'
import { ReflectionEngine } from '../reflection/ReflectionEngine.js'
import { ApprovalChain } from '../security/ApprovalChain.js'
import { Brain } from '../memory/Brain.js'
import { BrowserAgent, BrowserAction } from '../orchestrator/Browseragent.js'
import type { Task, TaskResult, AgentRegistration } from '../collaboration/TaskBus.js'
import type { ExecutionRecord, ExecutionAction } from '../reflection/ReflectionEngine.js'

export interface AgentConfig {
  agentId: string
  skills: string[]
  domains: string[]
  maxConcurrentTasks: number
  approvalRequired: boolean
  cognitiveModel: 'opus-4' | 'sonet-4' // Claude model to use
}

export interface AgentMetrics {
  totalTasksCompleted: number
  successRate: number
  averageExecutionTime: number
  skillsAcquired: number
  skillsUsed: string[]
}

export class AgentCluster {
  private config: AgentConfig
  private skillRegistry: SkillRegistry
  private environment: EnvironmentInterface
  private taskBus: TaskBus
  private reflectionEngine: ReflectionEngine
  private approval: ApprovalChain
  private brain: Brain
  private activeTasks: Map<string, Task> = new Map()
  private metrics: AgentMetrics = {
    totalTasksCompleted: 0,
    successRate: 0,
    averageExecutionTime: 0,
    skillsAcquired: 0,
    skillsUsed: [],
  }

  constructor(config: AgentConfig, dependencies: {
    skillRegistry: SkillRegistry
    environment: EnvironmentInterface
    taskBus: TaskBus
    reflectionEngine: ReflectionEngine
    approval: ApprovalChain
    brain: Brain // Your existing Brain memory system
  }) {
    this.config = config
    this.skillRegistry = dependencies.skillRegistry
    this.environment = dependencies.environment
    this.taskBus = dependencies.taskBus
    this.reflectionEngine = dependencies.reflectionEngine
    this.approval = dependencies.approval
    this.brain = dependencies.brain

    this.initialize()
  }

  /**
   * Initialize the agent cluster
   */
  private async initialize(): Promise<void> {
    // Register with task bus
    await this.taskBus.registerAgent(
      this.config.skills,
      this.config.domains,
      this.config.maxConcurrentTasks
    )

    // Subscribe to new tasks matching this agent's domains
    this.taskBus.on('task_published', (event) => {
      this.onTaskAvailable(event.data)
    })

    // Subscribe to results from other agents
    this.taskBus.on('result_published', (event) => {
      this.onPeerTaskCompleted(event.data)
    })

    console.log(`✨ Agent cluster initialized: ${this.config.agentId}`)
    console.log(`   Skills: ${this.config.skills.join(', ')}`)
    console.log(`   Domains: ${this.config.domains.join(', ')}`)
  }

  /**
   * Main execution loop — claim and execute tasks autonomously
   */
  async runAutonomously(): Promise<void> {
    const checkInterval = setInterval(async () => {
      try {
        // Get available tasks
        const tasks = await this.taskBus.getAvailableTasks()
        if (tasks.length > 0) {
          console.log(`[AgentCluster] Found ${tasks.length} available task(s). Active: ${this.activeTasks.size}`)
        }

        for (const task of tasks) {
          // Skip if we're at capacity
          if (this.activeTasks.size >= this.config.maxConcurrentTasks) {
            break
          }

          // Evaluate if we should claim this task
          const shouldClaim = await this.evaluateTaskFit(task)

          if (shouldClaim) {
            const claimed = await this.taskBus.claimTask(
              task.id,
              this.config.skills,
              0.85 // Success probability
            )

            if (claimed) {
              this.activeTasks.set(task.id, task)
              this.executeTask(task).catch(error => {
                console.error(`Task ${task.id} failed:`, error)
                this.taskBus.failTask(task.id, String(error))
              })
            }
          }
        }
      } catch (error) {
        console.error('Error in autonomous loop:', error)
      }
    }, 5000) // Check every 5 seconds
  }

  /**
   * Evaluate if a task is a good fit for this agent
   */
  private async evaluateTaskFit(task: Task): Promise<boolean> {
    // Check if we have the required skills
    const hasSkills = task.requiredSkills.some(skill =>
      this.config.skills.includes(skill) ||
      this.skillRegistry.hasSkill(skill)
    )

    if (!hasSkills) return false

    // Check if task is in our domains
    const inDomain = this.config.domains.includes(task.domain)

    if (!inDomain) return false

    // Check if we can meet the deadline
    if (task.deadline) {
      const timeAvailable = task.deadline.getTime() - Date.now()
      if (timeAvailable < task.requiredSkills.length * 1000) {
        return false // Not enough time
      }
    }

    // Check success probability based on history
    const successProb = await this.estimateSuccessProbability(task)

    return successProb > 0.6 // Only claim if >60% success chance
  }

  /**
   * Execute a claimed task end-to-end
   */
  private async executeTask(task: Task): Promise<void> {
    console.log(`\n🚀 Task: ${task.type} (${task.id})`)
    console.log(`   Domain: ${task.domain}`)
    console.log(`   Required Skills: ${task.requiredSkills.join(', ')}`)

    const startTime = Date.now()
    const record: ExecutionRecord = {
      taskId: task.id,
      taskType: task.type,
      domain: task.domain,
      description: task.description,
      input: task.payload,
      output: null,
      executionTime: 0,
      status: 'failure',
      actions: [],
      decisions: [],
      resources: [],
      quality: { accuracy: 0, completeness: 0, efficiency: 0 },
      timestamp: new Date(),
    }

    try {
      let result: any
      let skill: any | null = null

      if (task.type === 'browser') {
        const browserAgent = new BrowserAgent({}, async (action: BrowserAction) =>
          this.approveBrowserAction(action, task)
        )

        const goal = task.payload?.goal || task.description
        const browserResult = await browserAgent.execute(task.id, goal)
        result = browserResult

        if (!browserResult.success) {
          throw new Error(browserResult.error || 'Browser task failed')
        }
      } else {
        // Step 1: Find best skill for this task
        skill = this.skillRegistry.suggestBestSkill({
          domain: task.domain,
          tags: task.requiredSkills,
          minSuccessRate: 0.5,
        })

        if (!skill) {
          throw new Error(`No suitable skill found for ${task.type}`)
        }

        console.log(`   Skill: ${skill.metadata.name} (${(skill.metadata.successRate * 100).toFixed(1)}% success)`)

        // Step 2: Check with governance/approval if needed
        if (this.config.approvalRequired) {
          const approval = await this.approval.checkGovernance(
            task.id,
            { taskType: task.type, payload: task.payload },
            this.config.agentId,
            task.domain
          )

          if (!approval.approved) {
            throw new Error(`Governance blocked: ${approval.reason}`)
          }
        }

        // Step 3: Store task context in Brain (for reference during execution)
        await this.brain.store(
          JSON.stringify({
            type: 'task_context',
            taskId: task.id,
            description: task.description,
            context: task.payload,
          }),
          {
            source: 'agent',
            type: 'experience',
            tags: ['task_context', task.domain],
            importance: 0.7,
            tenantId: task.domain,
            roleId: this.config.agentId,
          }
        )

        // Step 4: Execute skill with environment access
        result = await this.executeSkill(skill, task, record)
      }

      record.output = result
      record.status = 'success'

      // Step 5: Complete task and publish result
      await this.taskBus.completeTask(task.id, result)

      console.log(`   ✅ Completed in ${Math.round((Date.now() - startTime) / 1000)}s`)

      // Step 6: Reflect and queue any learned patterns for review
      record.executionTime = Date.now() - startTime
      this.reflectionEngine.recordExecution(record)

      const pendingReviews = this.reflectionEngine.getReviewCandidates()
      if (pendingReviews.length > 0) {
        console.log(`   📝 ${pendingReviews.length} learned patterns pending review before crystallization`)
      }

      const newSkills = await this.reflectionEngine.checkForCrystallization()
      if (newSkills.length > 0) {
        console.log(`   🌟 Crystallized ${newSkills.length} new skills!`)
        this.config.skills.push(...newSkills)

        // Update Brain with new capabilities
        await this.brain.store(
          JSON.stringify({
            type: 'skill_acquired',
            skillIds: newSkills,
          }),
          {
            source: 'agent',
            type: 'experience',
            tags: ['skill_acquired', task.domain],
            importance: 0.8,
            tenantId: task.domain,
            roleId: this.config.agentId,
          }
        )
      }

      // Update skill usage for non-browser tasks
      if (skill) {
        this.skillRegistry.recordSuccessfulExecution(skill.metadata.id, JSON.stringify(task.payload), JSON.stringify(result), Date.now() - startTime)
      }

      this.metrics.totalTasksCompleted++
      this.metrics.successRate = (this.metrics.totalTasksCompleted * 0.95) / (this.metrics.totalTasksCompleted + 1) // Exponential moving average
    } catch (error) {
      console.error(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`)

      record.status = 'failure'
      record.executionTime = Date.now() - startTime

      this.reflectionEngine.recordExecution(record)
      await this.taskBus.failTask(task.id, String(error))

      // Log failure for learning
      await this.brain.store(
        JSON.stringify({
          type: 'task_failure',
          taskId: task.id,
          error: String(error),
        }),
        {
          source: 'agent',
          type: 'experience',
          tags: ['task_failure', task.domain],
          importance: 0.5,
          tenantId: task.domain,
          roleId: this.config.agentId,
        }
      )
    } finally {
      this.activeTasks.delete(task.id)
    }
  }

  /**
   * Execute a skill using environment interface
   */
  private async executeSkill(
    skill: any, // SkillDefinition
    task: Task,
    record: ExecutionRecord
  ): Promise<any> {
    // For now, this is a placeholder that would invoke the actual skill code
    // In production, you'd eval/compile the TypeScript and run it

    console.log(`      Executing: ${skill.metadata.name}`)

    // Simulate execution with environment access
    const actions: ExecutionAction[] = []

    // Example: If this is a browser task
    if (task.domain === 'web_automation') {
      actions.push({
        type: 'browser',
        description: 'Launch browser',
        duration: 2000,
        success: true,
      })

      actions.push({
        type: 'browser',
        description: `Navigate to target`,
        duration: 3000,
        success: true,
      })
    }

    // Example: If this is a data task
    if (task.domain === 'data_processing') {
      actions.push({
        type: 'filesystem',
        description: 'Read input file',
        duration: 500,
        success: true,
      })

      actions.push({
        type: 'filesystem',
        description: 'Write output file',
        duration: 500,
        success: true,
      })
    }

    record.actions = actions
    record.quality = {
      accuracy: 0.95,
      completeness: 0.9,
      efficiency: 0.85,
    }

    // Return simulated result
    return {
      status: 'completed',
      domain: task.domain,
      taskType: task.type,
      result: `Processed: ${task.description}`,
      timestamp: new Date(),
    }
  }

  /**
   * Estimate success probability for a task
   */
  private async estimateSuccessProbability(task: Task): Promise<number> {
    // Use Brain to check if we've done similar tasks before
    const similar = await this.brain.query({
      text: task.description,
      tenantId: task.domain,
      roleId: this.config.agentId,
      limit: 10,
    })

    if (similar.nodes.length > 0) {
      // If we've done this before, high confidence
      return 0.9
    }

    // Otherwise, check skill success rates
    let skillScore = 0
    let scoredSkills = 0

    for (const skill of task.requiredSkills) {
      const skillDef = this.skillRegistry.getSkill(skill)
      if (skillDef) {
        skillScore += skillDef.metadata.successRate
        scoredSkills += 1
      } else if (this.config.skills.includes(skill)) {
        // If the agent explicitly reports the skill but there's no registry entry,
        // assume a conservative default success probability.
        skillScore += 0.75
        scoredSkills += 1
      }
    }

    if (scoredSkills === 0) {
      return 0.65
    }

    return Math.min(1, skillScore / scoredSkills)
  }

  private async approveBrowserAction(action: BrowserAction, task: Task): Promise<boolean> {
    const toolName = `browser_${action.type}`
    const risk = await this.approval.classify(
      toolName,
      { action, taskId: task.id, taskType: task.type },
      this.config.agentId,
      task.domain
    )

    if (risk.level === 'LOW') {
      return true
    }

    await this.approval.writeToQueue(
      task.domain,
      this.config.agentId,
      `browser_task_${task.id}`,
      toolName,
      { action, taskId: task.id },
      risk
    )

    console.warn(`[AgentCluster] Browser action queued for approval: ${toolName}`)
    return false
  }

  /**
   * Handle when a task becomes available
   */
  private async onTaskAvailable(task: Task): Promise<void> {
    // Evaluated passively in the autonomous loop
  }

  /**
   * React when a peer agent completes a task
   */
  private async onPeerTaskCompleted(result: TaskResult): Promise<void> {
    // Store peer results in Brain for collective learning
    await this.brain.store(
      JSON.stringify({
        type: 'peer_task_result',
        peerId: result.agentId,
        taskId: result.taskId,
        success: result.success,
        skillsUsed: result.skillsUsed,
      }),
      {
        source: 'agent',
        type: 'experience',
        tags: ['peer_task_result'],
        importance: 0.5,
        tenantId: result.taskId,
        roleId: result.agentId,
      }
    )

    console.log(`📡 Learned from peer: ${result.agentId} completed ${result.taskId}`)
  }

  /**
   * Get agent metrics
   */
  getMetrics(): AgentMetrics {
    return { ...this.metrics }
  }

  /**
   * Get agent status
   */
  async getStatus(): Promise<{
    agentId: string
    activeTasks: number
    status: 'idle' | 'busy' | 'learning'
    metrics: AgentMetrics
    reflectionReport: any
    insights: any
  }> {
    const reflectionReport = this.reflectionEngine.getReflectionReport()
    const insights = this.reflectionEngine.getExecutionInsights()

    return {
      agentId: this.config.agentId,
      activeTasks: this.activeTasks.size,
      status: this.activeTasks.size === 0 ? 'idle' : this.activeTasks.size < 3 ? 'busy' : 'learning',
      metrics: this.getMetrics(),
      reflectionReport,
      insights,
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.environment.cleanup()
    await this.taskBus.disconnect()
  }
}