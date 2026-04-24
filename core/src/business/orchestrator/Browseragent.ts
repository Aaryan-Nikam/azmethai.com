/**
 * BrowserAgent.ts
 * 
 * The core vision loop — exactly how Claude Cowork operates.
 * screenshot → Claude vision → action → repeat until goal complete.
 * 
 * Every action passes through IronPass classification before execution.
 * TaskBus routes browser-tagged tasks here automatically.
 */

import { createAnthropicAgent, createOpenAIAgent } from '../../subagents/websurfer/llm-provider.js';
import { BrowserSessionManager, ActivePage } from './BrowserSessionManagerImpl.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ActionType =
  | 'navigate'
  | 'click'
  | 'fill'
  | 'screenshot'
  | 'scroll'
  | 'wait'
  | 'extract'
  | 'done';

export interface BrowserAction {
  type: ActionType;
  selector?: string;          // CSS selector or aria label
  value?: string;             // for fill / navigate URL
  description: string;        // human-readable, for audit log
  confidence: number;         // 0-1, Claude's confidence in this action
  goalComplete: boolean;      // Claude signals when task is done
  extractedData?: unknown;    // populated when type === 'extract'
}

export interface BrowserTaskResult {
  taskId: string;
  goal: string;
  success: boolean;
  actionsExecuted: number;
  extractedData: unknown[];
  videoPath: string | null;
  auditTrail: AuditEntry[];
  error?: string;
}

export interface AuditEntry {
  timestamp: Date;
  action: BrowserAction;
  screenshotBase64?: string;  // before screenshot for audit
  approved: boolean;
  approvalReason: string;
}

export interface BrowserAgentConfig {
  maxIterations: number;      // circuit breaker — default 25
  screenshotOnEveryStep: boolean;
  saveAuditTrail: boolean;
  model: string;
}

const DEFAULT_CONFIG: BrowserAgentConfig = {
  maxIterations: 25,
  screenshotOnEveryStep: true,
  saveAuditTrail: true,
  model: 'claude-opus-4-5',
};

// ─── Risk Classification ──────────────────────────────────────────────────────

const ACTION_RISK: Record<ActionType, 'AUTO' | 'APPROVAL' | 'BLOCK'> = {
  screenshot: 'AUTO',
  navigate:   'AUTO',
  scroll:     'AUTO',
  wait:       'AUTO',
  extract:    'AUTO',
  click:      'AUTO',     // elevated to APPROVAL if selector contains 'submit', 'confirm', 'delete'
  fill:       'APPROVAL', // always requires approval — could fill credentials
  done:       'AUTO',
};

function classifyAction(action: BrowserAction): 'AUTO' | 'APPROVAL' | 'BLOCK' {
  const base = ACTION_RISK[action.type];
  
  // Elevate click risk if it looks destructive or auth-related
  if (action.type === 'click' && action.selector) {
    const dangerPattern = /submit|confirm|delete|logout|payment|checkout|purchase/i;
    if (dangerPattern.test(action.selector) || dangerPattern.test(action.description)) {
      return 'APPROVAL';
    }
  }

  // Block if value contains obvious credential patterns
  if (action.type === 'fill' && action.value) {
    const credentialPattern = /password|secret|token|api.?key/i;
    if (credentialPattern.test(action.selector || '') && action.value.length > 0) {
      return 'APPROVAL'; // not BLOCK — legit agents need to fill passwords, but require approval
    }
  }

  return base;
}

// ─── BrowserAgent ─────────────────────────────────────────────────────────────

export class BrowserAgent {
  private sessionManager: BrowserSessionManager;
  private client: (prompt: string, screenshotBase64?: string) => Promise<string>;
  private config: BrowserAgentConfig;
  private approvalCallback?: (action: BrowserAction) => Promise<boolean>;

  constructor(
    config: Partial<BrowserAgentConfig> = {},
    approvalCallback?: (action: BrowserAction) => Promise<boolean>,
  ) {
    const sessionConfig = {
      userDataDir: process.env.BROWSER_USER_DATA_DIR,
      remoteDebuggingUrl: process.env.BROWSER_REMOTE_DEBUGGING_URL ||
        (process.env.CDP_PORT ? `http://127.0.0.1:${process.env.CDP_PORT}` : undefined),
    }

    this.sessionManager = BrowserSessionManager.getInstance(sessionConfig);
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.approvalCallback = approvalCallback;

    if (process.env.OPENAI_API_KEY) {
      this.client = createOpenAIAgent(process.env.OPENAI_API_KEY);
      console.log('[BrowserAgent] Using OpenAI provider');
    } else {
      this.client = createAnthropicAgent(process.env.ANTHROPIC_API_KEY);
      console.log('[BrowserAgent] Using Anthropic provider');
    }
  }

  /**
   * Execute a browser goal end-to-end.
   * This is the entry point called by TaskBus for browser-type tasks.
   */
  async execute(taskId: string, goal: string): Promise<BrowserTaskResult> {
    await this.sessionManager.initialize();

    const activePage = await this.sessionManager.getPage(taskId);
    const auditTrail: AuditEntry[] = [];
    const extractedData: unknown[] = [];
    let iteration = 0;
    let success = false;
    let error: string | undefined;

    console.log(`[BrowserAgent] Starting task ${taskId}: "${goal}"`);

    try {
      while (iteration < this.config.maxIterations) {
        iteration++;

        // ── 1. Capture current state ──────────────────────────────────────
        const screenshotBuffer = await this.sessionManager.screenshot(activePage.id);
        const screenshotBase64 = screenshotBuffer.toString('base64');

        // ── 2. Ask Claude what to do next ─────────────────────────────────
        const action = await this.getNextAction(goal, screenshotBase64, auditTrail);

        console.log(`[BrowserAgent] Step ${iteration}: ${action.type} — ${action.description}`);

        // ── 3. Classify risk and get approval if needed ───────────────────
        const riskLevel = classifyAction(action);
        let approved = false;
        let approvalReason = '';

        if (riskLevel === 'BLOCK') {
          approvalReason = 'Action blocked by IronPass policy';
          console.warn(`[BrowserAgent] BLOCKED: ${action.description}`);
        } else if (riskLevel === 'APPROVAL') {
          if (this.approvalCallback) {
            approved = await this.approvalCallback(action);
            approvalReason = approved ? 'Human approved' : 'Human rejected';
          } else {
            // No approval callback = auto-reject high-risk actions in headless mode
            approved = false;
            approvalReason = 'No approval callback — high-risk action skipped';
            console.warn(`[BrowserAgent] High-risk action skipped (no approver): ${action.description}`);
          }
        } else {
          approved = true;
          approvalReason = 'AUTO — low risk';
        }

        // ── 4. Record audit entry ─────────────────────────────────────────
        auditTrail.push({
          timestamp: new Date(),
          action,
          screenshotBase64: this.config.saveAuditTrail ? screenshotBase64 : undefined,
          approved,
          approvalReason,
        });

        // ── 5. Execute approved action ────────────────────────────────────
        if (approved) {
          const result = await this.executeAction(activePage, action);
          if (result && action.type === 'extract') {
            extractedData.push(result);
          }
        }

        // ── 6. Check if goal is complete ──────────────────────────────────
        if (action.goalComplete) {
          success = true;
          console.log(`[BrowserAgent] Goal complete after ${iteration} steps`);
          break;
        }

        if (action.type === 'done') {
          success = true;
          break;
        }
      }

      if (iteration >= this.config.maxIterations) {
        error = `Max iterations (${this.config.maxIterations}) reached without completing goal`;
        console.warn(`[BrowserAgent] Circuit breaker triggered for task ${taskId}`);
      }

    } catch (err) {
      error = String(err);
      success = false;
      console.error(`[BrowserAgent] Task ${taskId} failed:`, err);
    }

    // ── 7. Release page and collect video ─────────────────────────────────
    const videoPath = await this.sessionManager.releasePage(activePage.id, taskId);

    return {
      taskId,
      goal,
      success,
      actionsExecuted: iteration,
      extractedData,
      videoPath,
      auditTrail,
      error,
    };
  }

  // ─── Claude Vision Call ─────────────────────────────────────────────────────

  private async getNextAction(
    goal: string,
    screenshotBase64: string,
    history: AuditEntry[],
  ): Promise<BrowserAction> {
    const recentHistory = history.slice(-5).map(e =>
      `Step: ${e.action.type} — ${e.action.description} (${e.approved ? 'executed' : 'skipped'})`
    ).join('\n');

    const prompt = [
      `You are a browser automation agent. Your goal is: "${goal}"`,
      `Recent actions taken:`,
      `${recentHistory || 'None yet — this is the first step.'}`,
      `Look at the current screenshot and decide the single next action to take.`,
      `Respond ONLY with valid JSON matching this exact schema:`,
      `{
  "type": "navigate" | "click" | "fill" | "scroll" | "wait" | "extract" | "done",
  "selector": "CSS selector or aria-label (omit for navigate/scroll/wait/done)",
  "value": "URL for navigate, text for fill, pixels for scroll (omit otherwise)",
  "description": "Human-readable description of what you're doing and why",
  "confidence": 0.0-1.0,
  "goalComplete": true | false,
  "extractedData": null | { any data you extracted from the page }
}`,
      `Rules:`,
      `- If the goal is already achieved, set type="done" and goalComplete=true`,
      `- Prefer aria-labels over CSS selectors when visible`,
      `- Never guess selectors — only use what you can clearly see in the screenshot`,
      `- If you're unsure, use type="screenshot" to re-evaluate`,
      `- Be conservative — one clear action at a time`,
    ].join('\n\n');

    const text = await this.client(prompt, screenshotBase64);

    try {
      const clean = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(clean) as BrowserAction;
    } catch (err) {
      console.warn('[BrowserAgent] LLM response parse failed, returning screenshot fallback', err);
      return {
        type: 'screenshot',
        description: 'Re-evaluating — could not parse previous response',
        confidence: 0.5,
        goalComplete: false,
      };
    }
  }

  // ─── Action Executor ────────────────────────────────────────────────────────

  private async executeAction(activePage: ActivePage, action: BrowserAction): Promise<unknown> {
    const { page } = activePage;

    switch (action.type) {
      case 'navigate':
        if (action.value) {
          await page.goto(action.value, { waitUntil: 'domcontentloaded', timeout: 15_000 });
        }
        break;

      case 'click':
        if (action.selector) {
          await page.click(action.selector, { timeout: 5_000 });
          await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
        }
        break;

      case 'fill':
        if (action.selector && action.value !== undefined) {
          await page.fill(action.selector, action.value, { timeout: 5_000 });
        }
        break;

      case 'scroll':
        await page.evaluate((pixels: number) => window.scrollBy(0, pixels), parseInt(action.value || '300'));
        break;

      case 'wait':
        await page.waitForTimeout(parseInt(action.value || '1000'));
        break;

      case 'extract':
        // Claude already extracted data — return it from the action
        return action.extractedData;

      case 'screenshot':
        // No-op — screenshot is always taken at the start of each loop
        break;

      case 'done':
        break;
    }

    return null;
  }
}

// ─── TaskBus Integration ────────────────────────────────────────────────────
// Wire this into your existing TaskBus routing:
//
// In TaskBus.ts, add to your task handler:
//   if (task.type === 'browser') {
//     const agent = new BrowserAgent({}, ironPassApprovalCallback);
//     return agent.execute(task.id, task.goal);
//   }