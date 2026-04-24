/**
 * ActionPolicyInterceptor
 *
 * Implements the Mantis "Sandbox" engine. Evaluates tool executions against
 * an employee's profile and returns a SafetyGuardrules object to constrain AzmethAgent.
 * Enforces the Human-in-the-Loop (HITL) checkpoints.
 */

import { EmployeeProfile } from '../employee/profile-loader.js';
import type { SafetyGuardrules } from '../../engine/azmeth-agent.js';

export class ActionPolicyInterceptor {

  // Global taxonomy of tool risk
  // In the future, this should live in a central tool registry.
  private toolRiskMap: Record<string, 'low' | 'medium' | 'high'> = {
    'browser': 'medium',      // Browser can interact with stateful authenticated pages
    'web_search': 'low',      // Read-only stateless operation
    'bash': 'high',           // Arbitrary system access
    'image_gen': 'low',
    'facebook_api': 'high',   // Mutating API
    'system.run': 'high',
    'file.delete': 'high',
    'filesystem.write': 'high'
  };

  /**
   * Generates a SafetyGuardrules policy tailored to a specific Employee Profile.
   * This dynamically shapes the sandbox boundaries before the agent runs.
   *
   * @param profile The loaded Mantis Employee Profile
   * @param allAvailableTools Array of strings representing all known tools registered in the Orchestrator
   * @returns Configured SafetyGuardrules to be fed to the core agent engine
   */
  public generateSandboxPolicy(profile: EmployeeProfile, allAvailableTools: string[]): SafetyGuardrules {
    const disallowedTools: string[] = [];
    const requireHumanInTheLoopFor: string[] = [];
    const queueForBatchReviewFor: string[] = [];

    // Evaluate every known tool against the employee's authorization level
    for (const toolName of allAvailableTools) {

      // 1. Zero-Trust Check: Is this tool strictly permitted for this employee?
      if (!profile.allowedTools.includes(toolName)) {
        disallowedTools.push(toolName);
        continue;
      }

      // 2. Risk Assessment vs Clearance
      const toolRisk = this.toolRiskMap[toolName] || 'high'; // Default unknown tools to highest risk

      // High risk tools ALWAYS require human authorization (The "Pause" Contract)
      // e.g., 'bash' commands or Mutating API requests.
      if (toolRisk === 'high') {
        requireHumanInTheLoopFor.push(toolName);
      }
      
      // Secondary check: If a low-clearance employee uses a medium-risk tool (e.g. browser),
      // we add it to the Batch Queue. The agent can continue working, but the tool action 
      // is held until the human reviews the queue at the end of the day.
      if (toolRisk === 'medium' && (profile.riskLevel === 'low')) {
        queueForBatchReviewFor.push(toolName);
      }
    }

    return {
      disallowedTools,
      requireHumanInTheLoopFor,
      queueForBatchReviewFor,
      validatorPrompt: profile.validatorPrompt,
      // Generic PII / Security heuristic blocklist
      regexBlocklist: [
        /\b(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})\b/
      ]
    };
  }
}
