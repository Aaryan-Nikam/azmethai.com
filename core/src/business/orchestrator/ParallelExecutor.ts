import type {
  TaskStep,
  TaskResource,
  TaskExecutionResult,
  ParallelExecutionGroup,
  OrchestrationContext,
  ExecutionEngine
} from './orchestrator-types.js'

export interface ExecutionConfig {
  maxConcurrentSteps: number
  maxRetries: number
  retryDelay: number
  timeout: number
  resourceLockTimeout: number
}

export class ParallelExecutor {
  private config: ExecutionConfig
  private executionEngine: ExecutionEngine
  private activeExecutions: Map<string, Promise<TaskExecutionResult>> = new Map()
  private resourceLocks: Map<string, string> = new Map() // resourceId -> stepId

  constructor(config: ExecutionConfig, executionEngine: ExecutionEngine) {
    this.config = config
    this.executionEngine = executionEngine
  }

  /**
   * Executes a group of steps in parallel
   */
  async executeParallelGroup(
    group: ParallelExecutionGroup,
    availableResources: TaskResource[],
    context: OrchestrationContext
  ): Promise<TaskExecutionResult[]> {
    const results: TaskExecutionResult[] = []
    const executionPromises: Promise<TaskExecutionResult>[] = []

    // Check resource availability for the entire group
    if (!this.canAllocateGroupResources(group, availableResources)) {
      throw new Error('Insufficient resources for parallel execution group')
    }

    // Allocate resources for each step
    const resourceAllocations = await this.allocateGroupResources(group, availableResources)

    // Start execution of all steps in parallel
    for (const step of group.steps) {
      const stepResources = resourceAllocations[step.id] || []
      const executionPromise = this.executeStepWithRetry(step, stepResources, context)
      executionPromises.push(executionPromise)
      this.activeExecutions.set(step.id, executionPromise)
    }

    // Wait for all executions to complete
    try {
      const executionResults = await Promise.allSettled(executionPromises)

      for (let i = 0; i < executionResults.length; i++) {
        const result = executionResults[i]
        const step = group.steps[i]

        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          // Handle failed execution
          const failedResult: TaskExecutionResult = {
            stepId: step.id,
            status: 'failed',
            error: result.reason?.message || 'Unknown execution error',
            actualDuration: 0,
            onTime: false,
            startedAt: new Date(),
            completedAt: new Date(),
          }
          results.push(failedResult)
        }

        // Clean up
        this.activeExecutions.delete(step.id)
      }
    } finally {
      // Release all resource locks
      for (const step of group.steps) {
        await this.releaseStepResources(step.id, resourceAllocations[step.id] || [])
      }
    }

    return results
  }

  /**
   * Executes steps with dynamic resource allocation and load balancing
   */
  async executeWithLoadBalancing(
    steps: TaskStep[],
    availableResources: TaskResource[],
    context: OrchestrationContext
  ): Promise<TaskExecutionResult[]> {
    const results: TaskExecutionResult[] = []
    const executingSteps = new Set<string>()
    const pendingSteps = new Set(steps.map(s => s.id))

    while (pendingSteps.size > 0 || executingSteps.size > 0) {
      // Check for completed executions
      const completedResults = await this.checkCompletedExecutions(executingSteps)
      results.push(...completedResults)

      // Remove completed steps from executing set
      for (const result of completedResults) {
        executingSteps.delete(result.stepId)
        pendingSteps.delete(result.stepId)
      }

      // Start new executions if resources are available
      if (executingSteps.size < this.config.maxConcurrentSteps) {
        const availableSteps = Array.from(pendingSteps)
          .map(id => steps.find(s => s.id === id)!)
          .filter(step => this.canExecuteStep(step, availableResources))

        const stepsToStart = availableSteps.slice(0, this.config.maxConcurrentSteps - executingSteps.size)

        for (const step of stepsToStart) {
          const allocatedResources = await this.allocateStepResources(step, availableResources)
          if (allocatedResources.length > 0) {
            const executionPromise = this.executeStepWithRetry(step, allocatedResources, context)
            this.activeExecutions.set(step.id, executionPromise)
            executingSteps.add(step.id)
          }
        }
      }

      // Wait a bit before checking again
      if (executingSteps.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      } else if (pendingSteps.size > 0) {
        // No steps can execute right now, wait longer
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }

    return results
  }

  /**
   * Monitors and manages active executions
   */
  async monitorExecutions(): Promise<{
    activeCount: number
    completedCount: number
    failedCount: number
    resourceUtilization: Record<string, number>
  }> {
    const activeCount = this.activeExecutions.size
    let completedCount = 0
    let failedCount = 0
    const resourceUtilization: Record<string, number> = {}

    // Check status of active executions
    for (const [stepId, promise] of Array.from(this.activeExecutions)) {
      try {
        const result = await Promise.race([
          promise,
          new Promise<null>(resolve => setTimeout(() => resolve(null), 100)) // Don't block
        ])

        if (result) {
          if (result.status === 'completed') {
            completedCount++
          } else if (result.status === 'failed') {
            failedCount++
          }
        }
      } catch (error) {
        failedCount++
      }
    }

    // Calculate resource utilization
    for (const [resourceId, lockedBy] of Array.from(this.resourceLocks)) {
      resourceUtilization[resourceId] = 1 // Locked = 100% utilized
    }

    return {
      activeCount,
      completedCount,
      failedCount,
      resourceUtilization,
    }
  }

  /**
   * Cancels execution of a specific step
   */
  async cancelStep(stepId: string): Promise<void> {
    const executionPromise = this.activeExecutions.get(stepId)
    if (executionPromise) {
      await this.executionEngine.cancelExecution(stepId)
      this.activeExecutions.delete(stepId)
    }

    // Release resources
    await this.releaseStepResources(stepId, [])
  }

  /**
   * Handles execution failures with different strategies
   */
  async handleExecutionFailure(
    step: TaskStep,
    error: Error,
    context: OrchestrationContext
  ): Promise<'retry' | 'skip' | 'fail' | 'replan'> {
    const failureAnalysis = await this.analyzeFailure(step, error, context)

    switch (failureAnalysis.recommendedAction) {
      case 'retry':
        if (step.priority <= 3 && failureAnalysis.retryCount < this.config.maxRetries) {
          return 'retry'
        }
        break

      case 'skip':
        if (step.priority > 5 && !failureAnalysis.isCritical) {
          return 'skip'
        }
        break

      case 'replan':
        if (failureAnalysis.isCritical || failureAnalysis.affectsMultipleSteps) {
          return 'replan'
        }
        break
    }

    return 'fail'
  }

  /**
   * Optimizes execution order based on resource availability and dependencies
   */
  optimizeExecutionOrder(
    steps: TaskStep[],
    availableResources: TaskResource[]
  ): TaskStep[] {
    // Sort by resource availability and priority
    const sortedSteps = [...steps].sort((a, b) => {
      // First, sort by whether resources are immediately available
      const aAvailable = this.canExecuteStep(a, availableResources)
      const bAvailable = this.canExecuteStep(b, availableResources)

      if (aAvailable && !bAvailable) return -1
      if (!aAvailable && bAvailable) return 1

      // Then by priority (lower number = higher priority)
      return a.priority - b.priority
    })

    return sortedSteps
  }

  private async executeStepWithRetry(
    step: TaskStep,
    resources: TaskResource[],
    context: OrchestrationContext,
    retryCount: number = 0
  ): Promise<TaskExecutionResult> {
    try {
      const result = await Promise.race([
        this.executionEngine.executeStep(step, resources),
        new Promise<TaskExecutionResult>((_, reject) =>
          setTimeout(() => reject(new Error('Execution timeout')), this.config.timeout)
        )
      ])

      return result
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        console.warn(`Step ${step.id} failed, retrying (${retryCount + 1}/${this.config.maxRetries}):`, error)

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)))

        return this.executeStepWithRetry(step, resources, context, retryCount + 1)
      }

      throw error
    }
  }

  private canAllocateGroupResources(
    group: ParallelExecutionGroup,
    availableResources: TaskResource[]
  ): boolean {
    const requiredResources = { ...group.resourceRequirements }

    for (const resource of availableResources) {
      if (resource.status === 'available') {
        for (const skill of resource.capabilities) {
          if (requiredResources[skill] > 0) {
            requiredResources[skill]--
          }
        }
      }
    }

    // Check if all requirements are satisfied
    return Object.values(requiredResources).every(count => count <= 0)
  }

  private async allocateGroupResources(
    group: ParallelExecutionGroup,
    availableResources: TaskResource[]
  ): Promise<Record<string, TaskResource[]>> {
    const allocations: Record<string, TaskResource[]> = {}
    const usedResources = new Set<string>()

    for (const step of group.steps) {
      const stepResources: TaskResource[] = []

      for (const skill of step.requiredSkills) {
        // Find available resource with this skill
        const suitableResource = availableResources.find(r =>
          !usedResources.has(r.id) &&
          r.status === 'available' &&
          r.capabilities.includes(skill)
        )

        if (suitableResource) {
          stepResources.push(suitableResource)
          usedResources.add(suitableResource.id)
          await this.lockResource(suitableResource.id, step.id)
        }
      }

      allocations[step.id] = stepResources
    }

    return allocations
  }

  private async allocateStepResources(
    step: TaskStep,
    availableResources: TaskResource[]
  ): Promise<TaskResource[]> {
    const allocated: TaskResource[] = []

    for (const skill of step.requiredSkills) {
      const suitableResource = availableResources.find(r =>
        r.status === 'available' &&
        r.capabilities.includes(skill) &&
        !this.resourceLocks.has(r.id)
      )

      if (suitableResource) {
        allocated.push(suitableResource)
        await this.lockResource(suitableResource.id, step.id)
      }
    }

    return allocated
  }

  private async lockResource(resourceId: string, stepId: string): Promise<void> {
    this.resourceLocks.set(resourceId, stepId)
  }

  private async releaseStepResources(stepId: string, resources: TaskResource[]): Promise<void> {
    for (const resource of resources) {
      if (this.resourceLocks.get(resource.id) === stepId) {
        this.resourceLocks.delete(resource.id)
      }
    }
  }

  private async checkCompletedExecutions(executingSteps: Set<string>): Promise<TaskExecutionResult[]> {
    const completed: TaskExecutionResult[] = []

    for (const stepId of Array.from(executingSteps)) {
      const promise = this.activeExecutions.get(stepId)
      if (promise) {
        try {
          const result = await Promise.race([
            promise,
            new Promise<null>(resolve => setTimeout(() => resolve(null), 100))
          ])

          if (result) {
            completed.push(result)
            this.activeExecutions.delete(stepId)
          }
        } catch (error) {
          // Execution failed
          const failedResult: TaskExecutionResult = {
            stepId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            actualDuration: 0,
            onTime: false,
            startedAt: new Date(),
            completedAt: new Date(),
          }
          completed.push(failedResult)
          this.activeExecutions.delete(stepId)
        }
      }
    }

    return completed
  }

  private canExecuteStep(step: TaskStep, availableResources: TaskResource[]): boolean {
    for (const skill of step.requiredSkills) {
      const hasResource = availableResources.some(r =>
        r.status === 'available' &&
        r.capabilities.includes(skill) &&
        !this.resourceLocks.has(r.id)
      )

      if (!hasResource) {
        return false
      }
    }

    return true
  }

  private async analyzeFailure(
    step: TaskStep,
    error: Error,
    context: OrchestrationContext
  ): Promise<{
    recommendedAction: 'retry' | 'skip' | 'fail' | 'replan'
    retryCount: number
    isCritical: boolean
    affectsMultipleSteps: boolean
  }> {
    const errorMessage = error.message.toLowerCase()

    // Analyze error type
    if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return {
        recommendedAction: 'retry',
        retryCount: 1,
        isCritical: false,
        affectsMultipleSteps: false,
      }
    }

    if (errorMessage.includes('resource') || errorMessage.includes('insufficient')) {
      return {
        recommendedAction: 'replan',
        retryCount: 0,
        isCritical: true,
        affectsMultipleSteps: true,
      }
    }

    if (errorMessage.includes('permission') || errorMessage.includes('access')) {
      return {
        recommendedAction: 'fail',
        retryCount: 0,
        isCritical: true,
        affectsMultipleSteps: false,
      }
    }

    // Check if step is on critical path
    const isOnCriticalPath = context.taskPlan.schedule.criticalPath.includes(step.id)

    if (isOnCriticalPath && step.priority <= 3) {
      return {
        recommendedAction: 'replan',
        retryCount: 0,
        isCritical: true,
        affectsMultipleSteps: true,
      }
    }

    if (step.priority > 5) {
      return {
        recommendedAction: 'skip',
        retryCount: 0,
        isCritical: false,
        affectsMultipleSteps: false,
      }
    }

    return {
      recommendedAction: 'retry',
      retryCount: 1,
      isCritical: false,
      affectsMultipleSteps: false,
    }
  }
}