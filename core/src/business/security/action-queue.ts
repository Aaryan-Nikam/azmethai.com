import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export type QueuedActionStatus = 'pending' | 'approved' | 'rejected' | 'executed';

export interface QueuedAction {
    id: string;
    profileId: string;
    toolName: string;
    toolInput: any;
    reasoning: string; // The LLM's explanation of why it wants to perform this action
    status: QueuedActionStatus;
    createdAtMs: number;
}

/**
 * ActionQueueManager
 * 
 * Manages the batch queue for "Medium Risk" actions. 
 * Instead of halting the agent immediately (like High Risk checkpoints), 
 * Medium Risk actions are pushed to this queue. The agent receives a mocked success 
 * and continues working. The human reviews this queue at the end of the day.
 */
export class ActionQueueManager {
    private storageDir: string;

    constructor(customDir?: string) {
        // Ready for Supabase migration in the future
        this.storageDir = customDir || path.join(os.homedir(), '.azmeth', 'queues');
    }

    private async ensureDir() {
        await fs.mkdir(this.storageDir, { recursive: true });
    }

    private getQueuePath(): string {
        return path.join(this.storageDir, 'pending_actions.json');
    }

    async getQueue(): Promise<QueuedAction[]> {
        await this.ensureDir();
        try {
            const data = await fs.readFile(this.getQueuePath(), 'utf8');
            return JSON.parse(data) as QueuedAction[];
        } catch (e) {
            return [];
        }
    }

    private async saveQueue(queue: QueuedAction[]): Promise<void> {
        await this.ensureDir();
        await fs.writeFile(this.getQueuePath(), JSON.stringify(queue, null, 2), 'utf8');
    }

    /**
     * Enqueues an action and returns its ID.
     */
    async enqueueAction(profileId: string, toolName: string, toolInput: any, reasoning: string = ''): Promise<string> {
        const queue = await this.getQueue();
        const newAction: QueuedAction = {
            id: crypto.randomUUID(),
            profileId,
            toolName,
            toolInput,
            reasoning,
            status: 'pending',
            createdAtMs: Date.now()
        };
        queue.push(newAction);
        await this.saveQueue(queue);
        return newAction.id;
    }

    /**
     * Approves an action. In the real system, this triggers the execution layer.
     */
    async updateStatus(id: string, newStatus: QueuedActionStatus): Promise<void> {
        const queue = await this.getQueue();
        const action = queue.find(a => a.id === id);
        if (action) {
            action.status = newStatus;
            await this.saveQueue(queue);
        }
    }
}
