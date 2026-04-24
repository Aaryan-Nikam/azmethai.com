# MANTIS — Agentic Platform — System Architecture Document

**Version 1.0 | Confidential | For Engineering Use**

**B2B SaaS Vertical | Hybrid Agency + Autonomous Agent Model**

---

## 1. Executive Summary

Mantis is an agentic automation platform that enables a single Creative Expert (human) to operate at the capacity of a 10-person growth team. The platform combines a multi-agent AI orchestration layer with a visual workflow canvas, a structured commit-validate-publish communication protocol, and a verified intelligence store that compounds over time.

The target vertical for v1 is B2B SaaS companies that need to run and optimise a full growth motion: paid acquisition, outbound sales, content assistance, CRM management, and analytics — all coordinated through one platform.

### Core Value Proposition

> Agents execute. Creative Expert directs. Everything verified before it becomes truth. Every campaign makes the next one smarter.

---

## 2. System Overview

### 2.1 What Mantis Is

Mantis is not a SaaS tool. It is not a traditional agency. It is a **hybrid model** where:

- **AI Expert Agents** execute all repetitive, data-driven, and API-dependent work autonomously
- A **Creative Expert** (human) acts as a Director — approving directions, selecting ideas, pointing agents toward the right approach
- An **Orchestrator Agent** coordinates the full workflow, assigns tasks to the right experts, and arbitrates conflicts
- A **Validator Agent** sits as a quality gate, ensuring nothing enters the shared knowledge base without verification
- A **Visual Canvas** gives the client real-time visibility into every step of the workflow

### 2.2 The Hybrid Agency Model

Creative work (ad copy, creative direction, campaign angles) always passes through the Creative Expert before being published. The Creative Expert's role is specifically:

- Approving the right ideas from agent-generated options
- Pointing agents in the correct direction when output is misaligned
- Injecting brand voice, strategic judgment, and B2B buyer intuition
- **NOT** doing production work — the agent does the execution

> **Key Insight:** The Creative Expert shifts from *doing* to *directing*. One expert handling 10-15 clients instead of 1-2. Agents provide the leverage.

---

## 3. Core Architecture

### 3.1 The Five-Layer System

| Layer | Component | Role | Model Tier |
| :--- | :--- | :--- | :--- |
| 1 | Orchestrator Agent | Strategic planning, task assignment, conflict arbitration | Claude Opus (called once per workflow) |
| 2 | Validator Agent | Quality gate, commit review, alignment checking, conflict detection | Claude Sonnet (called per commit) |
| 3 | Expert Agents (5) | Domain-specific execution using hardcoded tools | Claude Haiku / Sonnet |
| 4 | Creative Expert (Human) | Direction, approval, brand judgment | Human — Director role |
| 5 | Canvas + Shared Context | Visual workflow, verified knowledge base, client view | Infrastructure layer |

### 3.2 The Commit-Validate-Publish Protocol

This is the core communication protocol that prevents hallucination cascades and maintains data integrity across all agents. **No information becomes shared truth until it has been validated.**

#### Three Agent States

- **Working** — Agent is executing its task. Output is invisible to all other agents.
- **Staged** — Agent has completed work and submitted a commit. Visible to Validator only.
- **Published** — Validator has approved the commit. Visible to all agents and client canvas.

#### What Gets Checked on Every Commit

- **Grounded**: Can every factual claim be traced to a real source (tool output, API data, website content)? Ungrounded claims are rejected immediately.
- **Aligned**: Does this output serve the current campaign goal? Accurate but misaligned work is rejected with direction to refocus.
- **Compatible**: Does this contradict anything already in verified context? Contradictions are flagged and escalated to the Orchestrator for arbitration.

#### Validator Feedback Quality

When a commit is rejected, the feedback message **is** the direction. It must be specific and actionable — not vague.

> ❌ **Bad Rejection:** *"This doesn't look right. Please redo."*
>
> ✅ **Good Rejection:** *"ICP claim states 45-55 manufacturing executives but website content is B2B SaaS with $49/month pricing. This audience does not match the product. Re-analyse focusing on company size, tech adoption signals, and job titles in the pricing page testimonials."*

### 3.3 Escalation Paths

The Validator handles 90% of commits autonomously. It escalates to the Orchestrator only in two situations:

1. A new commit directly **contradicts** verified context already published — this requires strategic arbitration, not just quality checking.
2. The same agent **fails validation three times** on the same task — signals the agent is stuck or fundamentally misaligned. Orchestrator reassigns or reframes.

The Orchestrator escalates to a human (Creative Expert or client) only when:

- A creative decision requires brand judgment that agents cannot make
- A conflict cannot be resolved with available data
- A high-stakes irreversible action is about to be taken (e.g. budget over threshold, public-facing launch)

### 3.4 Usage & Cost Tracking (Billing Infrastructure)

**Crucial:** The platform operates on a "Rent + Usage" model. Every action must be metered.

- **UsageTracker Module**: A centralized service that intercepts every LLM call, API request, and scraping job.
- **Granularity**: Tracks costs per Client > Campaign > Agent > Task.
- **Metrics Tracked**:
  - LLM Tokens (Input/Output per model via OpenRouter)
  - Scraper Units (Apify Compute Units)
  - Enrichment Credits (3rd Party API costs)
  - Premium Intent Signals
- **Enforcement**: Agents check budget before high-cost actions (e.g. "Do not scrape 10k leads if budget < $50").

---

## 4. Agent Specifications

### Agency & "Unhinged" Mode
Agents are designed to be **resourceful**. If an agent identifies a clearer path to a goal using a specific tool or API, it is enabled to "go and get it" (within budget). This means the Tool Registry supports dynamic tool selection, not just hardcoded lists.

### 4.1 Orchestrator Agent

| Property | Detail |
| :--- | :--- |
| Role | Strategic planner and conflict arbitrator |
| Model | **OpenRouter** (Claude 3 Opus / GPT-4) |
| Knows | Full client goal, strategic plan, all published verified context, escalations from Validator |
| Does NOT know | Staged commits, agent working state, Validator internal reasoning |
| Primary job | Decompose client goal into expert assignments with dependencies and approval gates |
| Escalation trigger | Validator conflict escalation, or agent fails 3 times on same task |

#### Orchestrator Output Structure

- Required expert agents for this goal
- Execution order with explicit dependencies between tasks
- Which tasks can run in parallel
- Approval gate positions (where human review is required)
- Context each agent needs from other agents' outputs

### 4.2 Validator Agent

| Property | Detail |
| :--- | :--- |
| Role | Quality gate and alignment enforcer |
| Model | **OpenRouter** (Claude 3.5 Sonnet) — called on every agent commit |
| Knows | Full campaign goal (always), all published verified context, current commit under review, staged commits from other agents (for conflict detection only) |
| Priority system | High-dependency commits (many agents waiting on this) jump the queue over low-dependency commits |
| Outputs | Approve and publish / Reject with specific feedback / Escalate conflict to Orchestrator |

### 4.3 Expert Agents

Expert Agents are **resourceful specialists**. They largely use fixed tools but can request standard utility access (Scraping, Enrichment) dynamically.

#### Growth Agent

| Property | Detail |
| :--- | :--- |
| Domain | Paid acquisition — LinkedIn Ads, Google Ads, Facebook Ads |
| Model | **OpenRouter** (Claude 3 Haiku / Sonnet) |
| Tools | **Apify** (General Scraping), FB Ad Library Scraper (Custom), LinkedIn Marketing API, DALL-E |
| Capabilities | ICP research, competitor ad analysis, campaign creation, creative generation, budget management, performance optimisation, A/B testing |
| Hard limits | Cannot handle accounts over $50k/month without human oversight. Cannot navigate platform policy violations autonomously. |
| Failure handling | Known errors use deterministic fixes. Unknown errors escalate to Creative Expert immediately. |

#### Outbound Agent

| Property | Detail |
| :--- | :--- |
| Domain | Top-of-funnel outbound sales |
| Model | **OpenRouter** (Claude 3 Haiku) |
| Tools | **Enrichment APIs** (Email finding/verification), **Intent Signals** (3rd party), LinkedIn Sales Navigator, Email sending infrastructure |
| Capabilities | Lead list building, prospect research, personalised outreach copy, email sequence management, meeting booking |
| Hard limit | Explicit handoff point: when a prospect replies or books a meeting, agent stops and flags for human sales rep. Agent does not handle live sales conversations. |
| Failure handling | Reply handling flagged to human immediately. No autonomous response to prospect replies. |

#### Content Agent

| Property | Detail |
| :--- | :--- |
| Domain | Content production assistance — does NOT own content, assists human |
| Model | Claude Sonnet |
| Tools | SEO tools (Ahrefs / Semrush API), CMS integration, Social scheduling tools, Web research |
| Capabilities | Topic research, SEO opportunity analysis, first draft generation, content calendar management, distribution scheduling |
| Hard limit | Cannot produce publish-ready B2B thought leadership without human editing. Works WITH Creative Expert, not instead of them. |
| Failure handling | All content drafts go through Creative Expert before publishing — this is not optional. |

#### CRM Agent

| Property | Detail |
| :--- | :--- |
| Domain | Pipeline intelligence and CRM hygiene |
| Model | Claude Haiku |
| Tools | HubSpot API / Salesforce API, Data enrichment tools, Reporting and visualisation |
| Capabilities | Data hygiene maintenance, deal stage tracking, stalled deal alerts, pipeline report generation, won/lost pattern analysis |
| Hard limit | Requires clean CRM data to function. Performs a data quality check before processing. Cannot make sales strategy decisions. |
| Failure handling | Data quality failures flagged to human before processing begins. |

#### Analytics Agent

| Property | Detail |
| :--- | :--- |
| Domain | Cross-channel performance intelligence |
| Model | Claude Sonnet |
| Tools | Read access to all data sources (ads platforms, CRM, email, product analytics) |
| Capabilities | Data aggregation across all channels, anomaly detection, performance report generation, optimisation recommendations, churn risk identification |
| Hard limit | Does not execute campaigns or changes. Reads and reports only. Strategic interpretation requires human review before client presentation. |
| Failure handling | Missing data source flagged. Partial reports clearly marked as incomplete. |

---

## 5. Shared Context and Memory

### 5.1 What Shared Context Is

The Shared Context is the single source of truth for the current workflow. It contains **only published, verified commits**. Agents read from it freely. Nothing enters it without passing the Validator.

### 5.2 What Each Agent Can Access

| Agent | Reads | Cannot Read |
| :--- | :--- | :--- |
| Orchestrator | Full published context, all escalations | Staged commits, agent working state |
| Validator | Published context, all staged commits (conflict detection) | Agent working state |
| Expert Agents | Published context relevant to their task only | Other agents' staged or working state |
| Creative Expert | Published context, their own review queue | Agent working or staged state |
| Client (Canvas) | Published context only — clean view | Everything internal |

### 5.3 Long-Term Verified Intelligence Store

Every published commit is stored permanently as verified client intelligence. This is not a log — it is a growing knowledge base about the client's business that compounds across campaigns.

- **Campaign 1** produces: verified ICP, competitor landscape, brand voice, what creatives worked, which audiences converted
- **Campaign 2** starts with that context already loaded. Research Agent begins 60% complete.
- **Campaign 5**: Mantis knows this client deeply. Campaigns improve in accuracy and speed with every cycle.

### 5.4 Temporal Decay in Memory Recall

- Exponential decay applied to all historical recall results
- Half-life of approximately 30 days for marketing strategy data
- Structural data (ICP, brand voice) decays slower than tactical data (ad copy, bid strategies)

---

## 6. The Visual Canvas

### 6.1 What the Client Sees

| Canvas Element | What It Shows |
| :--- | :--- |
| Agent Nodes | Each expert agent as a node with status: Pending / Running / Complete / Waiting for Approval |
| Edge Connections | Data flow between agents — which outputs feed which inputs |
| Verified Context Panel | Live list of all published verified commits |
| Validator Status | Last validated commit, currently reviewing, queue length |
| Artifact Preview | Generated creatives, reports, copy variations shown inline |
| Approval Gates | Interactive approval UI — appears when human review is required |

### 6.2 The Detailed View Toggle

Operators see: Validator rejection history, commit queue, Orchestrator decisions, error logs.

### 6.3 Node Streaming

Running nodes can stream: live logs, thinking steps, progress %, artifacts as generated.

---

## 7. Error Handling and Failure Protocol

### 7.1 Principles

- **Fail fast.** Do not improvise with LLM-generated code.
- Known errors use **deterministic fixes** — hardcoded, tested, zero LLM cost.
- Unknown errors **escalate to humans immediately**.
- **No synthetic tool creation.**

### 7.2 Error Classification

| Error Type | Response | LLM Cost |
| :--- | :--- | :--- |
| Transient (timeout, network) | Retry with exponential backoff | Zero |
| Rate limit | Wait for retry-after header, then retry | Zero |
| Auth failure | Refresh credentials, retry once | Zero |
| Known tool failure | Hardcoded fix from known-fixes registry | Zero |
| Unknown error | Log, flag to human, stop task | Zero |
| Missing tool | Log, escalate to product team | Zero |
| Data quality failure | Flag to human before processing | Zero |
| Validation failure (3x) | Escalate to Orchestrator for reassignment | One Orchestrator call |

---

## 8. Build Order

### Phase 1 — Core Expert Agents

| Priority | Component | Why First |
| :--- | :--- | :--- |
| 1 | Growth Agent | Most measurable (ROAS), most API-driven, clearest value proposition |
| 2 | Validator Agent | Required before any multi-agent coordination can work |
| 3 | Shared Context Store | Infrastructure that all agents read from |
| 4 | Outbound Agent | High-value capability, strong client demand |
| 5 | Analytics Agent | Reads from all other agents — build last |

### Phase 2 — Orchestration Layer
### Phase 3 — Creative Expert Interface
### Phase 4 — Intelligence Compounding

---

## 9. Cost and Model Tier Strategy

| Tier | Model | When Used |
| :--- | :--- | :--- |
| Level 1 | Claude Haiku / GPT-3.5 | Low-risk, routine execution |
| Level 2 | Claude Sonnet | Medium-risk, quality-sensitive work |
| Level 3 | Claude Opus | High-risk, strategic decisions only |

| Metric | Value |
| :--- | :--- |
| Total cost per client | $1,300 - $2,150/mo |
| Target client retainer | $8,000 - $15,000/mo |
| **Target gross margin** | **75 - 83%** |

---

## 10. Explicit Non-Goals for v1

- Google Ads and LinkedIn Ads (Facebook only for v1)
- Rolling horizon dynamic replanning
- Synthetic tool creation
- Multi-model agent improvisation
- Tree-of-thoughts on routine decisions
- Horizontal vertical support (B2B SaaS only)
- Self-modifying agent behaviour

---

*Mantis Platform — System Architecture Document v1.0 — Confidential*
