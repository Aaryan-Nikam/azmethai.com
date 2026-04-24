import { AutonomousEngine } from './engine/autonomous-engine.js'
import { ToolBridge } from './business/tools/ToolBridge.js'
import { WorkspaceStore } from './memory/workspace-store.js'

async function runAutonomousSimulation() {
  console.log('====== STARTING MANTIS AUTONOMOUS RE-ACT ENGINE ======')
  
  const workspaceParams = {
    tenantId: 't-test-123',
    roleId: 'test-role-id',
    sessionId: 'sess-12345'
  }
  
  // Initialize Core Dependencies
  const workspaceStore = new WorkspaceStore()
  
  const toolBridge = new ToolBridge()
  
  const engine = new AutonomousEngine(workspaceStore, toolBridge)
  
  const goal = `
    I need you to write a Node.js function using 'execute_javascript'.
    The script should make a dummy HTTP GET request to 'https://jsonplaceholder.typicode.com/todos/1'.
    Parse the JSON result, and then log the title of the todo.
    Once successful, mark the task as complete.
  `
  
  // Execute the Async Generator (Simulating the Live UI Frontend)
  const generator = engine.queryLoop(goal, workspaceParams.roleId, workspaceParams.tenantId, workspaceParams.sessionId)
  
  console.log('\n--- LIVE UI EVENT STREAM ---')
  for await (const event of generator) {
    if (event.type === 'thinking') {
      console.log('🤖 [UI NODE] Thinking...')
    } else if (event.type === 'action') {
      console.log(`🛠️  [UI NODE] Tool Action: ${event.tool}`)
      console.log(`Payload snippet: ${JSON.stringify(event.input).substring(0, 100)}...`)
    } else if (event.type === 'observation') {
      console.log(`🔍 [UI NODE] Observation received (Length: ${JSON.stringify(event.result).length})`)
    } else if (event.type === 'interruption') {
      console.log(`⚠️  [UI NODE] Interruption: ${event.reason}`)
    } else if (event.type === 'completion') {
      console.log(`✅ [UI NODE] Task Complete!`)
      console.log(`Summary: ${event.summary}`)
    } else if (event.type === 'error') {
      console.error(`❌ [UI NODE] FATAL ERROR: ${event.error}`)
    } else {
      console.log(`[UI EVENT]: ${JSON.stringify(event)}`)
    }
  }
  
  console.log('====== ENGINE SHUTDOWN ======')
}

// Ensure the local env gets pulled if we are running tsx manually
import * as dotenv from 'dotenv'
dotenv.config()

runAutonomousSimulation().catch(console.error)
