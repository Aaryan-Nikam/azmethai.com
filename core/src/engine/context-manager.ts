import Anthropic from '@anthropic-ai/sdk'

export class ContextManager {
  private maxTokens: number

  constructor(maxTokens: number = 80000) {
    this.maxTokens = maxTokens
  }

  /**
   * Evaluates the current message list. If it exceeds rough token estimates,
   * it compacts older tool results to save context space, preventing the loop from crashing.
   */
  public compactContext(messages: Anthropic.MessageParam[]): Anthropic.MessageParam[] {
    // Rough estimation: 4 chars per token.
    const extractLength = (msg: Anthropic.MessageParam) => {
      if (typeof msg.content === 'string') return msg.content.length
      return msg.content.reduce((sum, block) => {
        if (block.type === 'text') return sum + block.text.length
        if (block.type === 'tool_result' && typeof block.content === 'string') return sum + block.content.length
        return sum + 100 // baseline
      }, 0)
    }

    const totalChars = messages.reduce((sum, msg) => sum + extractLength(msg), 0)
    const estimatedTokens = totalChars / 4

    // If safe, do nothing
    if (estimatedTokens < this.maxTokens) {
      return messages
    }

    console.log(`[ContextManager] Token limit reached (~${Math.floor(estimatedTokens)}). Compacting context...`)

    // Compacting: We keep the system/user goal (first few messages) and the most recent 10 messages.
    // For middle messages that are large 'tool_results', we truncate the text to say "[Truncated Context]"
    const compacted = [...messages]
    
    for (let i = 1; i < compacted.length - 10; i++) {
       const msg = compacted[i]
       if (msg.role === 'user' && Array.isArray(msg.content)) {
          msg.content = msg.content.map(block => {
             if (block.type === 'tool_result') {
                return {
                   ...block,
                   content: typeof block.content === 'string' 
                     ? block.content.substring(0, 500) + '... [COMPACTED BY CONTEXT MANAGER to save token space]'
                     : block.content
                } as Anthropic.ToolResultBlockParam
             }
             return block
          })
       }
    }

    return compacted
  }
}
