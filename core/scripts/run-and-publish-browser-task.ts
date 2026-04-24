import { SkillRegistry } from '../src/business/skills/SkillRegistry.js'
import { EnvironmentInterface } from '../src/business/environment/EnvironmentInterface.js'
import { ReflectionEngine } from '../src/business/reflection/ReflectionEngine.js'
import { ApprovalChain } from '../src/business/security/ApprovalChain.js'
import { TaskBus } from '../src/business/collaboration/TaskBus.js'
import { AgentCluster } from '../src/business/cluster/AgentCluster.js'

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'
const agentId = process.env.AGENT_ID ?? 'browser-agent-1'
const goal = process.argv.slice(2).join(' ') || process.env.BROWSER_TASK_GOAL ||
  'Navigate to https://www.linkedin.com/messaging/, summarize the latest unread messages.'

const skillRegistry = new SkillRegistry('./skills')
const environment = new EnvironmentInterface()
const reflectionEngine = new ReflectionEngine(skillRegistry)
const approval = new ApprovalChain()
const taskBus = new TaskBus(agentId, redisUrl)

const brainStub = {
  async query() {
    return { nodes: [] }
  },
  async store() {
    return null
  },
} as any

await taskBus.registerAgent(['browser'], ['web_automation'], 1)
console.log('[BrowserTaskRunner] Registered browser agent in TaskBus')

const cluster = new AgentCluster(
  {
    agentId,
    skills: ['browser'],
    domains: ['web_automation'],
    maxConcurrentTasks: 1,
    approvalRequired: false,
    cognitiveModel: 'opus-4',
  },
  {
    skillRegistry,
    environment,
    taskBus,
    reflectionEngine,
    approval,
    brain: brainStub,
  }
)

await cluster.runAutonomously()
console.log('[BrowserTaskRunner] Browser agent cluster started')
console.log(`[BrowserTaskRunner] Publishing task: ${goal}`)

const taskId = await taskBus.publishTask({
  type: 'browser',
  domain: 'web_automation',
  description: goal,
  requiredSkills: ['browser'],
  priority: 1,
  ttl: 3600,
  payload: {
    goal,
  },
})

console.log(`[BrowserTaskRunner] Published task ${taskId}`)

const timeoutMs = 180_000
const pollIntervalMs = 2000
const start = Date.now()

while (Date.now() - start < timeoutMs) {
  const result = await taskBus.getTaskResult(taskId)
  if (result) {
    console.log('\nTask completed:')
    console.log(JSON.stringify(result, null, 2))
    process.exit(0)
  }
  process.stdout.write('.')
  await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
}

console.error(`\nTask did not complete within ${timeoutMs / 1000} seconds.`)
console.error('Make sure chromium opened, LinkedIn logged in, and the browser task consumer is running.')
process.exit(1)
