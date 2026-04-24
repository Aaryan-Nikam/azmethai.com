# Azmeth + Builder Fusion Architecture

## Goal

Build Azmeth as the orchestrator brain of the platform without modifying Builder's source code.

In this design:

- `Azmeth` is the planner, coordinator, memory owner, and operator interface.
- `Builder` is the execution engine for code, tool creation, workflow generation, and file-level implementation.
- The `app itself` is the workspace/sandbox.
- A `harness` around Azmeth provides multi-agent coordination, persistent context, observability, and recovery.

This follows a compound-AI pattern instead of a single-model pattern.

## Core Decisions

### 1. Builder stays immutable

We do not fork or customize Claude Code internals.

Builder should be treated as a black-box execution runtime behind a stable boundary:

- CLI process
- local sidecar service
- session-based runner

That preserves Builder performance, upgradeability, and behavior.

### 2. Azmeth wraps Builder, not the other way around

Azmeth should decide:

- what problem to solve
- how to break it into tasks
- which agents to spawn
- what context each agent receives
- when Builder should be invoked
- how results are validated and merged

Builder should focus on:

- reading the workspace
- editing code
- generating tools
- creating workflow artifacts
- executing scoped implementation tasks

### 3. The app is the sandbox

There should not be a separate product concept called sandbox.

The Azmeth platform itself is the workspace:

- app pages
- data systems
- connectors
- tools
- workflows
- logs
- previews
- runtime state

The user can open agent and app in separate windows, but the default experience should be combined.

## Research-Grounded Principles

This design is based on a mix of:

- Databricks compound-AI guidance
- Databricks tracing/evaluation patterns
- OpenClaw's local architecture already present in this repo
- Replit's integrated workspace UX

### What Databricks suggests that matters here

From Databricks docs and technical writing:

- compound AI systems outperform single-model systems by combining multiple interacting components
- model choice matters less once the system is decomposed into specialized steps
- production agents need tracing, evaluation, root-cause analysis, and monitoring
- high-trust systems rely on structured context, knowledge stores, clarification loops, and quality benchmarks

Applied to Azmeth, that means:

- do not make Builder the whole product
- make Azmeth a system that uses Builder, app tools, memory, evaluation, and orchestration together
- instrument every run
- benchmark real tasks before trusting autonomy

## Proposed System Layers

```text
┌────────────────────────────────────────────────────────────┐
│                     Azmeth Workspace UI                    │
│ app + agent combined by default, detachable when needed   │
├────────────────────────────────────────────────────────────┤
│                    Azmeth Harness Layer                    │
│ orchestration | memory | routing | tracing | recovery     │
├────────────────────────────────────────────────────────────┤
│                  Azmeth Orchestrator Brain                 │
│ planner | delegator | validator | app operator            │
├────────────────────────────────────────────────────────────┤
│                  Execution Adapters Layer                  │
│ Builder adapter | app-control adapter | MCP/tool adapter  │
├────────────────────────────────────────────────────────────┤
│                    Runtime Backends                        │
│ Builder sessions | app APIs | DB | MCP servers | browser  │
└────────────────────────────────────────────────────────────┘
```

## Azmeth Harness

The harness is the difference between "an agent that can do things" and "a reliable product system."

### Harness responsibilities

#### 1. Task graph manager

Turns one user goal into:

- a parent objective
- ordered subtasks
- parallelizable work units
- dependency edges
- completion criteria

#### 2. Session and lane manager

Maintains:

- one parent run
- child agent runs
- Builder session IDs per lane
- cancellation state
- resume state

Builder should be warm and stateful where possible, not cold-started for every tiny action.

#### 3. Context assembler

Builds the exact working context for each delegated run:

- user intent
- current screen/app state
- selected systems
- prior run summary
- relevant files
- memory snapshots
- permissions and constraints

This is where Azmeth becomes smarter than a plain chat wrapper.

#### 4. Memory manager

Owns persistent memory outside Builder:

- user profile and preferences
- product architecture memory
- active task memory
- system inventory
- connector state
- historical fixes
- reusable build recipes

Builder can have its own transcript/session memory, but Azmeth should own long-lived operational memory.

#### 5. Reliability manager

Classifies failures into buckets:

- context failure
- tool failure
- permission failure
- external dependency failure
- Builder reasoning loop failure
- validation mismatch

Then chooses a response:

- retry same lane
- retry with narrower context
- replan
- escalate to user
- hand off to another specialist agent

#### 6. Trace and evaluation manager

Every run should emit:

- user goal
- plan
- spawned agents
- Builder invocations
- tool calls
- app actions
- validations
- errors
- final artifact outputs

This is the Databricks lesson that matters most operationally: traces are not optional.

## Builder Integration Pattern

## Recommended rule

Builder should only be accessed through an adapter owned by Azmeth.

### Builder adapter contract

The adapter should expose a narrow interface like:

```ts
type BuilderTask = {
  laneId: string;
  sessionId?: string;
  objective: string;
  context: string;
  allowedTools?: string[];
  cwd?: string;
};

type BuilderResult = {
  sessionId: string;
  status: "ok" | "needs_input" | "error" | "aborted";
  summary: string;
  trace: Array<Record<string, unknown>>;
  artifacts: string[];
  followupQuestion?: string;
};
```

### Why this matters

This keeps Builder:

- replaceable
- benchmarkable
- replayable
- isolated from product orchestration logic

It also prevents app logic from leaking into Builder internals.

## Multi-Agent Model

The correct pattern is not "one super-agent does everything."

The correct pattern is:

- Azmeth as lead orchestrator
- specialist child agents for bounded tasks
- Builder used by child agents when implementation is required

### Suggested agent roles

- `Planner Agent`
  - decomposes objective
  - determines parallel lanes

- `App Operator Agent`
  - navigates the Azmeth app
  - reads system state
  - invokes native app actions

- `Builder Worker Agent`
  - uses Builder for code and tool creation
  - scoped to a file/module/task

- `Connector Agent`
  - manages MCP servers, external APIs, auth checks, connector state

- `Validator Agent`
  - checks output against acceptance criteria
  - compares plan vs delivered result

- `Recovery Agent`
  - handles failed runs, retries, fallback paths, repair plans

### Delegation rule

Only Azmeth should own top-level planning and merge decisions.

Child agents should never compete for final authority.

## App Control Strategy

Since the app is the workspace, Azmeth needs first-class access to app operations.

That means we should expose app-native capabilities as tools, not as UI hacks.

### App-native tool groups

- navigation tools
- data query tools
- workflow creation tools
- connector management tools
- system configuration tools
- deployment tools
- observability tools

### Important boundary

If an action can be done through a stable server action or API, use that.

Only use UI-driving behavior for actions that truly require visual interaction.

## MCP and Tool Architecture

MCP should be treated as an expandable capability layer under Azmeth control.

### Design

- Azmeth owns the MCP registry
- connectors are declared capabilities
- each tool has:
  - auth requirements
  - scope
  - rate limits
  - safety policy
  - observability hooks

### Practical rule

Azmeth decides whether to call:

- native app tool
- MCP tool
- Builder lane
- human clarification

That routing should happen in the harness, not ad hoc in prompts.

## Clarification and Human-in-the-Loop

Azmeth should be able to pause cleanly and ask the user for:

- API keys
- approval
- ambiguous business rules
- missing target system selection
- destructive action confirmation

### Correct UX behavior

- pause the exact lane
- preserve state
- show what is blocked
- ask one precise question
- resume from the same step when the answer arrives

This should feel continuous, not like restarting the task.

## Persistent Context Design

There should be three memory layers.

### 1. Run memory

Short-lived per task:

- current plan
- current lane state
- recent observations

### 2. Workspace memory

Persistent for this app/workspace:

- architecture map
- known systems
- recent build artifacts
- connector inventory
- recurring issues

### 3. User memory

Persistent across runs:

- preferences
- organization details
- tone and workflow choices
- commonly used systems

This matches the Databricks-style idea of a knowledge store plus traces plus evaluation feedback.

## Observability and Evaluation

Every agentic system that will face clients needs measurable quality loops.

### Minimum observability objects

- `run`
- `step`
- `tool_call`
- `builder_invocation`
- `app_action`
- `clarification`
- `validation_result`
- `error`

### Minimum quality metrics

- task success rate
- retry rate
- clarification rate
- Builder failure rate
- loop detection rate
- validation pass rate
- mean time to recovery

### Evaluation sets

We should maintain benchmark tasks for:

- build a tool
- create workflow
- modify system safely
- connect MCP server
- recover from failing step
- ask user for missing secret

This is directly aligned with Databricks' emphasis on evaluation sets, root-cause analysis, and production traces.

## Replit-Inspired UI Direction

We should borrow the product shape, not clone visuals blindly.

### What to borrow

- workspace-first layout
- agent integrated into the workspace, not floating as a separate gimmick
- live preview / live app state beside agent work
- console/logs as first-class
- agent can inspect logs and use them for debugging
- plan mode before destructive build actions
- realtime progress/timeline while agent works

### Default layout

```text
┌────────────────────────────────────────────────────────────┐
│ Top bar: project | environment | run state | share | mode │
├───────────────┬────────────────────────────┬───────────────┤
│ left rail     │ main workspace             │ right rail     │
│ app map       │ app page / editor / preview│ Azmeth agent   │
│ tools         │ current system             │ plan/timeline   │
│ connectors    │                            │ console/logs    │
├───────────────┴────────────────────────────┴───────────────┤
│ bottom panel: logs | tasks | traces | terminal | artifacts│
└────────────────────────────────────────────────────────────┘
```

### Windowing rule

- default: combined workspace
- optional: pop out agent window
- optional: pop out app window

But the mental model remains one workspace.

## Implementation Roadmap

### Phase 1

- freeze Builder as an external runtime boundary
- create `BuilderAdapter`
- create `AzmethHarness`
- add run/trace schemas
- add pause/resume clarification protocol

### Phase 2

- create agent role registry
- spawn child lanes for specialist tasks
- add persistent workspace memory
- add validation layer for Builder outputs

### Phase 3

- expose app-native tools for all major systems
- add MCP registry and policy layer
- add recovery strategies and retry classifier

### Phase 4

- move UI to workspace-first combined layout
- add timeline, console, artifacts, plan mode
- support detachable agent/app windows

## Recommended File Ownership

To keep the implementation clean, the new architecture should likely live in new folders rather than being mixed directly into Builder code:

- `frontend/src/core/azmeth-harness/`
- `frontend/src/core/builder-adapter/`
- `frontend/src/core/runtime-tracing/`
- `frontend/src/core/memory/`
- `frontend/src/core/app-tools/`
- `frontend/src/core/mcp/`

## Sources

Databricks:

- https://docs.databricks.com/aws/en/ai-bi/concepts
- https://docs.databricks.com/aws/en/genie
- https://docs.databricks.com/aws/en/generative-ai/guide/gen-ai-capabilities
- https://docs.databricks.com/aws/en/generative-ai/agent-evaluation
- https://docs.databricks.com/gcp/en/mlflow3/genai/tracing/prod-tracing
- https://community.databricks.com/t5/technical-blog/models-don-t-matter-building-compound-ai-systems-with-dspy-and/ba-p/75729

Replit:

- https://docs.replit.com/core-concepts/workspace
- https://docs.replit.com/core-concepts/agent
- https://docs.replit.com/core-concepts/workspace/editor-and-tools/console
- https://blog.replit.com/agent-v2

Local repo references:

- `core/docs/concepts/agent-workspace.md`
- `core/docs/concepts/multi-agent.md`
- `core/docs/concepts/agent-loop.md`
- `claude-engine/node_modules/@anthropic-ai/claude-code/README.md`
