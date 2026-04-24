import { Session } from '../types/mantis';
import { Commit, ValidationIssue } from './validator-agent';

/**
 * Extracted Alignment Checker logic.
 * Currently integrated within ValidatorAgent for simplicity as per implementation guide.
 */
export async function checkAlignment(commit: Commit, session: Session): Promise<ValidationIssue[]> {
    throw new Error('Not implemented. See ValidatorAgent.checkAlignment');
}
