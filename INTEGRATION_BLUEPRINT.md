# Azmeth OpenClaw + Claude Cowork Integration Blueprint

This document explains how to integrate the four core components:
1. **SkillRegistry** (Cowork's skill library)
2. **EnvironmentInterface** (Cowork's computer access)
3. **TaskBus** (OpenClaw's peer coordination)
4. **ReflectionEngine** (Self-evolution)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AZMETH MASTER (MantisOrchestrator)        │
│                                                              │
│  - Returns: TurnOutput with approval_required field        │
│  - Escalates to ApprovalChain for risky operations         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   AGENT CLUSTER (NEW)                        │
│                                                              │
│  Each Agent gets:                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │SkillRegistry │  │EnvironmentI  │  │  TaskBus     │      │
│  │              │  │  (browser+fs) │  │(peer coord) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │Reflection    │  │ Brain Memory  │                         │
│  │ Engine       │  │ (integrated)  │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Existing Azmeth Systems                                     │
│  - ApprovalChain (security gates)                            │
│  - Brain Memory (episodic + semantic)                        │
│  - IronPass (data masking)                                   │
│  - Orchestrator (ParallelExecutor, ResourceManager, etc)    │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Integration

### Step 1: Initialize at Startup

```typescript
// In your main azmeth initialization (azmeth.mjs or main entry point)

import { SkillRegistry } from './src/business/skills/SkillRegistry.js'
import { EnvironmentInterface } from './src/business/environment/EnvironmentInterface.js'
import { TaskBus } from './src/business/collaboration/TaskBus.js'
import { ReflectionEngine } from './src/business/reflection/ReflectionEngine.js'
import { AgentCluster } from './src/business/cluster/AgentCluster.js'
import { ApprovalChain } from './src/business/security/ApprovalChain.js'
import { Brain } from './src/business/memory/Brain.js'

// Initialize components
const skillRegistry = new SkillRegistry('./skills')
await skillRegistry.loadAllSkills() // Load from /skills directory

const environment = new EnvironmentInterface(
  async (action) => {
    // Gate through ApprovalChain for security
    const approval = await approvalChain.checkGovernance(
      action.type,
      { action: action.description },
      'azmeth_master',
      'system'
    )
    return approval.approved
  }
)

const taskBus = new TaskBus('azmeth_master', process.env.REDIS_URL)

const brain = new Brain() // Your existing Brain system

const reflectionEngine = new ReflectionEngine(skillRegistry)

// Create master agent cluster
const agentCluster = new AgentCluster(
  {
    agentId: 'azmeth_master',
    skills: ['email', 'web_automation', 'data_processing', 'crm'],
    domains: ['communications', 'browser_automation', 'analytics'],
    maxConcurrentTasks: 5,
    approvalRequired: true,
    cognitiveModel: 'opus-4',
  },
  {
    skillRegistry,
    environment,
    taskBus,
    reflectionEngine,
    approval: approvalChain,
    brain,
  }
)

// Start autonomous execution
agentCluster.runAutonomously()

// Export for TurnInput handler
export { agentCluster, skillRegistry, environment, taskBus }
```

### Step 2: Modify MantisOrchestrator to Use Cluster

```typescript
// In MantisOrchestrator.ts

import { agentCluster, skillRegistry, environment } from './azmeth.mjs'

async handleTurn(input: TurnInput): Promise<TurnOutput> {
  const { roleId, tenantId, sessionId, message } = input

  // First check: can we use existing skills?
  const skill = skillRegistry.findSkills({
    domain: this.inferenceDomain(message),
    minSuccessRate: 0.8,
  })

  if (skill && this.shouldUseSkill(message)) {
    // Execute directly!
    try {
      const result = await this.executeSkillDirect(skill[0], input)
      return {
        reply: result,
        artifacts: {},
        approval_required: null,
        session_status: 'completed',
      }
    } catch (error) {
      // Fall back to regular Claude
    }
  }

  // Otherwise, run standard agent loop
  return await this.runAgentLoop(/* ... existing code ... */)
}

private async executeSkillDirect(skill: SkillDefinition, input: TurnInput): Promise<string> {
  // Use environment interface to execute the skill
  // skill.code contains the TypeScript implementation
  
  const result = await environment.executeCommand('npx', [
    'tsx',
    '-e',
    `
      const env = require('./EnvironmentInterface');
      const skill = ${skill.code};
      console.log(await skill.execute(${JSON.stringify(input)}, env));
    `
  ])

  return result
}
```

### Step 3: Create Skills Library

```bash
mkdir -p skills

# Create example skills
cat > skills/email-responder.skill.json << 'EOF'
{
  "metadata": {
    "id": "email_responder",
    "name": "Email Auto-Responder",
    "description": "Read and respond to emails intelligently",
    "domain": "communications",
    "successRate": 0.92,
    "tags": ["email", "automation", "communication"],
    "dependencies": [],
    "cost": 50,
    "timeout": 60000,
    "examples": []
  },
  "code": "export async function execute(input, env) { /* implementation */ }",
  "requirements": ["nodemailer"]
}
EOF

cat > skills/web-scraper.skill.json << 'EOF'
{
  "metadata": {
    "id": "web_scraper",
    "name": "Web Data Scraper",
    "description": "Scrape and extract structured data from web pages",
    "domain": "browser_automation",
    "successRate": 0.88,
    "tags": ["web", "scraping", "data_extraction"],
    "cost": 100,
    "timeout": 120000
  },
  "code": "export async function execute(input, env) { /* implementation */ }"
}
EOF
```

### Step 4: Enable Real Browser Automation

```typescript
// When user asks for browser task:

const browserTaskId = await taskBus.publishTask({
  type: 'web_automation',
  domain: 'browser_automation',
  description: user_request, // e.g., "Log into my email and download reports"
  requiredSkills: ['web_scraper', 'form_filling'],
  priority: 3,
  payload: { url: 'https://...', actions: [...] },
  ttl: 3600, // 1 hour
})

// Agent cluster will autonomously:
// 1. Find available agents with required skills
// 2. Launch real Playwright browser instance (governed by IronPass)
// 3. Take screenshots for visual verification
// 4. Execute actions safely
// 5. Return results
```

### Step 5: Self-Evolution Loop

```typescript
// Periodically check for crystallization:

setInterval(async () => {
  const newSkills = await reflectionEngine.checkForCrystallization()
  
  if (newSkills.length > 0) {
    console.log(`✨ New skills acquired: ${newSkills.join(', ')}`)
    
    // Update agent capabilities
    agentCluster.config.skills.push(...newSkills)
    
    // Re-register with task bus
    await taskBus.registerAgent(
      agentCluster.config.skills,
      agentCluster.config.domains,
      agentCluster.config.maxConcurrentTasks
    )
  }

  // Get learning insights
  const report = reflectionEngine.getReflectionReport()
  console.log('Learning Report:', report)
}, 60000) // Every minute
```

---

## Key Integration Points

### 1. **Security Gate (IronPass + Environment)**

```typescript
const environment = new EnvironmentInterface(
  async (action) => {
    // Every action goes through governance
    const governance = await approval.checkGovernance(
      action.type,
      { description: action.description, impact: action.impact },
      agentId,
      domain
    )
    
    // Optionally ask for approval on high-impact actions
    if (action.requiresApproval && !governance.approved) {
      throw new Error(`Governance blocked: ${governance.reason}`)
    }

    // Log for audit trail
    console.log(`[AUDIT] ${action.type}: ${action.description}`)

    return governance.approved
  }
)
```

### 2. **Memory Integration (Brain + Skills)**

```typescript
// Store execution context in Brain
await brain.store({
  type: 'skill_execution',
  skillId: skill.metadata.id,
  domain: skill.metadata.domain,
  success: true,
  output: result,
  timestamp: new Date(),
})

// Recall similar past executions
const similar = await brain.query({
  type: 'skill_execution',
  domain: skill.metadata.domain,
  limit: 5,
})

// Use similar executions as context for Claude
```

### 3. **Approval Chain Integration**

```typescript
// When task requires approval
if (task.requiresApproval) {
  const approval = await approvalChain.checkGovernance(
    task.id,
    {
      taskType: task.type,
      payload: task.payload,
      estimatedCost: task.cost,
    },
    agentId,
    task.domain
  )

  if (!approval.approved) {
    // Queue for human review
    await taskBus.failTask(task.id, `Approval required: ${approval.reason}`)
    return
  }
}
```

### 4. **Task Bus for Multi-Agent**

```typescript
// Deploy multiple agent instances for true parallelism

const agents = [
  new AgentCluster({ agentId: 'analyst-1', skills: ['data_analysis'], ... }),
  new AgentCluster({ agentId: 'automation-1', skills: ['web_automation'], ... }),
  new AgentCluster({ agentId: 'writer-1', skills: ['content_writing'], ... }),
]

// All subscribe to same task bus
for (const agent of agents) {
  agent.runAutonomously()
}

// User publishes task
await taskBus.publishTask({
  type: 'report_generation',
  domain: 'analytics',
  requiredSkills: ['data_analysis', 'content_writing'],
  // ... Three agents see this, negotiate who does what
})
```

---

## Configuration

### Environment Variables

```bash
# Redis for task coordination
REDIS_URL=redis://localhost:6379

# Browser automation
PLAYWRIGHT_BROWSERS_PATH=/var/lib/playwright

# Skills library location
SKILLS_PATH=./skills

# Governance
IRONPASS_ENDPOINT=http://localhost:8000
APPROVAL_THRESHOLD=MEDIUM # Only ask approval for MEDIUM+ risk

# Cognitive model
CLAUDE_MODEL=opus-4-20250514
```

### Skill Discovery

```typescript
// Agent automatically discovers skills matching its capabilities

// 1. Register skills in /skills directory
// 2. SkillRegistry loads them automatically
// 3. Agent queries: findSkills({ domain: 'email', minSuccessRate: 0.8 })
// 4. Gets ranked list of 5+ compatible skills
// 5. Picks best one
// 6. If fails, learns and crystallizes new skill
```

---

## Monitoring & Observability

```typescript
// Get cluster health

const status = await agentCluster.getStatus()
console.log({
  activeTasks: status.activeTasks,
  metrics: {
    successRate: (status.metrics.successRate * 100).toFixed(1) + '%',
    totalCompleted: status.metrics.totalTasksCompleted,
    skillsAcquired: status.metrics.skillsAcquired,
  },
  learning: {
    patternsIdentified: status.reflectionReport.patternsIdentified,
    skillsCrystallized: status.reflectionReport.skillsCrystallized,
  },
  insights: status.insights,
})

// Output:
// {
//   activeTasks: 2,
//   metrics: {
//     successRate: 91.2%,
//     totalCompleted: 47,
//     skillsAcquired: 3,
//   },
//   learning: {
//     patternsIdentified: 7,
//     skillsCrystallized: 2,
//   },
//   insights: {
//     averageExecutionTime: 4250,
//     mostCommonDomains: [
//       { domain: 'email', count: 25 },
//       { domain: 'browser_automation', count: 15 }
//     ],
//     inefficiencies: [
//       '3 executions were 2x slower than average'
//     ]
//   }
// }
```

---

## What You Get

✅ **Cowork's Power**: Real browser, file system, terminal — everything a real developer has
✅ **OpenClaw's Autonomy**: Agents negotiate tasks peer-to-peer, no bottlenecks
✅ **Self-Evolution**: Patterns → Skills → Automatic acquisition
✅ **Enterprise Security**: Every action gated through IronPass + approval chain
✅ **Persistent Learning**: Brain remembers everything, reflects on patterns
✅ **Multi-dimensional**: Email, web, data, docs, code — whatever you crystallize as skills

This is the full integration blueprint. Build it in order, test each step, and you'll have something that looks like actual employees running autonomously.