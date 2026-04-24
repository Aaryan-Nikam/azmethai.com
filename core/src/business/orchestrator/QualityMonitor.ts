import type {
  TaskExecutionResult,
  TaskStep,
  QualityMetrics,
  QualityThreshold,
  QualityFeedback,
  OrchestrationContext,
  TaskExecutionResult
} from './orchestrator-types.js'

export interface QualityMonitorConfig {
  qualityThresholds: QualityThreshold[]
  feedbackInterval: number
  adaptiveThresholds: boolean
  qualityHistorySize: number
  anomalyDetectionEnabled: boolean
}

export interface QualityAnalysis {
  stepId: string
  metrics: QualityMetrics
  score: number
  issues: string[]
  recommendations: string[]
  timestamp: Date
}

export class QualityMonitor {
  private config: QualityMonitorConfig
  private qualityHistory: Map<string, QualityAnalysis[]> = new Map() // stepId -> history
  private qualityThresholds: Map<string, QualityThreshold> = new Map()
  private feedbackTimer?: NodeJS.Timeout

  constructor(config: QualityMonitorConfig) {
    this.config = config
    this.initializeThresholds()
    this.startFeedbackLoop()
  }

  /**
   * Analyzes the quality of a task execution result
   */
  async analyzeExecutionQuality(
    result: TaskExecutionResult,
    step: TaskStep,
    context: OrchestrationContext
  ): Promise<QualityAnalysis> {
    const metrics = await this.calculateQualityMetrics(result, step, context)
    const score = this.calculateQualityScore(metrics)
    const issues = this.identifyQualityIssues(metrics, step)
    const recommendations = this.generateRecommendations(metrics, issues, step)

    const analysis: QualityAnalysis = {
      stepId: result.stepId,
      metrics,
      score,
      issues,
      recommendations,
      timestamp: new Date(),
    }

    // Store in history
    this.storeQualityAnalysis(analysis)

    // Update adaptive thresholds if enabled
    if (this.config.adaptiveThresholds) {
      this.updateAdaptiveThresholds(step.type, metrics)
    }

    return analysis
  }

  /**
   * Monitors quality trends across multiple executions
   */
  monitorQualityTrends(stepType: string): {
    averageScore: number
    trend: 'improving' | 'declining' | 'stable'
    anomalies: QualityAnalysis[]
    recommendations: string[]
  } {
    const allAnalyses = Array.from(this.qualityHistory.values())
      .flat()
      .filter(a => a.stepId.startsWith(stepType))

    if (allAnalyses.length === 0) {
      return {
        averageScore: 0,
        trend: 'stable',
        anomalies: [],
        recommendations: [],
      }
    }

    const scores = allAnalyses.map(a => a.score)
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

    // Calculate trend
    const recentScores = scores.slice(-10)
    const trend = this.calculateTrend(recentScores)

    // Detect anomalies
    const anomalies = this.detectAnomalies(allAnalyses)

    // Generate recommendations
    const recommendations = this.generateTrendRecommendations(trend, anomalies, stepType)

    return {
      averageScore,
      trend,
      anomalies,
      recommendations,
    }
  }

  /**
   * Provides real-time quality feedback during execution
   */
  async provideExecutionFeedback(
    step: TaskStep,
    currentProgress: number,
    context: OrchestrationContext
  ): Promise<QualityFeedback> {
    const historicalData = this.getHistoricalData(step.type)
    const predictedQuality = this.predictExecutionQuality(step, historicalData)

    const feedback: QualityFeedback = {
      stepId: step.id,
      predictedQuality: predictedQuality.score,
      riskLevel: this.assessRiskLevel(predictedQuality, step),
      suggestions: predictedQuality.recommendations,
      timestamp: new Date(),
    }

    return feedback
  }

  /**
   * Validates quality thresholds for a step type
   */
  validateQualityThresholds(stepType: string): {
    valid: boolean
    issues: string[]
    suggestions: string[]
  } {
    const threshold = this.qualityThresholds.get(stepType)
    const history = this.getHistoricalData(stepType)

    if (!threshold || history.length === 0) {
      return {
        valid: false,
        issues: ['No quality thresholds defined or insufficient historical data'],
        suggestions: ['Define quality thresholds', 'Collect more execution data'],
      }
    }

    const issues: string[] = []
    const suggestions: string[] = []

    // Check if thresholds are realistic based on historical data
    const avgAccuracy = history.reduce((sum, a) => sum + a.metrics.accuracy, 0) / history.length
    const avgEfficiency = history.reduce((sum, a) => sum + a.metrics.efficiency, 0) / history.length

    if (threshold.minAccuracy > avgAccuracy * 1.2) {
      issues.push('Minimum accuracy threshold may be too high')
      suggestions.push('Consider lowering minAccuracy threshold')
    }

    if (threshold.minEfficiency > avgEfficiency * 1.2) {
      issues.push('Minimum efficiency threshold may be too high')
      suggestions.push('Consider lowering minEfficiency threshold')
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions,
    }
  }

  /**
   * Generates quality improvement recommendations
   */
  generateQualityImprovements(stepType: string): {
    priority: 'high' | 'medium' | 'low'
    improvements: string[]
    expectedImpact: number
  } {
    const history = this.getHistoricalData(stepType)
    const trends = this.monitorQualityTrends(stepType)

    if (history.length < 5) {
      return {
        priority: 'medium',
        improvements: ['Collect more execution data for better analysis'],
        expectedImpact: 0.1,
      }
    }

    const improvements: string[] = []
    let expectedImpact = 0

    // Analyze common issues
    const commonIssues = this.findCommonIssues(history)

    if (commonIssues.includes('low_accuracy')) {
      improvements.push('Implement accuracy validation checks')
      improvements.push('Add quality gates before step completion')
      expectedImpact += 0.2
    }

    if (commonIssues.includes('timeout')) {
      improvements.push('Optimize execution timeouts')
      improvements.push('Implement progress monitoring')
      expectedImpact += 0.15
    }

    if (commonIssues.includes('resource_contention')) {
      improvements.push('Improve resource allocation strategies')
      improvements.push('Implement resource pre-allocation')
      expectedImpact += 0.1
    }

    if (trends.trend === 'declining') {
      improvements.push('Review recent changes that may affect quality')
      improvements.push('Implement quality regression testing')
      expectedImpact += 0.25
    }

    const priority = expectedImpact > 0.3 ? 'high' : expectedImpact > 0.15 ? 'medium' : 'low'

    return {
      priority,
      improvements,
      expectedImpact,
    }
  }

  private async calculateQualityMetrics(
    result: TaskExecutionResult,
    step: TaskStep,
    context: OrchestrationContext
  ): Promise<QualityMetrics> {
    const metrics: QualityMetrics = {
      accuracy: 0,
      completeness: 0,
      efficiency: 0,
      timeliness: 0,
      reliability: 0,
      resourceUtilization: 0,
    }

    // Calculate accuracy based on result status and any validation data
    metrics.accuracy = result.status === 'completed' ? 1.0 :
                      result.status === 'failed' ? 0.0 : 0.5

    // Calculate completeness based on expected vs actual output
    metrics.completeness = this.calculateCompleteness(result, step)

    // Calculate efficiency (actual vs estimated duration)
    const durationRatio = result.actualDuration / step.estimatedDuration
    metrics.efficiency = Math.max(0, Math.min(1, 2 - durationRatio)) // Penalize overruns

    // Calculate timeliness (on time vs late)
    metrics.timeliness = result.onTime ? 1.0 : 0.3

    // Calculate reliability based on retry count and success rate
    metrics.reliability = result.status === 'completed' ? 1.0 : 0.0

    // Calculate resource utilization
    metrics.resourceUtilization = this.calculateResourceUtilization(result, context)

    return metrics
  }

  private calculateQualityScore(metrics: QualityMetrics): number {
    // Weighted average of all metrics
    const weights = {
      accuracy: 0.3,
      completeness: 0.25,
      efficiency: 0.15,
      timeliness: 0.15,
      reliability: 0.1,
      resourceUtilization: 0.05,
    }

    return Object.entries(metrics).reduce((score, [key, value]) => {
      return score + (value * weights[key as keyof QualityMetrics])
    }, 0)
  }

  private identifyQualityIssues(metrics: QualityMetrics, step: TaskStep): string[] {
    const issues: string[] = []
    const thresholds = this.qualityThresholds.get(step.type)

    if (!thresholds) return issues

    if (metrics.accuracy < thresholds.minAccuracy) {
      issues.push('Low accuracy detected')
    }

    if (metrics.completeness < thresholds.minCompleteness) {
      issues.push('Incomplete execution')
    }

    if (metrics.efficiency < thresholds.minEfficiency) {
      issues.push('Poor efficiency - execution took longer than expected')
    }

    if (metrics.timeliness < 0.5) {
      issues.push('Execution was not on time')
    }

    if (metrics.reliability < thresholds.minReliability) {
      issues.push('Low reliability - execution failed')
    }

    if (metrics.resourceUtilization > thresholds.maxResourceUtilization) {
      issues.push('High resource utilization')
    }

    return issues
  }

  private generateRecommendations(
    metrics: QualityMetrics,
    issues: string[],
    step: TaskStep
  ): string[] {
    const recommendations: string[] = []

    if (issues.includes('Low accuracy detected')) {
      recommendations.push('Review input validation and error handling')
      recommendations.push('Consider adding quality checks before completion')
    }

    if (issues.includes('Poor efficiency - execution took longer than expected')) {
      recommendations.push('Optimize algorithm or increase resource allocation')
      recommendations.push('Review dependencies and parallelization opportunities')
    }

    if (issues.includes('Execution was not on time')) {
      recommendations.push('Adjust timeout settings or resource priorities')
      recommendations.push('Review scheduling conflicts')
    }

    if (issues.includes('Low reliability - execution failed')) {
      recommendations.push('Implement retry logic with exponential backoff')
      recommendations.push('Add circuit breaker pattern for failing services')
    }

    if (issues.includes('High resource utilization')) {
      recommendations.push('Optimize resource usage or increase capacity')
      recommendations.push('Consider load balancing across multiple resources')
    }

    return recommendations
  }

  private calculateCompleteness(result: TaskExecutionResult, step: TaskStep): number {
    // This would analyze the actual output vs expected output
    // For now, use a simple heuristic based on execution status
    if (result.status === 'completed') {
      return result.error ? 0.7 : 1.0 // Partial completion if there were errors
    }
    return 0.0
  }

  private calculateResourceUtilization(
    result: TaskExecutionResult,
    context: OrchestrationContext
  ): number {
    // This would analyze actual resource usage vs allocated resources
    // For now, return a neutral value
    return 0.5
  }

  private storeQualityAnalysis(analysis: QualityAnalysis): void {
    const history = this.qualityHistory.get(analysis.stepId) || []
    history.push(analysis)

    // Keep only recent history
    if (history.length > this.config.qualityHistorySize) {
      history.shift()
    }

    this.qualityHistory.set(analysis.stepId, history)
  }

  private initializeThresholds(): void {
    for (const threshold of this.config.qualityThresholds) {
      this.qualityThresholds.set(threshold.stepType, threshold)
    }
  }

  private updateAdaptiveThresholds(stepType: string, metrics: QualityMetrics): void {
    const currentThreshold = this.qualityThresholds.get(stepType)
    if (!currentThreshold) return

    const history = this.getHistoricalData(stepType)
    if (history.length < 10) return // Need sufficient data

    // Adjust thresholds based on historical performance
    const avgAccuracy = history.reduce((sum, a) => sum + a.metrics.accuracy, 0) / history.length
    const avgEfficiency = history.reduce((sum, a) => sum + a.metrics.efficiency, 0) / history.length

    // Gradually adjust thresholds towards historical averages
    const adjustmentRate = 0.1
    currentThreshold.minAccuracy = currentThreshold.minAccuracy * (1 - adjustmentRate) +
                                  avgAccuracy * adjustmentRate
    currentThreshold.minEfficiency = currentThreshold.minEfficiency * (1 - adjustmentRate) +
                                    avgEfficiency * adjustmentRate
  }

  private calculateTrend(scores: number[]): 'improving' | 'declining' | 'stable' {
    if (scores.length < 3) return 'stable'

    const recent = scores.slice(-5)
    const older = scores.slice(-10, -5)

    if (older.length === 0) return 'stable'

    const recentAvg = recent.reduce((sum, s) => sum + s, 0) / recent.length
    const olderAvg = older.reduce((sum, s) => sum + s, 0) / older.length

    const change = recentAvg - olderAvg

    if (change > 0.05) return 'improving'
    if (change < -0.05) return 'declining'
    return 'stable'
  }

  private detectAnomalies(analyses: QualityAnalysis[]): QualityAnalysis[] {
    if (!this.config.anomalyDetectionEnabled || analyses.length < 10) {
      return []
    }

    const scores = analyses.map(a => a.score)
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length
    const stdDev = Math.sqrt(
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
    )

    const threshold = mean - 2 * stdDev // 2 standard deviations below mean

    return analyses.filter(a => a.score < threshold)
  }

  private generateTrendRecommendations(
    trend: 'improving' | 'declining' | 'stable',
    anomalies: QualityAnalysis[],
    stepType: string
  ): string[] {
    const recommendations: string[] = []

    if (trend === 'declining') {
      recommendations.push(`Quality is declining for ${stepType}. Review recent changes.`)
      recommendations.push('Consider implementing quality gates.')
    }

    if (anomalies.length > 0) {
      recommendations.push(`${anomalies.length} quality anomalies detected. Investigate root causes.`)
    }

    if (trend === 'stable' && anomalies.length === 0) {
      recommendations.push('Quality metrics are stable. Continue monitoring.')
    }

    return recommendations
  }

  private predictExecutionQuality(
    step: TaskStep,
    historicalData: QualityAnalysis[]
  ): { score: number; recommendations: string[] } {
    if (historicalData.length === 0) {
      return { score: 0.5, recommendations: ['Insufficient historical data for prediction'] }
    }

    const avgScore = historicalData.reduce((sum, a) => sum + a.score, 0) / historicalData.length

    // Adjust based on step characteristics
    let adjustment = 0

    if (step.priority <= 3) adjustment += 0.1 // High priority steps tend to be better
    if (step.estimatedDuration > 300000) adjustment -= 0.1 // Long steps tend to have issues

    const predictedScore = Math.max(0, Math.min(1, avgScore + adjustment))

    const recommendations: string[] = []
    if (predictedScore < 0.6) {
      recommendations.push('Consider increasing resource allocation')
      recommendations.push('Review step dependencies and prerequisites')
    }

    return { score: predictedScore, recommendations }
  }

  private assessRiskLevel(
    prediction: { score: number; recommendations: string[] },
    step: TaskStep
  ): 'low' | 'medium' | 'high' {
    if (prediction.score > 0.8) return 'low'
    if (prediction.score > 0.6) return 'medium'
    return 'high'
  }

  private getHistoricalData(stepType: string): QualityAnalysis[] {
    return Array.from(this.qualityHistory.values())
      .flat()
      .filter(a => a.stepId.startsWith(stepType))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  private findCommonIssues(analyses: QualityAnalysis[]): string[] {
    const issueCounts = new Map<string, number>()

    for (const analysis of analyses) {
      for (const issue of analysis.issues) {
        issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1)
      }
    }

    // Return issues that appear in more than 30% of analyses
    const threshold = analyses.length * 0.3
    return Array.from(issueCounts.entries())
      .filter(([, count]) => count > threshold)
      .map(([issue]) => issue.toLowerCase().replace(/\s+/g, '_'))
  }

  private startFeedbackLoop(): void {
    if (this.config.feedbackInterval > 0) {
      this.feedbackTimer = setInterval(() => {
        // Periodic quality analysis and feedback
        this.performPeriodicQualityCheck()
      }, this.config.feedbackInterval)
    }
  }

  private performPeriodicQualityCheck(): void {
    // Analyze quality trends for all step types
    const stepTypes = new Set(
      Array.from(this.qualityHistory.keys()).map(id => id.split('_')[0])
    )

    for (const stepType of stepTypes) {
      const trends = this.monitorQualityTrends(stepType)

      if (trends.trend === 'declining' || trends.anomalies.length > 0) {
        console.warn(`Quality issues detected for ${stepType}:`, {
          trend: trends.trend,
          anomalyCount: trends.anomalies.length,
          recommendations: trends.recommendations,
        })
      }
    }
  }

  destroy(): void {
    if (this.feedbackTimer) {
      clearInterval(this.feedbackTimer)
    }
  }
}