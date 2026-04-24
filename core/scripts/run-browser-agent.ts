import { SkillRegistry } from '../src/business/skills/SkillRegistry.js'
import { EnvironmentInterface } from '../src/business/environment/EnvironmentInterface.js'
import { ReflectionEngine } from '../src/business/reflection/ReflectionEngine.js'
import { ApprovalChain } from '../src/business/security/ApprovalChain.js'
import { TaskBus } from '../src/business/collaboration/TaskBus.js'
import { AgentCluster } from '../src/business/cluster/AgentCluster.js'

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'
const agentId = process.env.AGENT_ID ?? 'browser-agent-1'

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
console.log('Browser agent registered in TaskBus')

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
console.log(`Browser agent cluster started as ${agentId}`)
console.log('Waiting for browser tasks in domain web_automation...')
