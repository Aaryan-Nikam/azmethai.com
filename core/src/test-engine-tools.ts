/**
 * @file test-engine-tools.ts
 * @description Tests the full ReAct loop with tool calling.
 * Run: npx tsx src/test-engine-tools.ts (with env exported)
 */
import { AzmethSessionEngine } from './opencode/azmeth-integration/index.js'

class ConsoleWebSocket {
  readyState = 1
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
    const label = evt.content ?? evt.toolName ?? ''
    // Only print first 120 chars of thinking to keep output clean
    const preview = evt.type === 'thinking'
      ? label.slice(-200).replace(/\n/g, ' ').trim()
      : label
    console.log(`${icon} [${evt.type.toUpperCase()}] ${preview}`)
    if (evt.input)  console.log('   ↳ Input:', JSON.stringify(evt.input).slice(0, 120))
    if (evt.result) console.log('   ↳ Result:', String(evt.result).slice(0, 120))
    if (evt.riskLevel) console.log(`   ↳ Risk: ${evt.riskLevel} — ${evt.reason}`)
  }
  on(_: string, __: any) {}
}

async function run(label: string, message: string) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`🧪 TEST: ${label}`)
  console.log(`👤 "${message}"`)
  console.log('─'.repeat(60))

  const engine = new AzmethSessionEngine(new ConsoleWebSocket() as any, {
    tenantId:  'test-tenant',
    roleId:    'sales-agent',
    sessionId: `test-${Date.now()}`,
  })

  await engine.start(message)
}

async function main() {
  console.log('🚀 Azmeth Engine — Tool Calling E2E Test\n')

  // Test 1: Simple JS sandbox tool call
  await run(
    'Sandbox Tool (execute_javascript)',
    'Use the execute_javascript tool to calculate the sum of all numbers from 1 to 100 and tell me the answer.',
  )

  // Test 2: Compound reasoning + tool choice
  await run(
    'Reasoning + Tool Selection',
    'I need you to fetch the current Bitcoin price from the CoinGecko public API (https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd) and report it back.',
  )

  console.log('\n\n✅ All tool tests complete.')
}

main().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
