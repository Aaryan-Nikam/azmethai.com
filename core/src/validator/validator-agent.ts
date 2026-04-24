import { Anthropic } from '@anthropic-ai/sdk';
import { Session } from '../types/mantis';

export interface Commit {
    commitId: string;
    agentId: string;
    sessionId: string;
    content: any;
    type: 'research' | 'creative' | 'execution' | 'analysis';
    sources?: string[];
    timestamp: number;
}

export interface ValidationResult {
    valid: boolean;
    feedback?: string;
    issues?: ValidationIssue[];
}

export interface ValidationIssue {
    type: 'grounding' | 'alignment' | 'compatibility';
    severity: 'error' | 'warning';
    message: string;
    suggestion?: string;
}

export class ValidatorAgent {
    private anthropic: Anthropic;

    constructor(apiKey: string) {
        this.anthropic = new Anthropic({ apiKey });
    }

    async validate(
        commit: Commit,
        session: Session
    ): Promise<ValidationResult> {

        const issues: ValidationIssue[] = [];

        const groundingIssues = await this.checkGrounding(commit);
        issues.push(...groundingIssues);

        const alignmentIssues = await this.checkAlignment(commit, session);
        issues.push(...alignmentIssues);

        const compatibilityIssues = await this.checkCompatibility(commit, session);
        issues.push(...compatibilityIssues);

        const errors = issues.filter(i => i.severity === 'error');
        const valid = errors.length === 0;

        let feedback: string | undefined;
        if (!valid) {
            feedback = this.generateFeedback(commit, errors);
        }

        return { valid, feedback, issues };
    }

    private async checkGrounding(commit: Commit): Promise<ValidationIssue[]> {
        const issues: ValidationIssue[] = [];

        if (!commit.sources || commit.sources.length === 0) {
            issues.push({
                type: 'grounding',
                severity: 'warning',
                message: 'No sources provided for this commit',
                suggestion: 'Add sources to support factual claims'
            });
        }

        const response = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: 'You are a fact-checker. Identify any factual claims that are not supported by the provided sources.',
            messages: [{
                role: 'user',
                content: `
Content: ${JSON.stringify(commit.content)}
Sources: ${commit.sources?.join(', ') || 'None'}

Are there any factual claims in the content that are NOT supported by the sources?
List each unsupported claim.
        `
            }]
        });

        const contentText = response.content[0].type === 'text' ? response.content[0].text : '';
        const ungroundedClaims = this.parseUngroundedClaims(contentText);

        for (const claim of ungroundedClaims) {
            issues.push({
                type: 'grounding',
                severity: 'error',
                message: `Ungrounded claim: "${claim}"`,
                suggestion: 'Provide source or remove claim'
            });
        }

        return issues;
    }

    private async checkAlignment(commit: Commit, session: Session): Promise<ValidationIssue[]> {
        const issues: ValidationIssue[] = [];
        const currentGoal = session.currentGoal;
        if (!currentGoal) return issues;

        const response = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 500,
            system: 'You are an alignment checker. Determine if work output serves the stated goal.',
            messages: [{
                role: 'user',
                content: `
Goal: ${currentGoal}
Output: ${JSON.stringify(commit.content)}

Does this output directly serve the goal?
If not, explain the misalignment.
        `
            }]
        });

        const contentText = response.content[0].type === 'text' ? response.content[0].text : '';
        const text = contentText.toLowerCase();

        if (text.includes('does not serve') || text.includes('misaligned')) {
            issues.push({
                type: 'alignment',
                severity: 'error',
                message: 'Output does not align with current goal',
                suggestion: this.extractAlignmentSuggestion(contentText)
            });
        }

        return issues;
    }

    private async checkCompatibility(commit: Commit, session: Session): Promise<ValidationIssue[]> {
        const issues: ValidationIssue[] = [];
        const verifiedContext = session.verifiedContext.getAll();
        if (verifiedContext.length === 0) return issues;

        const response = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: 'You are a contradiction detector. Find conflicts between new output and existing verified context.',
            messages: [{
                role: 'user',
                content: `
Existing Verified Context:
${verifiedContext.map(c => JSON.stringify(c)).join('\n')}

New Output:
${JSON.stringify(commit.content)}

Are there any contradictions between the new output and existing context?
        `
            }]
        });

        const contentText = response.content[0].type === 'text' ? response.content[0].text : '';
        const text = contentText.toLowerCase();
        if (text.includes('contradiction') || text.includes('conflicts with')) {
            issues.push({
                type: 'compatibility',
                severity: 'error',
                message: 'Output contradicts existing verified context',
                suggestion: 'This requires orchestrator arbitration'
            });
        }

        return issues;
    }

    private generateFeedback(commit: Commit, errors: ValidationIssue[]): string {
        const feedback = [`Commit ${commit.commitId} rejected. Issues found:\n`];
        for (const error of errors) {
            feedback.push(`- [${error.type}] ${error.message}`);
            if (error.suggestion) {
                feedback.push(`  Suggestion: ${error.suggestion}`);
            }
        }
        feedback.push('\nPlease revise and resubmit.');
        return feedback.join('\n');
    }

    private parseUngroundedClaims(llmOutput: string): string[] {
        const lines = llmOutput.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'));
        return lines.map(l => l.replace(/^[-•]\s*/, '').trim());
    }

    private extractAlignmentSuggestion(llmOutput: string): string {
        const match = llmOutput.match(/suggest(?:ion)?:?\s*(.+)/i);
        return match ? match[1].trim() : 'Refocus on the current goal';
    }
}
