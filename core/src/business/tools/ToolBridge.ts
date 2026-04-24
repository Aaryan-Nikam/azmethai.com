import { LegalToolExecutor } from '../domain/LegalToolExecutor.js'
import { LEGAL_TOOLS } from '../domain/legal.js'
import { SandboxRunTool } from './native/SandboxRunTool.js'
import { WebSearchTool } from './native/WebSearchTool.js'
import { BrowserbaseTool } from './native/BrowserbaseTool.js'
import { ExtensionBrowserTool } from './native/ExtensionBrowserTool.js'

export interface ToolResult {
  output: any
  artifact?: Record<string, any>
  error?: string
}

export class ToolBridge {
  private legalTools = new LegalToolExecutor()

  getDefinitions(roleId: string): Anthropic.Tool[] {
    const tools: Anthropic.Tool[] = []

    // Add native tools
    tools.push(SandboxRunTool.definition)
    tools.push(WebSearchTool.definition)
    tools.push(BrowserbaseTool.definition)
    tools.push(ExtensionBrowserTool.definition)

    // Add domain tools
    tools.push(...LEGAL_TOOLS)

    return tools
  }

  async execute(name: string, input: any, roleId: string, tenantId: string): Promise<ToolResult> {
    try {
      console.log(`[ToolBridge] Executing Tool: ${name}`)

      // ── Native Tools ────────────────────────────────────────────────────
      if (name === SandboxRunTool.definition.name || name === 'execute_javascript') {
        const result = await SandboxRunTool.execute(input)
        return { output: result }
      }

      if (name === WebSearchTool.toolName) {
        const result = await WebSearchTool.execute(input)
        return { output: result }
      }

      if (name === BrowserbaseTool.toolName) {
        const result = await BrowserbaseTool.execute(input, roleId)
        return { output: result }
      }

      if (name === ExtensionBrowserTool.toolName) {
        const result = await ExtensionBrowserTool.execute(input)
        return { output: result }
      }

      // ── Domain Tools ────────────────────────────────────────────────────
      const legalToolNames = LEGAL_TOOLS.map(t => t.name)
      if (legalToolNames.includes(name)) {
        return this.legalTools.execute(name, input, roleId, tenantId)
      }

      // ── Fallback: tell the agent to use execute_javascript ────────────
      throw new Error(
        `Tool "${name}" is not registered in ToolBridge. ` +
        `Available tools: ${[
          SandboxRunTool.definition.name,
          WebSearchTool.toolName,
          BrowserbaseTool.toolName,
          ExtensionBrowserTool.toolName,
          ...legalToolNames,
        ].join(', ')}. ` +
        `Use 'execute_javascript' to call any unlisted external API directly.`,
      )
    } catch (err: any) {
      console.error(`[ToolBridge] Error executing ${name}:`, err)
      return { output: { error: err.message }, error: err.message }
    }
  }
}

