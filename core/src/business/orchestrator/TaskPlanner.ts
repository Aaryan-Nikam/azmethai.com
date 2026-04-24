import { SupabaseClient } from '@supabase/supabase-js'
import type {
  TaskPlan, TaskStep, TaskDependency, TaskResource,
  ComplexTaskRequest, TaskExecutionResult
} from './orchestrator-types.js'

export interface PlanningConfig {
  maxParallelSteps: number
  maxTaskDepth: number
  resourceConstraints: Record<string, number>
  qualityThreshold: number
  replanThreshold: number
}

export class TaskPlanner {
  private supabase: SupabaseClient
  private config: PlanningConfig

  constructor(supabase: SupabaseClient, config: PlanningConfig) {
    this.supabase = supabase
    this.config = config
  }

  /**
   * Creates a comprehensive task plan for complex multi-step tasks
   */
  async createTaskPlan(request: ComplexTaskRequest): Promise<TaskPlan> {
    const { description, constraints, resources, deadline } = request

    // Analyze task complexity and break it down
    const taskAnalysis = await this.analyzeTaskComplexity(description)

    // Generate task decomposition
    const steps = await this.decomposeTask(description, taskAnalysis)

    // Identify dependencies between steps
    const dependencies = await this.identifyDependencies(steps)

    // Allocate resources to steps
    const resourceAllocation = await this.allocateResources(steps, resources)

    // Estimate execution time and create schedule
    const schedule = await this.createExecutionSchedule(steps, dependencies, deadline)

    // Identify quality checkpoints
    const qualityGates = await this.identifyQualityGates(steps)

    const plan: TaskPlan = {
      id: this.generateId(),
      description,
      complexity: taskAnalysis.complexity,
      estimatedDuration: schedule.totalDuration,
      steps,
      dependencies,
      resourceAllocation,
      schedule,
      qualityGates,
      constraints,
      status: 'planned',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Store plan in database
    await this.storeTaskPlan(plan)

    return plan
  }

  /**
   * Updates an existing task plan based on execution progress
   */
  async updateTaskPlan(
    planId: string,
    executionResults: TaskExecutionResult[],
    newConstraints?: any
  ): Promise<TaskPlan> {
    const plan = await this.getTaskPlan(planId)
    if (!plan) throw new Error(`Task plan ${planId} not found`)

    // Analyze execution progress
    const progressAnalysis = this.analyzeExecutionProgress(plan, executionResults)

    // Check if replanning is needed
    if (progressAnalysis.needsReplanning) {
      return await this.replanTask(plan, progressAnalysis, newConstraints)
    }

    // Update existing plan with progress
    const updatedPlan = {
      ...plan,
      status: progressAnalysis.overallStatus,
      updatedAt: new Date(),
      executionMetrics: progressAnalysis.metrics,
    }

    await this.updateStoredTaskPlan(updatedPlan)
    return updatedPlan
  }

  /**
   * Optimizes task plan for better efficiency
   */
  async optimizeTaskPlan(planId: string): Promise<TaskPlan> {
    const plan = await this.getTaskPlan(planId)
    if (!plan) throw new Error(`Task plan ${planId} not found`)

    // Analyze bottlenecks
    const bottlenecks = await this.identifyBottlenecks(plan)

    // Optimize resource allocation
    const optimizedResources = await this.optimizeResourceAllocation(plan, bottlenecks)

    // Optimize step ordering
    const optimizedSteps = await this.optimizeStepOrdering(plan)

    // Recalculate schedule
    const optimizedSchedule = await this.createExecutionSchedule(
      optimizedSteps,
      plan.dependencies,
      plan.schedule.deadline
    )

    const optimizedPlan: TaskPlan = {
      ...plan,
      steps: optimizedSteps,
      resourceAllocation: optimizedResources,
      schedule: optimizedSchedule,
      optimizationApplied: true,
      updatedAt: new Date(),
    }

    await this.updateStoredTaskPlan(optimizedPlan)
    return optimizedPlan
  }

  private async analyzeTaskComplexity(description: string): Promise<{
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex'
    subtasks: number
    domains: string[]
    estimatedSteps: number
  }> {
    // Use AI to analyze task complexity
    const analysis = {
      complexity: 'moderate' as const,
      subtasks: 3,
      domains: ['general'],
      estimatedSteps: 5,
    }

    // This would integrate with Claude or another LLM for actual analysis
    // For now, return a basic analysis

    return analysis
  }

  private async decomposeTask(
    description: string,
    analysis: any
  ): Promise<TaskStep[]> {
    const steps: TaskStep[] = []

    // Break down the main task into manageable steps
    // This would use AI to generate proper decomposition

    // Example decomposition for a complex task
    if (description.toLowerCase().includes('research') && description.toLowerCase().includes('report')) {
      steps.push({
        id: this.generateId(),
        description: 'Define research scope and objectives',
        type: 'planning',
        estimatedDuration: 30, // minutes
        requiredSkills: ['analysis', 'planning'],
        inputs: ['task_description'],
        outputs: ['research_scope', 'objectives'],
        priority: 1,
        status: 'pending',
      })

      steps.push({
        id: this.generateId(),
        description: 'Gather information from multiple sources',
        type: 'research',
        estimatedDuration: 120,
        requiredSkills: ['research', 'data_collection'],
        inputs: ['research_scope'],
        outputs: ['raw_data', 'sources'],
        priority: 2,
        status: 'pending',
      })

      steps.push({
        id: this.generateId(),
        description: 'Analyze and synthesize findings',
        type: 'analysis',
        estimatedDuration: 90,
        requiredSkills: ['analysis', 'synthesis'],
        inputs: ['raw_data'],
        outputs: ['analysis_report', 'key_findings'],
        priority: 3,
        status: 'pending',
      })

      steps.push({
        id: this.generateId(),
        description: 'Create comprehensive report',
        type: 'creation',
        estimatedDuration: 60,
        requiredSkills: ['writing', 'documentation'],
        inputs: ['analysis_report', 'key_findings'],
        outputs: ['final_report'],
        priority: 4,
        status: 'pending',
      })

      steps.push({
        id: this.generateId(),
        description: 'Review and validate report quality',
        type: 'review',
        estimatedDuration: 30,
        requiredSkills: ['review', 'quality_assurance'],
        inputs: ['final_report'],
        outputs: ['quality_assessment'],
        priority: 5,
        status: 'pending',
      })
    } else {
      // Generic decomposition for other tasks
      steps.push({
        id: this.generateId(),
        description: 'Break down task into components',
        type: 'planning',
        estimatedDuration: 15,
        requiredSkills: ['planning'],
        inputs: [],
        outputs: ['task_components'],
        priority: 1,
        status: 'pending',
      })

      steps.push({
        id: this.generateId(),
        description: 'Execute task components',
        type: 'execution',
        estimatedDuration: 60,
        requiredSkills: ['execution'],
        inputs: ['task_components'],
        outputs: ['results'],
        priority: 2,
        status: 'pending',
      })

      steps.push({
        id: this.generateId(),
        description: 'Review and finalize results',
        type: 'review',
        estimatedDuration: 20,
        requiredSkills: ['review'],
        inputs: ['results'],
        outputs: ['final_output'],
        priority: 3,
        status: 'pending',
      })
    }

    return steps
  }

  private async identifyDependencies(steps: TaskStep[]): Promise<TaskDependency[]> {
    const dependencies: TaskDependency[] = []

    // Create dependencies based on input/output relationships
    for (const step of steps) {
      for (const input of step.inputs) {
        // Find steps that produce this input
        const producerSteps = steps.filter(s =>
          s.outputs.includes(input) && s.id !== step.id
        )

        for (const producer of producerSteps) {
          dependencies.push({
            id: this.generateId(),
            fromStepId: producer.id,
            toStepId: step.id,
            type: 'finish_to_start',
            lag: 0,
            condition: `${producer.description} must complete before ${step.description}`,
          })
        }
      }
    }

    // Add explicit ordering dependencies based on priority
    const sortedSteps = [...steps].sort((a, b) => a.priority - b.priority)
    for (let i = 0; i < sortedSteps.length - 1; i++) {
      const currentStep = sortedSteps[i]
      const nextStep = sortedSteps[i + 1]

      // Check if there's already a dependency
      const existingDep = dependencies.find(d =>
        d.fromStepId === currentStep.id && d.toStepId === nextStep.id
      )

      if (!existingDep) {
        dependencies.push({
          id: this.generateId(),
          fromStepId: currentStep.id,
          toStepId: nextStep.id,
          type: 'finish_to_start',
          lag: 0,
          condition: `Step ${currentStep.priority} must complete before step ${nextStep.priority}`,
        })
      }
    }

    return dependencies
  }

  private async allocateResources(
    steps: TaskStep[],
    availableResources: TaskResource[]
  ): Promise<Record<string, TaskResource[]>> {
    const allocation: Record<string, TaskResource[]> = {}

    for (const step of steps) {
      const stepResources: TaskResource[] = []

      // Allocate based on required skills
      for (const skill of step.requiredSkills) {
        const suitableResources = availableResources.filter(r =>
          r.capabilities.includes(skill) &&
          r.availableHours >= step.estimatedDuration / 60
        )

        if (suitableResources.length > 0) {
          // Allocate the first available resource
          stepResources.push(suitableResources[0])
        }
      }

      allocation[step.id] = stepResources
    }

    return allocation
  }

  private async createExecutionSchedule(
    steps: TaskStep[],
    dependencies: TaskDependency[],
    deadline?: Date
  ): Promise<{
    startTimes: Record<string, Date>
    endTimes: Record<string, Date>
    totalDuration: number
    criticalPath: string[]
    deadline: Date | null
    isFeasible: boolean
  }> {
    const startTimes: Record<string, Date> = {}
    const endTimes: Record<string, Date> = {}
    const now = new Date()

    // Simple scheduling algorithm (could be enhanced with proper project scheduling)
    let currentTime = now.getTime()

    // Sort steps by priority
    const sortedSteps = [...steps].sort((a, b) => a.priority - b.priority)

    for (const step of sortedSteps) {
      // Check dependencies
      const stepDeps = dependencies.filter(d => d.toStepId === step.id)
      let earliestStart = currentTime

      for (const dep of stepDeps) {
        const depEndTime = endTimes[dep.fromStepId]
        if (depEndTime) {
          earliestStart = Math.max(earliestStart, depEndTime.getTime() + (dep.lag * 60000))
        }
      }

      const startTime = new Date(earliestStart)
      const endTime = new Date(earliestStart + step.estimatedDuration * 60000)

      startTimes[step.id] = startTime
      endTimes[step.id] = endTime

      currentTime = endTime.getTime()
    }

    const totalDuration = (currentTime - now.getTime()) / (1000 * 60) // minutes
    const criticalPath = sortedSteps.map(s => s.id) // Simplified

    const isFeasible = !deadline || currentTime <= deadline.getTime()

    return {
      startTimes,
      endTimes,
      totalDuration,
      criticalPath,
      deadline: deadline || null,
      isFeasible,
    }
  }

  private async identifyQualityGates(steps: TaskStep[]): Promise<Array<{
    stepId: string
    criteria: string[]
    requiredApprovals: string[]
    automatedChecks: string[]
  }>> {
    const qualityGates = []

    for (const step of steps) {
      if (step.type === 'review' || step.type === 'analysis') {
        qualityGates.push({
          stepId: step.id,
          criteria: [
            'Completeness of output',
            'Accuracy of information',
            'Adherence to requirements',
            'Quality of presentation',
          ],
          requiredApprovals: ['manager', 'subject_matter_expert'],
          automatedChecks: ['plagiarism_check', 'consistency_validation'],
        })
      } else if (step.type === 'creation' || step.type === 'execution') {
        qualityGates.push({
          stepId: step.id,
          criteria: [
            'Task completion',
            'Output quality',
            'Meeting requirements',
          ],
          requiredApprovals: ['manager'],
          automatedChecks: ['format_validation', 'requirement_check'],
        })
      }
    }

    return qualityGates
  }

  private analyzeExecutionProgress(
    plan: TaskPlan,
    results: TaskExecutionResult[]
  ): {
    needsReplanning: boolean
    overallStatus: string
    metrics: any
  } {
    const completedSteps = results.filter(r => r.status === 'completed').length
    const failedSteps = results.filter(r => r.status === 'failed').length
    const totalSteps = plan.steps.length

    const completionRate = completedSteps / totalSteps
    const failureRate = failedSteps / totalSteps

    const needsReplanning = failureRate > 0.2 || completionRate < 0.3

    let overallStatus = 'in_progress'
    if (completionRate === 1) overallStatus = 'completed'
    else if (failureRate > 0.5) overallStatus = 'failed'

    return {
      needsReplanning,
      overallStatus,
      metrics: {
        completionRate,
        failureRate,
        averageExecutionTime: results.reduce((sum, r) => sum + r.actualDuration, 0) / results.length,
        onTimeDelivery: results.filter(r => r.onTime).length / results.length,
      },
    }
  }

  private async replanTask(
    plan: TaskPlan,
    progressAnalysis: any,
    newConstraints?: any
  ): Promise<TaskPlan> {
    // Create a new plan based on progress and constraints
    const replannedRequest: ComplexTaskRequest = {
      description: plan.description,
      constraints: { ...plan.constraints, ...newConstraints },
      resources: Object.values(plan.resourceAllocation).flat(),
      deadline: plan.schedule.deadline || undefined,
    }

    const newPlan = await this.createTaskPlan(replannedRequest)
    newPlan.id = plan.id // Keep the same ID
    newPlan.replannedFrom = plan.id

    return newPlan
  }

  private async identifyBottlenecks(plan: TaskPlan): Promise<Array<{
    stepId: string
    bottleneckType: 'resource' | 'dependency' | 'time'
    severity: number
  }>> {
    const bottlenecks = []

    // Analyze resource conflicts
    const resourceUsage = new Map<string, number>()
    for (const [stepId, resources] of Object.entries(plan.resourceAllocation)) {
      for (const resource of resources) {
        const currentUsage = resourceUsage.get(resource.id) || 0
        resourceUsage.set(resource.id, currentUsage + 1)
      }
    }

    // Find over-utilized resources
    for (const [resourceId, usage] of resourceUsage) {
      if (usage > this.config.maxParallelSteps) {
        // Find steps using this resource
        for (const [stepId, resources] of Object.entries(plan.resourceAllocation)) {
          if (resources.some(r => r.id === resourceId)) {
            bottlenecks.push({
              stepId,
              bottleneckType: 'resource',
              severity: (usage - this.config.maxParallelSteps) / this.config.maxParallelSteps,
            })
          }
        }
      }
    }

    return bottlenecks
  }

  private async optimizeResourceAllocation(
    plan: TaskPlan,
    bottlenecks: any[]
  ): Promise<Record<string, TaskResource[]>> {
    // Reallocate resources to reduce bottlenecks
    const optimized = { ...plan.resourceAllocation }

    for (const bottleneck of bottlenecks) {
      if (bottleneck.bottleneckType === 'resource') {
        // Try to find alternative resources for this step
        const step = plan.steps.find(s => s.id === bottleneck.stepId)
        if (step) {
          // This would implement resource reallocation logic
          // For now, just mark as optimized
        }
      }
    }

    return optimized
  }

  private async optimizeStepOrdering(plan: TaskPlan): Promise<TaskStep[]> {
    // Optimize step order to reduce waiting time
    // This is a simplified implementation

    const optimizedSteps = [...plan.steps]

    // Sort by estimated duration (longest first) to maximize parallelism
    optimizedSteps.sort((a, b) => b.estimatedDuration - a.estimatedDuration)

    // Reassign priorities
    optimizedSteps.forEach((step, index) => {
      step.priority = index + 1
    })

    return optimizedSteps
  }

  private async storeTaskPlan(plan: TaskPlan): Promise<void> {
    await this.supabase.from('task_plans').insert({
      id: plan.id,
      description: plan.description,
      complexity: plan.complexity,
      estimated_duration: plan.estimatedDuration,
      steps: plan.steps,
      dependencies: plan.dependencies,
      resource_allocation: plan.resourceAllocation,
      schedule: plan.schedule,
      quality_gates: plan.qualityGates,
      constraints: plan.constraints,
      status: plan.status,
      created_at: plan.createdAt,
      updated_at: plan.updatedAt,
    })
  }

  private async updateStoredTaskPlan(plan: TaskPlan): Promise<void> {
    await this.supabase
      .from('task_plans')
      .update({
        status: plan.status,
        steps: plan.steps,
        resource_allocation: plan.resourceAllocation,
        schedule: plan.schedule,
        updated_at: plan.updatedAt,
      })
      .eq('id', plan.id)
  }

  private async getTaskPlan(planId: string): Promise<TaskPlan | null> {
    const { data, error } = await this.supabase
      .from('task_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      description: data.description,
      complexity: data.complexity,
      estimatedDuration: data.estimated_duration,
      steps: data.steps,
      dependencies: data.dependencies,
      resourceAllocation: data.resource_allocation,
      schedule: data.schedule,
      qualityGates: data.quality_gates,
      constraints: data.constraints,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}