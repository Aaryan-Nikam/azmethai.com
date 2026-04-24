import type {
  TaskResource,
  TaskStep,
  ResourceAllocation,
  ResourceUsage,
  ResourceConstraint,
  OrchestrationContext,
  TaskExecutionResult
} from './orchestrator-types.js'

export interface ResourceManagerConfig {
  maxResourceUtilization: number
  resourceReservationTimeout: number
  optimizationInterval: number
  predictiveAllocationEnabled: boolean
  loadBalancingEnabled: boolean
}

export interface ResourceMetrics {
  utilization: number
  availability: number
  contention: number
  efficiency: number
  cost: number
}

export class ResourceManager {
  private config: ResourceManagerConfig
  private resources: Map<string, TaskResource> = new Map()
  private allocations: Map<string, ResourceAllocation> = new Map() // stepId -> allocation
  private usageHistory: Map<string, ResourceUsage[]> = new Map() // resourceId -> usage history
  private resourceConstraints: Map<string, ResourceConstraint[]> = new Map()
  private optimizationTimer?: NodeJS.Timeout

  constructor(config: ResourceManagerConfig) {
    this.config = config
    this.startOptimizationLoop()
  }

  /**
   * Registers a new resource with the manager
   */
  registerResource(resource: TaskResource): void {
    this.resources.set(resource.id, resource)
    this.usageHistory.set(resource.id, [])
    this.resourceConstraints.set(resource.id, [])
  }

  /**
   * Allocates resources for a task step
   */
  async allocateResources(
    step: TaskStep,
    context: OrchestrationContext
  ): Promise<ResourceAllocation> {
    const requiredSkills = step.requiredSkills
    const allocatedResources: TaskResource[] = []
    const allocationId = `alloc_${step.id}_${Date.now()}`

    // Find available resources that match required skills
    for (const skill of requiredSkills) {
      const suitableResources = this.findSuitableResources(skill, step.estimatedDuration)

      if (suitableResources.length === 0) {
        throw new Error(`No available resources for skill: ${skill}`)
      }

      // Select best resource based on current load and constraints
      const selectedResource = this.selectOptimalResource(suitableResources, step, context)

      if (selectedResource) {
        allocatedResources.push(selectedResource)
        await this.reserveResource(selectedResource.id, step.id, step.estimatedDuration)
      } else {
        throw new Error(`Could not allocate resource for skill: ${skill}`)
      }
    }

    const allocation: ResourceAllocation = {
      id: allocationId,
      stepId: step.id,
      resources: allocatedResources,
      allocatedAt: new Date(),
      expiresAt: new Date(Date.now() + step.estimatedDuration),
      status: 'active',
    }

    this.allocations.set(step.id, allocation)
    return allocation
  }

  /**
   * Releases resources allocated to a step
   */
  async releaseResources(stepId: string): Promise<void> {
    const allocation = this.allocations.get(stepId)
    if (!allocation) return

    for (const resource of allocation.resources) {
      await this.releaseResource(resource.id, stepId)
    }

    allocation.status = 'released'
    this.allocations.delete(stepId)
  }

  /**
   * Updates resource usage metrics
   */
  updateResourceUsage(resourceId: string, usage: ResourceUsage): void {
    const history = this.usageHistory.get(resourceId) || []
    history.push(usage)

    // Keep only recent history (last 100 entries)
    if (history.length > 100) {
      history.shift()
    }

    this.usageHistory.set(resourceId, history)

    // Update resource status based on usage
    const resource = this.resources.get(resourceId)
    if (resource) {
      resource.status = usage.utilization > this.config.maxResourceUtilization ? 'busy' : 'available'
    }
  }

  /**
   * Gets current resource metrics
   */
  getResourceMetrics(resourceId: string): ResourceMetrics {
    const resource = this.resources.get(resourceId)
    const history = this.usageHistory.get(resourceId) || []

    if (!resource || history.length === 0) {
      return {
        utilization: 0,
        availability: 1,
        contention: 0,
        efficiency: 1,
        cost: 0,
      }
    }

    const recentUsage = history.slice(-10) // Last 10 measurements
    const avgUtilization = recentUsage.reduce((sum, u) => sum + u.utilization, 0) / recentUsage.length
    const avgContention = recentUsage.reduce((sum, u) => sum + u.contention, 0) / recentUsage.length
    const avgEfficiency = recentUsage.reduce((sum, u) => sum + u.efficiency, 0) / recentUsage.length

    return {
      utilization: avgUtilization,
      availability: resource.status === 'available' ? 1 : 0,
      contention: avgContention,
      efficiency: avgEfficiency,
      cost: resource.costPerHour || 0,
    }
  }

  /**
   * Adds a constraint to a resource
   */
  addResourceConstraint(resourceId: string, constraint: ResourceConstraint): void {
    const constraints = this.resourceConstraints.get(resourceId) || []
    constraints.push(constraint)
    this.resourceConstraints.set(resourceId, constraints)
  }

  /**
   * Removes a constraint from a resource
   */
  removeResourceConstraint(resourceId: string, constraintId: string): void {
    const constraints = this.resourceConstraints.get(resourceId) || []
    const filtered = constraints.filter(c => c.id !== constraintId)
    this.resourceConstraints.set(resourceId, filtered)
  }

  /**
   * Predicts resource availability for future time slots
   */
  predictResourceAvailability(
    resourceId: string,
    timeHorizon: number
  ): Array<{ timestamp: Date; availability: number }> {
    const resource = this.resources.get(resourceId)
    const history = this.usageHistory.get(resourceId) || []

    if (!resource || history.length < 10) {
      // Not enough data for prediction
      return []
    }

    const predictions: Array<{ timestamp: Date; availability: number }> = []
    const now = Date.now()

    // Simple linear regression based on recent trends
    const recentData = history.slice(-20)
    const trend = this.calculateUtilizationTrend(recentData)

    for (let i = 1; i <= timeHorizon; i += 5) { // Predict every 5 minutes
      const futureTime = now + (i * 60 * 1000)
      const predictedUtilization = Math.max(0, Math.min(1,
        recentData[recentData.length - 1].utilization + (trend * i)
      ))

      predictions.push({
        timestamp: new Date(futureTime),
        availability: 1 - predictedUtilization,
      })
    }

    return predictions
  }

  /**
   * Optimizes resource allocation across multiple steps
   */
  async optimizeAllocations(
    steps: TaskStep[],
    context: OrchestrationContext
  ): Promise<Map<string, ResourceAllocation>> {
    const optimizedAllocations = new Map<string, ResourceAllocation>()

    // Group steps by required skills
    const skillGroups = this.groupStepsBySkills(steps)

    for (const [skill, skillSteps] of skillGroups) {
      const skillResources = this.findSuitableResources(skill, 0)

      if (skillResources.length === 0) continue

      // Use bin packing algorithm for optimal resource assignment
      const assignments = this.optimizeSkillAllocation(skillSteps, skillResources, context)

      for (const assignment of assignments) {
        const allocation = await this.allocateResources(assignment.step, context)
        optimizedAllocations.set(assignment.step.id, allocation)
      }
    }

    return optimizedAllocations
  }

  /**
   * Balances load across resources
   */
  async balanceLoad(): Promise<void> {
    const resourceMetrics = Array.from(this.resources.keys()).map(id => ({
      id,
      metrics: this.getResourceMetrics(id),
    }))

    // Find overloaded resources
    const overloaded = resourceMetrics.filter(r => r.metrics.utilization > this.config.maxResourceUtilization)

    // Find underutilized resources
    const underutilized = resourceMetrics.filter(r => r.metrics.utilization < 0.3)

    if (overloaded.length === 0 || underutilized.length === 0) return

    // Attempt to migrate allocations from overloaded to underutilized resources
    for (const overloadedResource of overloaded) {
      const allocations = Array.from(this.allocations.values())
        .filter(a => a.resources.some(r => r.id === overloadedResource.id))

      for (const allocation of allocations) {
        const step = allocation.stepId // We'd need to get the step from context

        // Check if we can migrate this allocation
        const canMigrate = await this.attemptAllocationMigration(allocation, underutilized)

        if (canMigrate) {
          console.log(`Migrated allocation ${allocation.id} from overloaded resource`)
        }
      }
    }
  }

  /**
   * Gets resource utilization report
   */
  getUtilizationReport(): {
    overall: ResourceMetrics
    byResource: Record<string, ResourceMetrics>
    recommendations: string[]
  } {
    const allMetrics = Array.from(this.resources.keys()).map(id => this.getResourceMetrics(id))

    const overall: ResourceMetrics = {
      utilization: allMetrics.reduce((sum, m) => sum + m.utilization, 0) / allMetrics.length,
      availability: allMetrics.reduce((sum, m) => sum + m.availability, 0) / allMetrics.length,
      contention: allMetrics.reduce((sum, m) => sum + m.contention, 0) / allMetrics.length,
      efficiency: allMetrics.reduce((sum, m) => sum + m.efficiency, 0) / allMetrics.length,
      cost: allMetrics.reduce((sum, m) => sum + m.cost, 0),
    }

    const byResource: Record<string, ResourceMetrics> = {}
    for (const resource of this.resources.values()) {
      byResource[resource.id] = this.getResourceMetrics(resource.id)
    }

    const recommendations = this.generateRecommendations(overall, byResource)

    return { overall, byResource, recommendations }
  }

  private findSuitableResources(skill: string, duration: number): TaskResource[] {
    return Array.from(this.resources.values()).filter(resource => {
      // Check if resource has the required skill
      if (!resource.capabilities.includes(skill)) return false

      // Check if resource is available
      if (resource.status !== 'available') return false

      // Check constraints
      const constraints = this.resourceConstraints.get(resource.id) || []
      for (const constraint of constraints) {
        if (!this.checkConstraint(constraint, duration)) return false
      }

      return true
    })
  }

  private selectOptimalResource(
    candidates: TaskResource[],
    step: TaskStep,
    context: OrchestrationContext
  ): TaskResource | null {
    if (candidates.length === 0) return null

    // Score each candidate based on multiple factors
    const scoredCandidates = candidates.map(resource => {
      const metrics = this.getResourceMetrics(resource.id)
      const score = this.calculateResourceScore(resource, metrics, step, context)
      return { resource, score }
    })

    // Return the highest scoring resource
    scoredCandidates.sort((a, b) => b.score - a.score)
    return scoredCandidates[0].resource
  }

  private calculateResourceScore(
    resource: TaskResource,
    metrics: ResourceMetrics,
    step: TaskStep,
    context: OrchestrationContext
  ): number {
    let score = 0

    // Prefer lower utilization (better availability)
    score += (1 - metrics.utilization) * 30

    // Prefer higher efficiency
    score += metrics.efficiency * 20

    // Prefer lower cost
    if (resource.costPerHour) {
      score += (1 / resource.costPerHour) * 10
    }

    // Prefer resources that match step priority
    if (step.priority <= 3 && resource.type === 'premium') {
      score += 20
    }

    // Consider historical performance for this type of step
    const historicalPerformance = this.getHistoricalPerformance(resource.id, step.type)
    score += historicalPerformance * 20

    return score
  }

  private async reserveResource(
    resourceId: string,
    stepId: string,
    duration: number
  ): Promise<void> {
    const resource = this.resources.get(resourceId)
    if (!resource) return

    resource.status = 'reserved'

    // Set a timeout to release the reservation if not used
    setTimeout(() => {
      if (resource.status === 'reserved') {
        resource.status = 'available'
      }
    }, this.config.resourceReservationTimeout)
  }

  private async releaseResource(resourceId: string, stepId: string): Promise<void> {
    const resource = this.resources.get(resourceId)
    if (!resource) return

    resource.status = 'available'
  }

  private checkConstraint(constraint: ResourceConstraint, duration: number): boolean {
    switch (constraint.type) {
      case 'max_duration':
        return duration <= (constraint.value as number)

      case 'time_window':
        const now = new Date()
        const start = new Date(constraint.value.start)
        const end = new Date(constraint.value.end)
        return now >= start && now <= end

      case 'max_concurrent':
        const currentAllocations = Array.from(this.allocations.values())
          .filter(a => a.resources.some(r => r.id === constraint.resourceId))
        return currentAllocations.length < (constraint.value as number)

      default:
        return true
    }
  }

  private calculateUtilizationTrend(history: ResourceUsage[]): number {
    if (history.length < 2) return 0

    const recent = history.slice(-10)
    const changes = []

    for (let i = 1; i < recent.length; i++) {
      changes.push(recent[i].utilization - recent[i - 1].utilization)
    }

    return changes.reduce((sum, change) => sum + change, 0) / changes.length
  }

  private groupStepsBySkills(steps: TaskStep[]): Map<string, TaskStep[]> {
    const groups = new Map<string, TaskStep[]>()

    for (const step of steps) {
      for (const skill of step.requiredSkills) {
        if (!groups.has(skill)) {
          groups.set(skill, [])
        }
        groups.get(skill)!.push(step)
      }
    }

    return groups
  }

  private optimizeSkillAllocation(
    steps: TaskStep[],
    resources: TaskResource[],
    context: OrchestrationContext
  ): Array<{ step: TaskStep; resource: TaskResource }> {
    // Use first-fit bin packing algorithm
    const assignments: Array<{ step: TaskStep; resource: TaskResource }> = []
    const usedResources = new Set<string>()

    for (const step of steps) {
      let assigned = false

      for (const resource of resources) {
        if (usedResources.has(resource.id)) continue

        if (this.canAssignStepToResource(step, resource)) {
          assignments.push({ step, resource })
          usedResources.add(resource.id)
          assigned = true
          break
        }
      }

      if (!assigned) {
        // Fallback: assign to least utilized resource
        const availableResource = resources.find(r => !usedResources.has(r.id))
        if (availableResource) {
          assignments.push({ step, resource: availableResource })
          usedResources.add(availableResource.id)
        }
      }
    }

    return assignments
  }

  private canAssignStepToResource(step: TaskStep, resource: TaskResource): boolean {
    return step.requiredSkills.some(skill => resource.capabilities.includes(skill))
  }

  private async attemptAllocationMigration(
    allocation: ResourceAllocation,
    targetResources: Array<{ id: string; metrics: ResourceMetrics }>
  ): Promise<boolean> {
    // This would implement migration logic
    // For now, return false as migration is complex and would require
    // stopping the current execution and restarting on new resource
    return false
  }

  private getHistoricalPerformance(resourceId: string, stepType: string): number {
    // This would analyze historical execution results for similar steps
    // For now, return a neutral score
    return 0.5
  }

  private generateRecommendations(
    overall: ResourceMetrics,
    byResource: Record<string, ResourceMetrics>
  ): string[] {
    const recommendations: string[] = []

    if (overall.utilization > this.config.maxResourceUtilization) {
      recommendations.push('Overall resource utilization is high. Consider adding more resources or optimizing task scheduling.')
    }

    if (overall.efficiency < 0.7) {
      recommendations.push('Resource efficiency is low. Review resource allocation strategies and task requirements.')
    }

    const highContention = Object.entries(byResource)
      .filter(([, metrics]) => metrics.contention > 0.8)
      .map(([id]) => id)

    if (highContention.length > 0) {
      recommendations.push(`High contention detected for resources: ${highContention.join(', ')}. Consider load balancing or adding capacity.`)
    }

    return recommendations
  }

  private startOptimizationLoop(): void {
    if (this.config.optimizationInterval > 0) {
      this.optimizationTimer = setInterval(async () => {
        try {
          if (this.config.loadBalancingEnabled) {
            await this.balanceLoad()
          }
        } catch (error) {
          console.error('Resource optimization error:', error)
        }
      }, this.config.optimizationInterval)
    }
  }

  destroy(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer)
    }
  }
}