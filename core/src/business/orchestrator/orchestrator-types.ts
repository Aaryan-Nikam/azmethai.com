export interface ComplexTaskRequest {
  description: string
  constraints?: {
    maxDuration?: number
    budget?: number
    quality?: 'low' | 'medium' | 'high' | 'critical'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }
  resources?: TaskResource[]
  deadline?: Date
  context?: Record<string, any>
}

export interface TaskPlan {
  id: string
  description: string
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex'
  estimatedDuration: number // in minutes
  steps: TaskStep[]
  dependencies: TaskDependency[]
  resourceAllocation: Record<string, TaskResource[]>
  schedule: TaskSchedule
  qualityGates: QualityGate[]
  constraints?: any
  status: 'planned' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  replannedFrom?: string
  optimizationApplied?: boolean
  executionMetrics?: TaskExecutionMetrics
}

export interface TaskStep {
  id: string
  description: string
  type: 'planning' | 'research' | 'analysis' | 'creation' | 'execution' | 'review' | 'validation'
  estimatedDuration: number // in minutes
  requiredSkills: string[]
  inputs: string[]
  outputs: string[]
  priority: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked'
  assignedResources?: string[]
  startedAt?: Date
  completedAt?: Date
  actualDuration?: number
  result?: any
  error?: string
  retryPolicy?: RetryPolicy
  timeout?: number
  dependencies?: string[]
  metadata?: Record<string, any>
}

export interface TaskDependency {
  id: string
  fromStepId: string
  toStepId: string
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'
  lag: number // in minutes
  condition?: string
}

export interface TaskResource {
  id: string
  name: string
  type: 'human' | 'ai_agent' | 'tool' | 'compute'
  capabilities: string[]
  availableHours: number
  costPerHour?: number
  location?: string
  status: 'available' | 'busy' | 'offline'
}

export interface TaskSchedule {
  startTimes: Record<string, Date>
  endTimes: Record<string, Date>
  totalDuration: number
  criticalPath: string[]
  deadline: Date | null
  isFeasible: boolean
  parallelGroups: string[][]
}

export interface QualityGate {
  stepId: string
  criteria: string[]
  requiredApprovals: string[]
  automatedChecks: string[]
  status?: 'pending' | 'passed' | 'failed'
  checkedAt?: Date
  checkedBy?: string
}

export interface TaskExecutionResult {
  stepId: string
  status: 'completed' | 'failed' | 'cancelled'
  result?: any
  error?: string
  actualDuration: number
  onTime: boolean
  qualityScore?: number
  startedAt: Date
  completedAt: Date
}

export interface TaskExecutionMetrics {
  totalDuration: number
  onTimeDelivery: number // percentage
  qualityScore: number // average
  resourceUtilization: number // percentage
  costEfficiency: number
  bottleneckCount: number
}

export interface ParallelExecutionGroup {
  id: string
  steps: TaskStep[]
  canExecuteInParallel: boolean
  estimatedDuration: number
  resourceRequirements: Record<string, number>
}

export interface OrchestrationContext {
  taskPlan: TaskPlan
  activeSteps: TaskStep[]
  completedSteps: TaskExecutionResult[]
  availableResources: TaskResource[]
  currentTime: Date
  priorityQueue: TaskStep[]
  blockedSteps: Array<{ step: TaskStep; reason: string }>
  qualityIssues: Array<{ stepId: string; issue: string; severity: 'low' | 'medium' | 'high' }>
}

export interface OrchestrationStrategy {
  name: string
  description: string
  isApplicable: (context: OrchestrationContext) => boolean
  execute: (context: OrchestrationContext) => Promise<OrchestrationAction[]>
}

export interface OrchestrationAction {
  type: 'start_step' | 'complete_step' | 'reallocate_resource' | 'replan_task' | 'quality_check' | 'pause_execution'
  stepId?: string
  resourceId?: string
  reason: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  metadata?: Record<string, any>
}

export interface ResourceManager {
  allocateResource: (step: TaskStep, availableResources: TaskResource[]) => Promise<TaskResource | null>
  deallocateResource: (resourceId: string) => Promise<void>
  checkAvailability: (resourceId: string, duration: number) => Promise<boolean>
  optimizeAllocation: (steps: TaskStep[], resources: TaskResource[]) => Promise<Record<string, TaskResource[]>>
}

export interface QualityMonitor {
  checkQuality: (step: TaskStep, result: any) => Promise<{
    score: number
    issues: string[]
    recommendations: string[]
  }>
  validateGate: (gate: QualityGate, result: any) => Promise<{
    passed: boolean
    feedback: string[]
  }>
  generateReport: (plan: TaskPlan, results: TaskExecutionResult[]) => Promise<string>
}

export interface ExecutionEngine {
  executeStep: (step: TaskStep, resources: TaskResource[]) => Promise<TaskExecutionResult>
  monitorExecution: (stepId: string) => Promise<TaskExecutionResult | null>
  cancelExecution: (stepId: string) => Promise<void>
  handleFailure: (step: TaskStep, error: Error) => Promise<'retry' | 'skip' | 'fail' | 'replan'>
}

// Advanced orchestration types for enterprise-grade multi-task execution

export interface RetryPolicy {
  maxRetries: number
  backoffMultiplier: number
  initialDelay: number
  maxDelay: number
}

export interface ResourceAllocation {
  id: string
  stepId: string
  resources: TaskResource[]
  allocatedAt: Date
  expiresAt: Date
  status: 'active' | 'released' | 'expired'
}

export interface ResourceUsage {
  resourceId: string
  utilization: number // 0-1
  contention: number // 0-1, higher means more contention
  efficiency: number // 0-1, how efficiently the resource is used
  timestamp: Date
}

export interface ResourceConstraint {
  id: string
  resourceId: string
  type: 'max_duration' | 'time_window' | 'max_concurrent' | 'dependency'
  value: any
  description: string
}

export interface TaskConstraint {
  id: string
  type: 'deadline' | 'resource_limit' | 'dependency' | 'quality'
  value: any
  description: string
}

export interface TaskMilestone {
  id: string
  name: string
  stepId: string
  dueDate: Date
  completed: boolean
}

export interface QualityMetrics {
  accuracy: number // 0-1
  completeness: number // 0-1
  efficiency: number // 0-1
  timeliness: number // 0-1
  reliability: number // 0-1
  resourceUtilization: number // 0-1
}

export interface QualityThreshold {
  stepType: string
  minAccuracy: number
  minCompleteness: number
  minEfficiency: number
  minReliability: number
  maxResourceUtilization: number
}

export interface QualityFeedback {
  stepId: string
  predictedQuality: number
  riskLevel: 'low' | 'medium' | 'high'
  suggestions: string[]
  timestamp: Date
}

export interface OrchestratorConfig {
  maxConcurrentExecutions: number
  defaultTimeout: number
  qualityMonitoringEnabled: boolean
  resourceOptimizationEnabled: boolean
  adaptiveSchedulingEnabled: boolean
}

export interface OrchestratorMetrics {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageExecutionTime: number
  resourceUtilization: number
  qualityScore: number
  throughput: number // tasks per hour
}

export interface TaskDecompositionRule {
  id: string
  condition: (task: any) => boolean
  decompose: (task: any) => TaskStep[]
  priority: number
}

export interface DependencyGraph {
  nodes: Map<string, TaskStep>
  edges: Map<string, TaskDependency[]>
  rootNodes: string[]
  leafNodes: string[]
}

export interface GraphTraversalResult {
  path: string[]
  cost: number
  constraints: string[]
  metadata: Record<string, any>
}

export interface BottleneckAnalysis {
  stepId: string
  bottleneckType: 'resource' | 'dependency' | 'quality' | 'timing'
  severity: number // 0-1
  impact: number // estimated delay in milliseconds
  recommendations: string[]
}

export interface ExecutionOptimization {
  type: 'parallelization' | 'resource_reallocation' | 'scheduling' | 'quality_improvement'
  description: string
  expectedBenefit: number // estimated improvement in execution time or quality
  implementation: () => Promise<void>
  risk: number // 0-1, risk of negative impact
}

// Type guards and utility types
export type TaskStatus = TaskExecutionResult['status']
export type ResourceStatus = TaskResource['status']
export type AllocationStatus = ResourceAllocation['status']
export type DependencyType = TaskDependency['type']
export type ConstraintType = TaskConstraint['type']

export interface TaskExecutionContext {
  step: TaskStep
  resources: TaskResource[]
  variables: Record<string, any>
  previousResults: Map<string, TaskExecutionResult>
  orchestrationContext: OrchestrationContext
}

export interface OrchestratorEvent {
  type: 'task_started' | 'task_completed' | 'task_failed' | 'resource_allocated' | 'resource_released' | 'quality_issue'
  timestamp: Date
  data: any
  metadata: Record<string, any>
}

export interface OrchestratorHook {
  name: string
  condition: (event: OrchestratorEvent) => boolean
  action: (event: OrchestratorEvent) => Promise<void>
}

// Configuration interfaces
export interface ParallelExecutorConfig {
  maxConcurrentSteps: number
  maxRetries: number
  retryDelay: number
  timeout: number
  resourceLockTimeout: number
}

export interface ResourceManagerConfig {
  maxResourceUtilization: number
  resourceReservationTimeout: number
  optimizationInterval: number
  predictiveAllocationEnabled: boolean
  loadBalancingEnabled: boolean
}

export interface QualityMonitorConfig {
  qualityThresholds: QualityThreshold[]
  feedbackInterval: number
  adaptiveThresholds: boolean
  qualityHistorySize: number
  anomalyDetectionEnabled: boolean
}

// Error types
export class OrchestratorError extends Error {
  constructor(
    message: string,
    public code: string,
    public stepId?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'OrchestratorError'
  }
}

export class ResourceAllocationError extends OrchestratorError {
  constructor(message: string, stepId?: string, details?: any) {
    super(message, 'RESOURCE_ALLOCATION_ERROR', stepId, details)
  }
}

export class DependencyResolutionError extends OrchestratorError {
  constructor(message: string, stepId?: string, details?: any) {
    super(message, 'DEPENDENCY_RESOLUTION_ERROR', stepId, details)
  }
}

export class QualityThresholdError extends OrchestratorError {
  constructor(message: string, stepId?: string, details?: any) {
    super(message, 'QUALITY_THRESHOLD_ERROR', stepId, details)
  }
}

// Utility functions for type checking
export function isTaskCompleted(result: TaskExecutionResult): boolean {
  return result.status === 'completed'
}

export function isTaskFailed(result: TaskExecutionResult): boolean {
  return result.status === 'failed'
}

export function isResourceAvailable(resource: TaskResource): boolean {
  return resource.status === 'available'
}

export function isAllocationActive(allocation: ResourceAllocation): boolean {
  return allocation.status === 'active' && allocation.expiresAt > new Date()
}

export function calculateStepPriority(step: TaskStep, context: OrchestrationContext): number {
  // Base priority from step definition
  let priority = step.priority

  // Adjust based on dependencies
  const dependentSteps = context.taskPlan.steps.filter(s =>
    s.dependencies.includes(step.id)
  )
  if (dependentSteps.length > 0) {
    priority -= 0.5 // Boost priority if others depend on this step
  }

  // Adjust based on critical path
  if (context.taskPlan.schedule.criticalPath.includes(step.id)) {
    priority -= 1 // Highest priority for critical path steps
  }

  return Math.max(1, Math.min(10, priority))
}