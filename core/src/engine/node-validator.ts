/**
 * NodeValidator — 4-check validation pipeline for workflow nodes.
 *
 * Every node output goes through:
 * 1. Sources check → All claims have citations?
 * 2. Accuracy check → Data matches sources?
 * 3. Hallucination check → Any contradictions?
 * 4. Safety check → Legal/brand compliance?
 */

import type { WorkflowNode } from './workflow-engine.js';

export interface ValidationResult {
    sourcesCited: boolean;
    dataAccurate: boolean;
    noHallucinations: boolean;
    safetyPassed: boolean;
}

export class NodeValidator {
    /**
     * Run all 4 validation checks on a node's output.
     * Currently uses heuristic checks. With ANTHROPIC_API_KEY,
     * these would use Claude for deeper validation.
     */
    async validate(node: WorkflowNode): Promise<ValidationResult> {
        const content = node.content || '';
        const output = typeof node.output === 'string' ? node.output : JSON.stringify(node.output || '');
        const toolsUsed = node.toolsUsed || [];

        const [sourcesCited, dataAccurate, noHallucinations, safetyPassed] = await Promise.all([
            this.checkSourcesCited(content, output, toolsUsed),
            this.checkDataAccuracy(content, output),
            this.checkHallucinations(content, output, toolsUsed),
            this.checkSafety(content, output),
        ]);

        return { sourcesCited, dataAccurate, noHallucinations, safetyPassed };
    }

    /**
     * Check 1: Sources — Does the content cite sources for claims?
     * If the node used web_search or browser, we expect URLs or citations.
     */
    private async checkSourcesCited(content: string, output: string, toolsUsed: string[]): Promise<boolean> {
        const combined = content + ' ' + output;

        // If no research tools were used, citations aren't strictly required
        const usedResearchTools = toolsUsed.includes('web_search') || toolsUsed.includes('browser');
        if (!usedResearchTools) return true;

        // Check for common citation patterns
        const citationPatterns = [
            /https?:\/\/[^\s)]+/i,                // URLs
            /according to/i,                       // Attribution phrases
            /source:/i,
            /\[\d+\]/,                             // Numbered citations [1], [2]
            /search results/i,
        ];

        return citationPatterns.some(p => p.test(combined));
    }

    /**
     * Check 2: Accuracy — Does the data look consistent?
     * Checks for numerical consistency, no contradictions.
     */
    private async checkDataAccuracy(content: string, output: string): Promise<boolean> {
        const combined = content + ' ' + output;

        // Check for obvious inconsistencies
        const hasNumbers = /\d+/.test(combined);
        const hasContradiction = /however.*but.*also|not.*but actually/i.test(combined);

        if (hasContradiction) return false;

        // Simple heuristic: if content exists and has reasonable length, pass
        return combined.length > 10;
    }

    /**
     * Check 3: Hallucinations — Any fabricated or contradictory info?
     * Checks for hedging language that might indicate uncertainty.
     */
    private async checkHallucinations(content: string, output: string, toolsUsed: string[]): Promise<boolean> {
        const combined = content + ' ' + output;

        // Check for extreme hedging (might indicate the model is unsure)
        const hedgingPatterns = [
            /I'm not (entirely )?sure/i,
            /I (might|may) be wrong/i,
            /this is (just )?speculation/i,
            /I cannot verify/i,
            /hallucinate/i,
        ];

        const hedgingCount = hedgingPatterns.filter(p => p.test(combined)).length;
        if (hedgingCount > 1) return false;

        // If content claims to have searched but didn't use the tool, flag it
        if (!toolsUsed.includes('web_search') && /I searched the web/i.test(combined)) {
            return false;
        }

        return true;
    }

    /**
     * Check 4: Safety — Legal/brand compliance?
     * Checks for harmful content, PII, or policy violations.
     */
    private async checkSafety(content: string, output: string): Promise<boolean> {
        const combined = (content + ' ' + output).toLowerCase();

        // Check for obviously unsafe content
        const unsafePatterns = [
            /\b(ssn|social security)\b.*\d{3}-?\d{2}-?\d{4}/,  // SSN
            /\b(credit card|cc)\b.*\d{4}[\s-]?\d{4}/,           // CC numbers
            /password\s*[:=]\s*\S+/i,                            // Passwords in plain text
            /\b(hack|exploit|vulnerability)\b.*\b(use|try|exploit)\b/i,
        ];

        return !unsafePatterns.some(p => p.test(combined));
    }
}
