import { Commit, ValidationIssue } from './validator-agent';

/**
 * Extracted Grounding Checker logic.
 * Currently integrated within ValidatorAgent for simplicity as per implementation guide.
 */
export async function checkGrounding(commit: Commit): Promise<ValidationIssue[]> {
    throw new Error('Not implemented. See ValidatorAgent.checkGrounding');
}
