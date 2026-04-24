import { promises as fs } from 'fs';
import * as path from 'path';

export interface VerifiedCommit {
    commitId: string;
    agentId: string;
    type: string;
    content: any;
    sources: string[];
    timestamp: number;
    validatedBy: string; // validator agent ID
    approvedBy?: string; // expert supervisor ID (if applicable)
}

export class VerifiedContextStore {
    private commits: Map<string, VerifiedCommit> = new Map();
    private commitHistory: VerifiedCommit[] = [];

    constructor(private sessionId: string) { }

    async publish(commit: VerifiedCommit): Promise<void> {
        this.commits.set(commit.commitId, commit);
        this.commitHistory.push(commit);

        // Persist to disk
        await this.persist();
    }

    getAll(): VerifiedCommit[] {
        return this.commitHistory;
    }

    getByType(type: string): VerifiedCommit[] {
        return this.commitHistory.filter(c => c.type === type);
    }

    getLatest(type: string): VerifiedCommit | undefined {
        const commits = this.getByType(type);
        return commits[commits.length - 1];
    }

    private async persist(): Promise<void> {
        // Write to file system (similar to Azmeth session storage)
        const sessionDir = path.join(process.env.HOME || '~', '.mantis', 'sessions', this.sessionId);
        await fs.mkdir(sessionDir, { recursive: true });

        const filePath = path.join(sessionDir, 'verified-context.jsonl');
        const line = JSON.stringify(this.commitHistory[this.commitHistory.length - 1]);
        await fs.appendFile(filePath, line + '\n');
    }
}
