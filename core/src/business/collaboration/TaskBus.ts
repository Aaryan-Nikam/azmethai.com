// Task Bus — Redis-based peer coordination (OpenClaw-style autonomy)
// Agents autonomously claim tasks, coordinate, and publish results

import * as IORedis from 'ioredis'
import { v4 as uuidv4 } from 'uuid'

const RedisClient = (IORedis as any).default ?? IORedis

type RedisInstance = typeof RedisClient extends new (...args: any[]) => infer T ? T : any

export interface TaskBusEvent {
  id: string
  type: 'task_published' | 'task_claimed' | 'task_completed' | 'task_failed' | 'result_published'
  timestamp: Date
  data: any
  agent?: string
}

export interface AgentTaskClaim {
  taskId: string
  agentId: string
  claimedAt: Date
  estimatedDuration: number
  skillsMatching: string[]
  successProbability: number
}

export interface Task {
  id: string
  type: string
  domain: string
  description: string
  requiredSkills: string[]
  priority: number
  payload: any
  deadline?: Date
  createdAt: Date
  claimedBy?: string
  claimedAt?: Date
  completedAt?: Date
  result?: any
  error?: string
  ttl: number // Time-to-live in seconds
  metadata?: Record<string, any>
}

export interface TaskResult {
  taskId: string
  success: boolean
  result?: any
  error?: string
  agentId: string
  executionTime: number
  skillsUsed: string[]
  timestamp: Date
}

export interface AgentRegistration {
  agentId: string
  skills: string[]
  domains: string[]
  capacity: number // Max concurrent tasks
  successRate: number
  registeredAt: Date
  lastHeartbeat: Date
}

export class TaskBus {
  private redis: RedisInstance
  private pubsub: RedisInstance
  private agentId: string
  private subscribers: Map<string, Set<(event: TaskBusEvent) => void>> = new Map()
  private claimedTasks: Set<string> = new Set()
  private heartbeatInterval?: NodeJS.Timeout
  private claimReaperInterval?: NodeJS.Timeout
  private readonly claimedTasksSetKey = 'task:claimed:set'
  private readonly claimTtlSeconds = 300

  constructor(agentId: string, redisUrl: string = 'redis://localhost:6379') {
    this.agentId = agentId
    this.redis = new RedisClient(redisUrl)
    this.pubsub = new RedisClient(redisUrl)
    this.setupPubSub()
    this.startHeartbeat()
    this.startClaimReaper()
  }

  /**
   * Register agent with its capabilities
   */
  async registerAgent(
    skills: string[],
    domains: string[],
    capacity: number = 5
  ): Promise<void> {
    const registration: AgentRegistration = {
      agentId: this.agentId,
      skills,
      domains,
      capacity,
      successRate: 0.9,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
    }

    await this.redis.hset(
      'agent:registry',
      this.agentId,
      JSON.stringify(registration)
    )

    // Subscribe to task topics matching this agent's skills
    for (const skill of skills) {
      await this.pubsub.subscribe(`task:skill:${skill}`)
    }

    for (const domain of domains) {
      await this.pubsub.subscribe(`task:domain:${domain}`)
    }
  }

  /**
   * Publish a task to the bus (any agent can claim it)
   */
  async publishTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<string> {
    const taskId = `task_${uuidv4()}`
    const fullTask: Task = {
      ...task,
      id: taskId,
      createdAt: new Date(),
    }

    // Store task
    await this.redis.setex(
      `task:${taskId}`,
      task.ttl,
      JSON.stringify(fullTask)
    )

    // Add to task queue by domain
    await this.redis.lpush(`queue:domain:${task.domain}`, taskId)

    // Publish to interested agents
    for (const skill of task.requiredSkills) {
      await this.redis.publish(`task:skill:${skill}`, JSON.stringify({
        event: 'task_published',
        taskId,
        type: task.type,
        priority: task.priority,
      }))
    }

    // Emit local event
    this.emit('task_published', {
      id: taskId,
      type: 'task_published',
      timestamp: new Date(),
      data: fullTask,
    })

    return taskId
  }

  /**
   * Claim a task (agent autonomously picks it up)
   */
  async claimTask(taskId: string, matchingSkills: string[], successProb: number): Promise<boolean> {
    const task = await this.getTask(taskId)
    if (!task) {
      console.warn(`Task ${taskId} not found`)
      return false
    }

    // Check if already claimed
    if (task.claimedBy && task.claimedBy !== this.agentId) {
      return false
    }

    // Atomic claim operation
    const key = `task:claim:${taskId}`
    const claimId = uuidv4()

    const result = await this.redis.set(
      key,
      JSON.stringify({
        agentId: this.agentId,
        claimId,
        timestamp: new Date(),
      }),
      'NX', // Only set if not exists
      'EX', // Expire
      this.claimTtlSeconds
    )

    if (result !== 'OK') {
      return false // Already claimed by another agent
    }

    // Update task claim info
    task.claimedBy = this.agentId
    task.claimedAt = new Date()

    await this.redis.setex(
      `task:${taskId}`,
      task.ttl,
      JSON.stringify(task)
    )

    this.claimedTasks.add(taskId)
    await this.redis.sadd(this.claimedTasksSetKey, taskId)

    // Emit claim event
    this.emit('task_claimed', {
      id: taskId,
      type: 'task_claimed',
      timestamp: new Date(),
      data: {
        taskId,
        agentId: this.agentId,
        matchingSkills,
        successProbability: successProb,
      },
      agent: this.agentId,
    })

    return true
  }

  /**
   * Complete a task and publish result
   */
  async completeTask(taskId: string, result: any): Promise<void> {
    const task = await this.getTask(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    // Verify this agent claimed it
    if (task.claimedBy !== this.agentId) {
      throw new Error('This agent did not claim the task')
    }

    // Update task with result
    task.result = result
    task.completedAt = new Date()

    await this.redis.setex(
      `task:${taskId}`,
      task.ttl,
      JSON.stringify(task)
    )

    // Remove stale claim data
    const claimStart = task.claimedAt?.getTime() || Date.now()

    await this.redis.del(`task:claim:${taskId}`)
    await this.redis.srem(this.claimedTasksSetKey, taskId)
    task.claimedBy = undefined
    task.claimedAt = undefined

    // Create result record
    const taskResult: TaskResult = {
      taskId,
      success: true,
      result,
      agentId: this.agentId,
      executionTime: task.completedAt.getTime() - claimStart,
      skillsUsed: [], // Could track which skills were actually used
      timestamp: new Date(),
    }

    await this.redis.setex(
      `result:${taskId}`,
      86400, // 24-hour retention
      JSON.stringify(taskResult)
    )

    // Publish result
    await this.redis.publish(
      `result:domain:${task.domain}`,
      JSON.stringify(taskResult)
    )

    // Remove from claimed
    this.claimedTasks.delete(taskId)

    // Emit completion event
    this.emit('task_completed', {
      id: taskId,
      type: 'task_completed',
      timestamp: new Date(),
      data: taskResult,
      agent: this.agentId,
    })
  }

  /**
   * Fail a task
   */
  async failTask(taskId: string, error: string): Promise<void> {
    const task = await this.getTask(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    task.error = error
    task.completedAt = new Date()

    await this.redis.setex(
      `task:${taskId}`,
      task.ttl,
      JSON.stringify(task)
    )

    const claimStart = task.claimedAt?.getTime() || Date.now()

    const taskResult: TaskResult = {
      taskId,
      success: false,
      error,
      agentId: this.agentId,
      executionTime: task.completedAt.getTime() - claimStart,
      skillsUsed: [],
      timestamp: new Date(),
    }

    await this.redis.del(`task:claim:${taskId}`)
    await this.redis.srem(this.claimedTasksSetKey, taskId)
    task.claimedBy = undefined
    task.claimedAt = undefined

    await this.redis.setex(
      `result:${taskId}`,
      86400,
      JSON.stringify(taskResult)
    )

    this.claimedTasks.delete(taskId)

    this.emit('task_failed', {
      id: taskId,
      type: 'task_failed',
      timestamp: new Date(),
      data: taskResult,
      agent: this.agentId,
    })
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<Task | null> {
    const data = await this.redis.get(`task:${taskId}`)
    if (!data) return null

    const raw = JSON.parse(data)
    return {
      ...raw,
      createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
      deadline: raw.deadline ? new Date(raw.deadline) : undefined,
      claimedAt: raw.claimedAt ? new Date(raw.claimedAt) : undefined,
      completedAt: raw.completedAt ? new Date(raw.completedAt) : undefined,
    }
  }

  /**
   * Get all available tasks for this agent
   */
  async getAvailableTasks(): Promise<Task[]> {
    const agent = await this.getAgentRegistration(this.agentId)
    if (!agent) return []

    const tasks: Task[] = []

    // Get from domain queues
    for (const domain of agent.domains) {
      const taskIds = await this.redis.lrange(`queue:domain:${domain}`, 0, 9) // Top 10
      for (const taskId of taskIds) {
        const task = await this.getTask(taskId)
        if (!task) continue

        if (task.claimedBy) {
          const active = await this.isClaimActive(task.id)
          if (!active) {
            await this.repairStaleClaim(task)
          }
        }

        const refreshed = await this.getTask(taskId)
        if (refreshed && !refreshed.claimedBy) {
          tasks.push(refreshed)
        }
      }
    }

    // Sort by priority
    tasks.sort((a, b) => b.priority - a.priority)

    return tasks
  }

  /**
   * Get result of a completed task
   */
  async getTaskResult(taskId: string): Promise<TaskResult | null> {
    const data = await this.redis.get(`result:${taskId}`)
    return data ? JSON.parse(data) : null
  }

  /**
   * Get agent registration
   */
  async getAgentRegistration(agentId: string): Promise<AgentRegistration | null> {
    const data = await this.redis.hget('agent:registry', agentId)
    return data ? JSON.parse(data) : null
  }

  /**
   * List all active agents
   */
  async listActiveAgents(): Promise<AgentRegistration[]> {
    const data = await this.redis.hgetall('agent:registry')
    const agents: AgentRegistration[] = []

    for (const [, value] of Object.entries(data)) {
      const agent = JSON.parse(value as string)
      const now = Date.now()
      const lastHeartbeat = new Date(agent.lastHeartbeat).getTime()

      // Only include agents with recent heartbeat (< 1 minute)
      if (now - lastHeartbeat < 60000) {
        agents.push(agent)
      }
    }

    return agents
  }

  /**
   * Get agent workload (how many tasks it has claimed)
   */
  async getAgentWorkload(agentId: string): Promise<number> {
    return await this.redis.hlen(`agent:workload:${agentId}`)
  }

  /**
   * Subscribe to events
   */
  on(eventType: string, handler: (event: TaskBusEvent) => void): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }
    this.subscribers.get(eventType)!.add(handler)
  }

  /**
   * Unsubscribe from events
   */
  off(eventType: string, handler: (event: TaskBusEvent) => void): void {
    this.subscribers.get(eventType)?.delete(handler)
  }

  /**
   * Emit event locally
   */
  private emit(eventType: string, event: TaskBusEvent): void {
    const handlers = this.subscribers.get(eventType)
    if (handlers) {
      handlers.forEach(handler => handler(event))
    }
  }

  /**
   * Set up Redis pub/sub for real-time updates
   */
  private setupPubSub(): void {
    this.pubsub.on('message', (channel: string, message: string) => {
      try {
        const data = JSON.parse(message)

        if (channel.startsWith('task:')) {
          this.emit('task_published', {
            id: data.taskId,
            type: 'task_published',
            timestamp: new Date(),
            data,
          })
        }

        if (channel.startsWith('result:')) {
          this.emit('result_published', {
            id: data.taskId,
            type: 'result_published',
            timestamp: new Date(),
            data,
          })
        }
      } catch (error) {
        console.error('Failed to parse pub/sub message:', error)
      }
    })
  }

  /**
   * Periodic heartbeat to keep agent registration fresh
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      const agent = await this.getAgentRegistration(this.agentId)
      if (agent) {
        agent.lastHeartbeat = new Date()
        await this.redis.hset(
          'agent:registry',
          this.agentId,
          JSON.stringify(agent)
        )
      }
    }, 30000) // Every 30 seconds
  }

  private startClaimReaper(): void {
    this.claimReaperInterval = setInterval(async () => {
      try {
        await this.scanAndRepairStaleClaims()
      } catch (error) {
        console.error('Claim reaper error:', error)
      }
    }, 60000) // Every minute
  }

  private async scanAndRepairStaleClaims(): Promise<void> {
    const claimedTaskIds = await this.redis.smembers(this.claimedTasksSetKey)

    for (const taskId of claimedTaskIds) {
      const active = await this.isClaimActive(taskId)
      if (!active) {
        await this.repairStaleClaim(taskId)
      }
    }
  }

  private async isClaimActive(taskId: string): Promise<boolean> {
    return (await this.redis.exists(`task:claim:${taskId}`)) === 1
  }

  private async repairStaleClaim(taskOrId: Task | string): Promise<void> {
    const taskId = typeof taskOrId === 'string' ? taskOrId : taskOrId.id
    const task = typeof taskOrId === 'string' ? await this.getTask(taskOrId) : taskOrId
    if (!task) {
      await this.redis.srem(this.claimedTasksSetKey, taskId)
      return
    }

    const claimKeyExists = await this.isClaimActive(taskId)
    if (claimKeyExists) return

    task.claimedBy = undefined
    task.claimedAt = undefined

    await this.redis.setex(`task:${task.id}`, task.ttl, JSON.stringify(task))
    await this.redis.srem(this.claimedTasksSetKey, task.id)

    const queueKey = `queue:domain:${task.domain}`
    const queueContents = await this.redis.lrange(queueKey, 0, -1)
    if (!queueContents.includes(task.id)) {
      await this.redis.lpush(queueKey, task.id)
    }

    console.warn(`Repaired stale task claim for ${task.id}`)
  }

  /**
   * Clean up and disconnect
   */
  async disconnect(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    if (this.claimReaperInterval) {
      clearInterval(this.claimReaperInterval)
    }
    await this.redis.quit()
    await this.pubsub.quit()
  }
}