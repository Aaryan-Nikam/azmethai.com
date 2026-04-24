import { TaskBus } from '../src/business/collaboration/TaskBus.js'

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'
const agentId = process.env.AGENT_ID ?? 'browser-task-publisher'
const defaultGoal = process.env.BROWSER_TASK_GOAL ??
  'Go to google.com and search for Azmeth AI, then take a screenshot of the results'
const goal = process.argv.length > 2
  ? process.argv.slice(2).join(' ')
  : defaultGoal

const taskBus = new TaskBus(agentId, redisUrl)

const task = {
  type: 'browser',
  domain: 'web_automation',
  description: goal,
  requiredSkills: ['browser'],
  priority: 1,
  ttl: 3600,
  payload: {
    goal,
  },
}

console.log('Publishing browser task:', task.description)

const taskId = await taskBus.publishTask(task)
console.log('Published browser task:', taskId)

const timeoutMs = 120_000
const pollIntervalMs = 2000
const start = Date.now()

let result = null

while (Date.now() - start < timeoutMs) {
  result = await taskBus.getTaskResult(taskId)
  if (result) {
    console.log('\nTask completed:')
    console.log(JSON.stringify(result, null, 2))
    break
  }
  process.stdout.write('.')
  await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
}

if (!result) {
  console.error(`\nTask did not complete within ${timeoutMs / 1000} seconds.\n` +
    `Make sure an AgentCluster is running with domain \'web_automation\' and skill \'browser\`.`)
  process.exit(1)
}

process.exit(0)
