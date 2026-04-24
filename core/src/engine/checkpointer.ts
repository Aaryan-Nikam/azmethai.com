import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

/**
 * Defines the structured payload of a suspended Azmeth Agent session.
 * This contract enables the agent to completely unload from memory (zero compute)
 * while awaiting Human-in-the-Loop approval for a high-risk action, 
 * or waiting for a slow, asynchronous tool (like a webhook) to finish.
 */
export interface AgentCheckpoint {
    runId: string;
    profileId: string; // The Employee Profile assuming this task
    status: 'paused_approval' | 'paused_async';
    // The specific action the agent was attempting when it was paused
    pendingAction: {
        toolName: string;
        toolInput: any;
        requiresApproval: boolean;
    };
    // The raw message history so the ReAct loop can seamlessly resume
    // as if it never stopped thinking.
    historySnapshot: any[]; // Anthropic.MessageParam[] or OpenAI.ChatCompletionMessageParam[]
    createdAtMs: number;
}

export class Checkpointer {
    private storageDir: string;

    constructor(customDir?: string) {
        // By default, store checkpoints in a safe local temp/app data directory
        // In full production, this would serialize directly into the Supabase database.
        this.storageDir = customDir || path.join(os.homedir(), '.azmeth', 'checkpoints');
    }

    private async ensureDir() {
        await fs.mkdir(this.storageDir, { recursive: true });
    }

    private getCheckpointPath(runId: string): string {
        return path.join(this.storageDir, `${runId}.json`);
    }

    /**
     * Serializes the active agent state to disk and halts its memory footprint.
     */
    async saveCheckpoint(checkpoint: AgentCheckpoint): Promise<void> {
        await this.ensureDir();
        const filePath = this.getCheckpointPath(checkpoint.runId);
        await fs.writeFile(filePath, JSON.stringify(checkpoint, null, 2), 'utf8');
    }

    /**
     * Rehydrates a sleeping agent session back into active memory.
     */
    async loadCheckpoint(runId: string): Promise<AgentCheckpoint | null> {
        try {
            const filePath = this.getCheckpointPath(runId);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data) as AgentCheckpoint;
        } catch (e) {
            return null; // Return null if checkpoint doesn't exist or is corrupted
        }
    }

    /**
     * Clears a checkpoint once the agent has successfully resumed and finished its task.
     */
    async clearCheckpoint(runId: string): Promise<void> {
        try {
            const filePath = this.getCheckpointPath(runId);
            await fs.unlink(filePath);
        } catch (e) {
            // Ignore if already deleted
        }
    }
}
