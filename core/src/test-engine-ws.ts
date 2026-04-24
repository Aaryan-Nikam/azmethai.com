/**
 * @file test-engine-ws.ts
 * @description End-to-end test of the Azmeth Engine WebSocket pipeline.
 *
 * Simulates what the frontend does:
 *  1. Opens a WS connection to ws://gateway/engine
 *  2. Sends engine:start with a user message
 *  3. Receives streaming NodeEvents (thinking, tool_use, complete)
 *  4. Prints everything to stdout
 *
 * Run: npx tsx src/test-engine-ws.ts
 * (Start the gateway first, or use the standalone test mode below)
 */

import { AzmethSessionEngine } from './opencode/azmeth-integration/index.js'

// Minimal mock WebSocket that prints events to console
class ConsoleWebSocket {
  readyState = 1 // OPEN

  send(data: string) {
    const evt = JSON.parse(data)
    const icons: Record<string, string> = {
      thinking:     '🧠',
      tool_use:     '🔧',
      observation:  '👁️ ',
      interruption: '⚠️ ',
      complete:     '✅',
      error:        '❌',
    }
    const icon = icons[evt.type] ?? '📡'
    console.log(`${icon} [${evt.type.toUpperCase()}]`, evt.content ?? evt.toolName ?? '')
    if (evt.input)  console.log('   Input:', JSON.stringify(evt.input).slice(0, 120))
    if (evt.result) console.log('   Result:', JSON.stringify(evt.result).slice(0, 120))
    if (evt.riskLevel) console.log(`   Risk: ${evt.riskLevel} — ${evt.reason}`)
  }

  on(_event: string, _cb: (...args: any[]) => void) { /* no-op for test */ }
}

async function main() {
  console.log('🚀 Azmeth Engine — End-to-End Test\n')
  console.log('Model: Azure Kimi K2.5 (kimi-K2.5)')
  console.log('─'.repeat(50))

  const fakeWs = new ConsoleWebSocket() as any

  const engine = new AzmethSessionEngine(fakeWs, {
    tenantId:  'test-tenant',
    roleId:    'sales-agent',
    sessionId: `test-${Date.now()}`,
  })

  const userMessage = 'What is 42 * 13? Think step by step and show your work.'

  console.log(`\n👤 User: "${userMessage}"\n`)
  console.log('─'.repeat(50))

  await engine.start(userMessage)

  console.log('─'.repeat(50))
  console.log('\n✅ Engine test complete.')
}

main().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
