import Anthropic from '@anthropic-ai/sdk'
import { WorkspaceStore } from '../memory/workspace-store.js'
import { ToolBridge } from '../business/tools/ToolBridge.js'
import { ApprovalChain } from '../business/security/ApprovalChain.js'

export type EngineEvent =
  | { type: 'start'; message: string }
  | { type: 'thinking' }
  | { type: 'action'; id: string; tool: string; input: any }
  | { type: 'observation'; id: string; result: any }
  | { type: 'interruption'; reason: string; approvalId?: string }
  | { type: 'completion'; summary: string }
  | { type: 'error'; error: string }

export class AutonomousEngine {
  private client: Anthropic
  private workspaceStore: WorkspaceStore
  private toolBridge: ToolBridge
  private approvalChain: ApprovalChain

  constructor(workspaceStore: WorkspaceStore, toolBridge: ToolBridge) {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    this.workspaceStore = workspaceStore
    this.toolBridge = toolBridge
    this.approvalChain = new ApprovalChain() // Assuming default construction works
  }

  async *queryLoop(
    goal: string,
    roleId: string,
    tenantId: string,
    sessionId: string
  ): AsyncGenerator<EngineEvent, void, unknown> {
    yield { type: 'start', message: 'Initializing autonomous ReAct loop...' }

    const tools = this.toolBridge.getDefinitions(roleId)
    const availableTools: Anthropic.Tool[] = [
      ...tools,
      {
        name: 'mark_complete',
        description: 'Call this tool when the user goal is completely achieved and no further action is required.',
        input_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'Summary of the work completed.' },
          },
          required: ['summary'],
        },
      },
    ]

    const systemPrompt = `You are an Autonomous AI Employee.
You operate in a continuous loop: Think -> Act -> Observe -> Think.
Use the tools provided to achieve the user's goal.
If you need to execute arbitrary scripts to interact with the web or external APIs (e.g. SalesForce, HubSpot), use the SandboxRunTool to write raw Node.js code and execute it.
You MUST call the 'mark_complete' tool when your task is fully completed.
Do not ask for permission to act, act autonomously. If a human approval is required, the execution system will automatically pause and handle it.
`

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: goal },
    ]

    let isComplete = false

    while (!isComplete) {
      yield { type: 'thinking' }

      try {
        const response = await this.client.messages.create({
          max_tokens: 4096,
          messages,
          system: systemPrompt,
          model: 'claude-3-7-sonnet-20250219',
          tools: availableTools,
        })

        // Filter and process the assistant's content
        let responseContent = response.content
        messages.push({ role: 'assistant', content: responseContent })

        const toolCalls = responseContent.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        )

        if (toolCalls.length === 0) {
          // If no tools called, we assume the agent just replied with text.
          // In a strict ReAct loop, it should use a tool (including mark_complete).
          const textBlock = responseContent.find(c => c.type === 'text')
          if (textBlock && textBlock.type === 'text') {
            yield { type: 'completion', summary: textBlock.text }
          }
          isComplete = true
          break
        }

        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const toolCall of toolCalls) {
          if (toolCall.name === 'mark_complete') {
            const input = toolCall.input as { summary: string }
            yield { type: 'completion', summary: input.summary }
            isComplete = true
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: 'Execution Complete.',
            })
            continue
          }

          yield { type: 'action', id: toolCall.id, tool: toolCall.name, input: toolCall.input }

          // 1. Security Check via Ironpass (ApprovalChain)
          const risk = await this.approvalChain.classify(
            toolCall.name,
            toolCall.input,
            roleId,
            tenantId
          )

          if (risk.level === 'HIGH' || risk.level === 'CRITICAL') {
            const approvalId = await this.approvalChain.writeToQueue(
              tenantId, roleId, sessionId, toolCall.name, toolCall.input, risk
            )
            yield { 
              type: 'interruption', 
              reason: `Tool "${toolCall.name}" intercepted: ${risk.reason}. Awaiting human approval.`,
              approvalId 
            }
            // For now, we will assume human approval gets mocked or handled asynchronously in a real system.
            // But since this is a synchronous loop inside an exact execution cycle, 
            // the agent yields an interruption. In a real system we'd wait or return.
            // Let's assume for this mock we deny it by default or mock an approval wait.
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolCall.id,
              is_error: true,
              content: `ERROR: Execution paused. Awaiting human approval for Approval ID: ${approvalId}. Please ask the user to approve this action.`,
            })
            continue
          }

          // 2. Execute the tool dynamically
          const result = await this.toolBridge.execute(
            toolCall.name,
            toolCall.input,
            roleId,
            tenantId
          )

          yield { type: 'observation', id: toolCall.id, result: result.output }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolCall.id,
            content: typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2),
            is_error: !!result.error
          })
        }

        if (toolResults.length > 0) {
          messages.push({ role: 'user', content: toolResults })
        }

      } catch (err: any) {
        yield { type: 'error', error: err.message }
        isComplete = true // Abort the loop on unhandled critical API error
      }
    }
  }
}
