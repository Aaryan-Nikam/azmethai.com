import type { TaskStep, TaskDependency, ParallelExecutionGroup } from './orchestrator-types.js'

export class DependencyGraph {
  private nodes: Map<string, TaskStep> = new Map()
  private edges: Map<string, TaskDependency> = new Map()
  private adjacencyList: Map<string, string[]> = new Map()
  private reverseAdjacencyList: Map<string, string[]> = new Map()

  /**
   * Builds the dependency graph from steps and dependencies
   */
  buildGraph(steps: TaskStep[], dependencies: TaskDependency[]): void {
    // Clear existing graph
    this.clear()

    // Add all nodes
    for (const step of steps) {
      this.nodes.set(step.id, step)
      this.adjacencyList.set(step.id, [])
      this.reverseAdjacencyList.set(step.id, [])
    }

    // Add all edges
    for (const dependency of dependencies) {
      this.edges.set(dependency.id, dependency)

      // Add to adjacency list (outgoing edges)
      if (!this.adjacencyList.has(dependency.fromStepId)) {
        this.adjacencyList.set(dependency.fromStepId, [])
      }
      this.adjacencyList.get(dependency.fromStepId)!.push(dependency.toStepId)

      // Add to reverse adjacency list (incoming edges)
      if (!this.reverseAdjacencyList.has(dependency.toStepId)) {
        this.reverseAdjacencyList.set(dependency.toStepId, [])
      }
      this.reverseAdjacencyList.get(dependency.toStepId)!.push(dependency.fromStepId)
    }
  }

  /**
   * Gets all steps that can be executed in parallel at the current state
   */
  getParallelExecutableSteps(completedStepIds: Set<string>): TaskStep[] {
    const executableSteps: TaskStep[] = []

    for (const [stepId, step] of Array.from(this.nodes)) {
      if (completedStepIds.has(stepId)) continue
      if (this.canExecuteStep(stepId, completedStepIds)) {
        executableSteps.push(step)
      }
    }

    return executableSteps
  }

  /**
   * Identifies groups of steps that can execute in parallel
   */
  getParallelGroups(): ParallelExecutionGroup[] {
    const groups: ParallelExecutionGroup[] = []
    const visited = new Set<string>()
    const completed = new Set<string>()

    while (visited.size < this.nodes.size) {
      const executable = this.getParallelExecutableSteps(completed)

      if (executable.length === 0) {
        // Check for circular dependencies or blocked steps
        const unvisitedSteps = Array.from(this.nodes.keys()).filter(id => !visited.has(id))
        if (unvisitedSteps.length > 0) {
          // These steps might be blocked by circular dependencies
          break
        }
      }

      if (executable.length > 0) {
        const group: ParallelExecutionGroup = {
          id: `group_${groups.length + 1}`,
          steps: executable,
          canExecuteInParallel: true,
          estimatedDuration: Math.max(...executable.map(s => s.estimatedDuration)),
          resourceRequirements: this.calculateResourceRequirements(executable),
        }

        groups.push(group)

        // Mark these steps as completed for next iteration
        executable.forEach(step => {
          completed.add(step.id)
          visited.add(step.id)
        })
      }
    }

    return groups
  }

  /**
   * Finds the critical path (longest path) through the dependency graph
   */
  getCriticalPath(): { path: TaskStep[]; totalDuration: number } {
    const distances = new Map<string, number>()
    const previous = new Map<string, string>()

    // Initialize distances
    for (const stepId of Array.from(this.nodes.keys())) {
      distances.set(stepId, 0)
    }

    // Topological sort and longest path calculation
    const sortedSteps = this.topologicalSort()
    if (!sortedSteps) {
      throw new Error('Circular dependency detected in task graph')
    }

    for (const step of sortedSteps) {
      const incomingDeps = this.reverseAdjacencyList.get(step.id) || []

      for (const depStepId of incomingDeps) {
        const depStep = this.nodes.get(depStepId)
        if (depStep) {
          const currentDistance = distances.get(step.id) || 0
          const newDistance = (distances.get(depStepId) || 0) + depStep.estimatedDuration

          if (newDistance > currentDistance) {
            distances.set(step.id, newDistance)
            previous.set(step.id, depStepId)
          }
        }
      }
    }

    // Find the step with maximum distance (end of critical path)
    let maxDistance = 0
    let endStepId = ''
    for (const [stepId, distance] of Array.from(distances)) {
      if (distance > maxDistance) {
        maxDistance = distance
        endStepId = stepId
      }
    }

    // Reconstruct the critical path
    const path: TaskStep[] = []
    let currentId = endStepId

    while (currentId) {
      const step = this.nodes.get(currentId)
      if (step) {
        path.unshift(step)
      }
      currentId = previous.get(currentId) || ''
    }

    return { path, totalDuration: maxDistance }
  }

  /**
   * Detects circular dependencies in the graph
   */
  detectCircularDependencies(): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const dfs = (nodeId: string, path: string[]): boolean => {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)

      const neighbors = this.adjacencyList.get(nodeId) || []

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, [...path])) {
            return true
          }
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor)
          cycles.push(path.slice(cycleStart))
          return true
        }
      }

      recursionStack.delete(nodeId)
      return false
    }

    for (const nodeId of Array.from(this.nodes.keys())) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, [])
      }
    }

    return cycles
  }

  /**
   * Gets all prerequisite steps for a given step
   */
  getPrerequisites(stepId: string): TaskStep[] {
    const prerequisites: TaskStep[] = []
    const visited = new Set<string>()

    const dfs = (currentId: string) => {
      if (visited.has(currentId)) return
      visited.add(currentId)

      const incoming = this.reverseAdjacencyList.get(currentId) || []
      for (const prereqId of incoming) {
        const prereqStep = this.nodes.get(prereqId)
        if (prereqStep) {
          prerequisites.push(prereqStep)
          dfs(prereqId)
        }
      }
    }

    dfs(stepId)
    return prerequisites
  }

  /**
   * Gets all dependent steps for a given step
   */
  getDependents(stepId: string): TaskStep[] {
    const dependents: TaskStep[] = []
    const visited = new Set<string>()

    const dfs = (currentId: string) => {
      if (visited.has(currentId)) return
      visited.add(currentId)

      const outgoing = this.adjacencyList.get(currentId) || []
      for (const depId of outgoing) {
        const depStep = this.nodes.get(depId)
        if (depStep) {
          dependents.push(depStep)
          dfs(depId)
        }
      }
    }

    dfs(stepId)
    return dependents
  }

  /**
   * Calculates the earliest start time for each step
   */
  calculateEarliestStartTimes(): Map<string, number> {
    const earliestStart = new Map<string, number>()
    const sortedSteps = this.topologicalSort()

    if (!sortedSteps) return earliestStart

    // Initialize all steps with 0
    for (const step of sortedSteps) {
      earliestStart.set(step.id, 0)
    }

    // Calculate earliest start times
    for (const step of sortedSteps) {
      const incomingDeps = this.reverseAdjacencyList.get(step.id) || []
      let maxPrerequisiteEnd = 0

      for (const depStepId of incomingDeps) {
        const depStep = this.nodes.get(depStepId)
        const depStart = earliestStart.get(depStepId) || 0
        if (depStep) {
          maxPrerequisiteEnd = Math.max(maxPrerequisiteEnd, depStart + depStep.estimatedDuration)
        }
      }

      earliestStart.set(step.id, maxPrerequisiteEnd)
    }

    return earliestStart
  }

  /**
   * Calculates the latest start time for each step
   */
  calculateLatestStartTimes(projectDeadline: number): Map<string, number> {
    const latestStart = new Map<string, number>()
    const sortedSteps = this.topologicalSort()

    if (!sortedSteps) return latestStart

    // Initialize with project deadline
    for (const step of sortedSteps) {
      latestStart.set(step.id, projectDeadline - step.estimatedDuration)
    }

    // Calculate latest start times in reverse topological order
    const reversedSteps = [...sortedSteps].reverse()

    for (const step of reversedSteps) {
      const outgoingDeps = this.adjacencyList.get(step.id) || []
      let minDependentStart = projectDeadline

      for (const depStepId of outgoingDeps) {
        const depStart = latestStart.get(depStepId) || projectDeadline
        minDependentStart = Math.min(minDependentStart, depStart)
      }

      latestStart.set(step.id, minDependentStart - step.estimatedDuration)
    }

    return latestStart
  }

  /**
   * Identifies bottleneck steps (steps with high resource contention)
   */
  identifyBottlenecks(): Array<{ stepId: string; bottleneckType: string; severity: number }> {
    const bottlenecks: Array<{ stepId: string; bottleneckType: string; severity: number }> = []

    // Check for steps with many dependencies (fan-in bottlenecks)
    for (const [stepId, incoming] of Array.from(this.reverseAdjacencyList)) {
      if (incoming.length > 3) {
        bottlenecks.push({
          stepId,
          bottleneckType: 'high_dependency_fan_in',
          severity: incoming.length / 5, // Normalize severity
        })
      }
    }

    // Check for steps with many dependents (fan-out bottlenecks)
    for (const [stepId, outgoing] of Array.from(this.adjacencyList)) {
      if (outgoing.length > 3) {
        bottlenecks.push({
          stepId,
          bottleneckType: 'high_dependency_fan_out',
          severity: outgoing.length / 5,
        })
      }
    }

    // Check for long-duration steps on critical path
    const criticalPath = this.getCriticalPath()
    const avgDuration = Array.from(this.nodes.values())
      .reduce((sum, step) => sum + step.estimatedDuration, 0) / this.nodes.size

    for (const step of criticalPath.path) {
      if (step.estimatedDuration > avgDuration * 2) {
        bottlenecks.push({
          stepId: step.id,
          bottleneckType: 'long_critical_path_step',
          severity: step.estimatedDuration / avgDuration,
        })
      }
    }

    return bottlenecks
  }

  /**
   * Validates the dependency graph for consistency
   */
  validateGraph(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check for missing nodes
    for (const dependency of Array.from(this.edges.values())) {
      if (!this.nodes.has(dependency.fromStepId)) {
        errors.push(`Dependency references non-existent step: ${dependency.fromStepId}`)
      }
      if (!this.nodes.has(dependency.toStepId)) {
        errors.push(`Dependency references non-existent step: ${dependency.toStepId}`)
      }
    }

    // Check for circular dependencies
    const cycles = this.detectCircularDependencies()
    if (cycles.length > 0) {
      errors.push(`Circular dependencies detected: ${cycles.map(cycle => cycle.join(' -> ')).join(', ')}`)
    }

    // Check for self-dependencies
    for (const dependency of Array.from(this.edges.values())) {
      if (dependency.fromStepId === dependency.toStepId) {
        errors.push(`Self-dependency detected: ${dependency.fromStepId}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  private canExecuteStep(stepId: string, completedStepIds: Set<string>): boolean {
    const incomingDeps = this.reverseAdjacencyList.get(stepId) || []

    // All prerequisite steps must be completed
    for (const prereqId of incomingDeps) {
      if (!completedStepIds.has(prereqId)) {
        return false
      }
    }

    return true
  }

  private calculateResourceRequirements(steps: TaskStep[]): Record<string, number> {
    const requirements: Record<string, number> = {}

    for (const step of steps) {
      for (const skill of step.requiredSkills) {
        requirements[skill] = (requirements[skill] || 0) + 1
      }
    }

    return requirements
  }

  private topologicalSort(): TaskStep[] | null {
    const sorted: TaskStep[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const dfs = (stepId: string): boolean => {
      if (visiting.has(stepId)) {
        return false // Cycle detected
      }
      if (visited.has(stepId)) {
        return true
      }

      visiting.add(stepId)

      const neighbors = this.adjacencyList.get(stepId) || []
      for (const neighbor of neighbors) {
        if (!dfs(neighbor)) {
          return false
        }
      }

      visiting.delete(stepId)
      visited.add(stepId)

      const step = this.nodes.get(stepId)
      if (step) {
        sorted.push(step)
      }

      return true
    }

    for (const stepId of Array.from(this.nodes.keys())) {
      if (!visited.has(stepId)) {
        if (!dfs(stepId)) {
          return null // Cycle detected
        }
      }
    }

    return sorted
  }

  private clear(): void {
    this.nodes.clear()
    this.edges.clear()
    this.adjacencyList.clear()
    this.reverseAdjacencyList.clear()
  }
}