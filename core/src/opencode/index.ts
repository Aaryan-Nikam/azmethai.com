/**
 * @file index.ts
 * @description Azmeth OpenCode Engine - Main Entrypoint
 *
 * This is the production-grade port of the Claude Code architecture into the Azmeth platform.
 * Every module below is a line-by-line adapted port of the original Claude Code source,
 * with all Anthropic-specific dependency references rebased to the Azmeth namespace.
 *
 * Layer order (bottom-up, dependency-safe):
 *   1. constants/   — Date utils, product constants, tool limits
 *   2. types/       — Full TypeScript type system (permissions, hooks, IDs, logs)
 *   3. utils/       — All utilities (envUtils, claudemd -> azmethMd, config, git, etc.)
 *   4. memdir/      — Memory directory: AZMETH.md hierarchy engine
 *   5. bootstrap/   — Session state, CWD tracking
 *   6. services/    — Analytics (GrowthBook, DataDog), compact, LSP, MCP, settings sync
 *   7. tools/       — All 50+ tool definitions (BashTool, FileEditTool, AgentTool, etc.)
 *   8. permissions/ — ApprovalChain integration layer
 *   9. coordinator/ — Turn + sub-agent orchestration
 *  10. query/       — The 1730-line master ReAct loop (query.ts / QueryEngine.ts)
 */

// Core primitives
export * from './constants/common.js'

// Utility layer
export * from './utils/envUtils.js'

// The master query loop
export * from './query/query.js'
export * from './query/QueryEngine.js'
