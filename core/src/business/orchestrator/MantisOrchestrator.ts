import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { MemoryManager } from '../memory/MemoryManager.js'
import { ApprovalChain } from '../security/ApprovalChain.js'
import { ToolBridge } from '../tools/ToolBridge.js'
import type {
  TurnInput, TurnOutput, AgentLoopResult,
  WorkingMemory, PendingApproval,
  EpisodicMemory, SemanticMemory
} from '../types.js'

export class MantisOrchestrator {
  private memory = new MemoryManager()
  private approval = new ApprovalChain()
  private tools = new ToolBridge()
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  private supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  // Entry point — called by azmeth-adapter for every inbound message
  async handleTurn(input: TurnInput): Promise<TurnOutput> {
    const { roleId, tenantId, sessionId, message } = input

    // Assemble context fresh for this turn
    const rawContext = await this.memory.assembleContext(roleId, tenantId, message)

    // Enforce token budget — never trim identity or working memory
    const context = this.memory.enforceTokenBudget(rawContext)

    // Run agent loop
    const result = await this.runAgentLoop({
      context,
      sessionId,
      roleId,
      tenantId,
      userMessage: message,
    })

    return {
      reply: result.reply,
      artifacts: result.artifacts,
      approval_required: result.pendingApproval,
      session_status: result.status,
    }
  }

  private async runAgentLoop(params: {
    context: Awaited<ReturnType<MemoryManager['assembleContext']>>
    sessionId: string
    roleId: string
    tenantId: string
    userMessage: string
  }): Promise<AgentLoopResult> {
    const { context, sessionId, roleId, tenantId, userMessage } = params

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: this.buildUserTurn(userMessage, context.working_memory, context.retrieved_memories),
      },
    ]

    let reply = ''
    let artifacts: Record<string, any> = {}
    let pendingApproval: PendingApproval | null = null
    const MAX_LOOPS = 12

    for (let loop = 0; loop < MAX_LOOPS; loop++) {
      const response = await this.anthropic.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 8096,
        system: context.system_prompt,
        tools: this.tools.getDefinitions(roleId),
        messages,
      })

      if (response.stop_reason === 'end_turn') {
        reply = this.extractText(response.content)
        break
      }

      if (response.stop_reason === 'tool_use') {
        const toolUses = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const toolUse of toolUses) {
          // Classify risk before any execution
          const risk = await this.approval.classify(toolUse.name, toolUse.input, roleId, tenantId)

          if (risk.level === 'CRITICAL' || risk.level === 'HIGH') {
            // Write to approval queue
            const approvalId = await this.approval.writeToQueue(
              tenantId, roleId, sessionId, toolUse.name, toolUse.input, risk
            )

            pendingApproval = { approval_id: approvalId, tool: toolUse.name, input: toolUse.input, reason: risk.reason }

            // Checkpoint before blocking
            await this.memory.checkpoint({
              role_id: roleId,
              tenant_id: tenantId,
              session_id: sessionId,
              task_description: userMessage,
              current_step: `Awaiting approval for: ${toolUse.name}`,
              steps_completed: [],
              steps_remaining: [`Execute ${toolUse.name} once approved`],
              artifacts,
              pending_approvals: [approvalId],
              checkpoint_at: new Date(),
              status: 'awaiting_approval',
            })

            reply = this.extractText(response.content) || `I need approval before I can ${toolUse.name.replace(/_/g, ' ')}. I've sent a request to your manager.`
            return { reply, artifacts, pendingApproval, status: 'awaiting_approval' }
          }

          if (risk.level === 'MEDIUM') {
            // Notify and wait — non-blocking
            await this.notifyManager(roleId, tenantId, toolUse.name, toolUse.input, risk.reason)
            if (risk.auto_execute_after_ms) await this.sleep(risk.auto_execute_after_ms)
          }

          // Execute tool
          const result = await this.tools.execute(toolUse.name, toolUse.input, roleId, tenantId)

          // Checkpoint after every tool — crash-safe
          if (result.artifact) artifacts = { ...artifacts, ...result.artifact }

          await this.memory.checkpoint({
            role_id: roleId,
            tenant_id: tenantId,
            session_id: sessionId,
            task_description: userMessage,
            current_step: `Completed: ${toolUse.name}`,
            steps_completed: [toolUse.name],
            steps_remaining: [],
            artifacts,
            pending_approvals: [],
            checkpoint_at: new Date(),
            status: 'active',
          })

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result.output),
          })
        }

        messages.push({ role: 'assistant', content: response.content })
        messages.push({ role: 'user', content: toolResults })
        continue
      }

      break
    }

    // Close session
    await this.closeSession(sessionId, roleId, tenantId, userMessage, reply, artifacts)
    return { reply, artifacts, pendingApproval: null, status: 'completed' }
  }

  // Resume after human approves a blocked action
  async resumeAfterApproval(
    approvalId: string,
    approved: boolean,
    decidedBy: string
  ): Promise<TurnOutput> {
    await this.approval.resolveApproval(approvalId, approved, decidedBy)

    const { data: queueItem } = await this.supabase
      .from('approval_queue')
      .select('*, working_memory!session_id(*)')
      .eq('id', approvalId)
      .single()

    if (!queueItem) throw new Error(`Approval ${approvalId} not found`)

    if (!approved) {
      await this.supabase
        .from('working_memory')
        .update({ status: 'failed', pending_approvals: [] })
        .eq('session_id', queueItem.session_id)

      return {
        reply: `The action was declined by ${decidedBy}. I've stopped the task.`,
        artifacts: {},
        approval_required: null,
        session_status: 'failed',
      }
    }

    // Continue from checkpoint
    return this.handleTurn({
      roleId: queueItem.role_id,
      tenantId: queueItem.tenant_id,
      sessionId: queueItem.session_id,
      message: `[SYSTEM: Approval ${approvalId} granted by ${decidedBy}. Resume task.] Continue from: ${queueItem.working_memory?.current_step ?? 'last checkpoint'}`,
      channelMeta: {},
    })
  }

  private buildUserTurn(
    message: string,
    working: WorkingMemory | null,
    retrieved: (EpisodicMemory | SemanticMemory)[]
  ): string {
    const parts: string[] = []

    if (working?.status === 'active' && working.task_description) {
      parts.push(`## Ongoing task\n${working.task_description}`)
      if (working.current_step) parts.push(`Current step: ${working.current_step}`)
      if (working.steps_completed.length > 0)
        parts.push(`Steps completed: ${working.steps_completed.join(', ')}`)
    }

    if (retrieved.length > 0) {
      const memLines = retrieved.map(mem => {
        if ('summary' in mem) return `- [Past session] ${mem.summary.slice(0, 200)}`
        if ('subject' in mem) return `- [Fact] ${mem.subject} ${mem.predicate} ${mem.object} (confidence: ${mem.confidence})`
        return ''
      }).filter(Boolean)

      if (memLines.length > 0) parts.push(`## Relevant context\n${memLines.join('\n')}`)
    }

    parts.push(`## Current request\n${message}`)
    return parts.join('\n\n')
  }

  private async closeSession(
    sessionId: string, roleId: string, tenantId: string,
    task: string, reply: string, artifacts: Record<string, any>
  ): Promise<void> {
    // Write episode
    await this.memory.writeEpisode(
      sessionId, roleId, tenantId,
      task, reply,
      Object.keys(artifacts)
    )

    // Mark working memory complete
    await this.supabase
      .from('working_memory')
      .update({ status: 'completed' })
      .eq('session_id', sessionId)

    // Compress async — don't block response
    this.memory.compressSession(sessionId, roleId, tenantId).catch(err =>
      console.error('compressSession failed:', err)
    )
  }

  private async notifyManager(
    roleId: string, tenantId: string,
    tool: string, input: any, reason: string
  ): Promise<void> {
    const { data: identity } = await this.supabase
      .from('role_identities')
      .select('reports_to, role, company_name')
      .eq('id', roleId)
      .single()

    if (!identity?.reports_to) return

    // Wire to your existing multi-channel notification system
    await fetch(`${process.env.INTERNAL_GATEWAY_URL}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: identity.reports_to,
        subject: `[Mantis] ${identity.role} action requires awareness`,
        body: `${identity.role} at ${identity.company_name} is executing: ${tool}\nFlagged: ${reason}\nWill auto-proceed in 60 seconds unless you respond STOP.`,
        priority: 'medium',
      }),
    }).catch(() => {}) // notification failure should not block execution
  }

  private extractText(content: Anthropic.ContentBlock[]): string {
    return content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
  }
}
