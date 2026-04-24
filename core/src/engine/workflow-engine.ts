/**
 * WorkflowEngine — Core execution engine for the functional node system.
 *
 * Manages a tree of WorkflowNodes. Each message from the user creates a new
 * workflow with Goal → Plan → Work → [Approval] → Output nodes.
 *
 * The engine handles:
 *  - Node creation & tree relationships
 *  - Sequential execution with tool calling
 *  - 3x retry with exponential backoff
 *  - Edit cascade (re-run downstream children)
 *  - Event broadcasting to the canvas UI
 */

import { NodeValidator, type ValidationResult } from './node-validator.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export type NodeType = 'goal' | 'plan' | 'work' | 'browser' | 'api' | 'approval' | 'output' | 'error';
export type NodeStatus = 'idle' | 'working' | 'complete' | 'failed' | 'pending_approval';

export interface WorkflowNode {
    id: string;
    type: NodeType;
    label: string;
    status: NodeStatus;
    content: string;           // Markdown content or description
    input: any;                // What was fed into this node
    output: any;               // What this node produced
    parentId: string | null;
    children: string[];        // Child node IDs
    validation: ValidationResult;
    retryCount: number;
    maxRetries: number;
    agent?: string;            // Which expert agent ran this
    toolsUsed: string[];
    error?: string;
    createdAt: number;
    updatedAt: number;
}

export interface BroadcastFn {
    (event: string, payload: any): void;
}

// ─── Engine ─────────────────────────────────────────────────────────────────

export class WorkflowEngine {
    private nodes: Map<string, WorkflowNode> = new Map();
    private broadcast: BroadcastFn;
    private sessionId: string;
    private validator: NodeValidator;
    private nodeOrder: string[] = [];   // Tracks creation order for layout

    constructor(sessionId: string, broadcast: BroadcastFn) {
        this.sessionId = sessionId;
        this.broadcast = broadcast;
        this.validator = new NodeValidator();
    }

    // ── Node Creation ───────────────────────────────────────────────────

    createNode(
        type: NodeType,
        label: string,
        content: string,
        parentId: string | null = null,
        input: any = null
    ): WorkflowNode {
        const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const node: WorkflowNode = {
            id,
            type,
            label,
            status: 'idle',
            content,
            input,
            output: null,
            parentId,
            children: [],
            validation: { sourcesCited: false, dataAccurate: false, noHallucinations: false, safetyPassed: false },
            retryCount: 0,
            maxRetries: 3,
            agent: undefined,
            toolsUsed: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        this.nodes.set(id, node);
        this.nodeOrder.push(id);

        // Link to parent
        if (parentId) {
            const parent = this.nodes.get(parentId);
            if (parent) {
                parent.children.push(id);
            }
        }

        // Broadcast creation
        this.emitNodeEvent('node.created', node);
        return node;
    }

    // ── Node Execution ──────────────────────────────────────────────────

    async executeNode(nodeId: string, executor: (node: WorkflowNode) => Promise<{ content: string; output: any; toolsUsed?: string[] }>): Promise<void> {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        node.status = 'working';
        node.updatedAt = Date.now();
        this.emitNodeEvent('node.updated', node);

        try {
            const result = await executor(node);
            node.content = result.content;
            node.output = result.output;
            node.toolsUsed = result.toolsUsed || [];
            node.status = 'complete';
            node.updatedAt = Date.now();

            // Validate
            node.validation = await this.validator.validate(node);
            const allPassed = node.validation.sourcesCited &&
                node.validation.dataAccurate &&
                node.validation.noHallucinations &&
                node.validation.safetyPassed;

            if (!allPassed && node.type === 'work') {
                node.status = 'pending_approval';
            }

            this.emitNodeEvent('node.updated', node);
            this.emitNodeEvent('node.validated', node);

        } catch (err) {
            await this.handleFailure(nodeId, executor, err);
        }
    }

    // ── Retry with Exponential Backoff ──────────────────────────────────

    private async handleFailure(
        nodeId: string,
        executor: (node: WorkflowNode) => Promise<{ content: string; output: any; toolsUsed?: string[] }>,
        error: any
    ): Promise<void> {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        node.retryCount++;
        node.updatedAt = Date.now();

        if (node.retryCount <= node.maxRetries) {
            // Retry with backoff
            node.status = 'working';
            node.error = `Retry ${node.retryCount}/${node.maxRetries}: ${String(error)}`;
            this.emitNodeEvent('node.updated', node);

            await this.sleep(1000 * node.retryCount); // Exponential backoff

            try {
                const result = await executor(node);
                node.content = result.content;
                node.output = result.output;
                node.toolsUsed = result.toolsUsed || [];
                node.status = 'complete';
                node.error = undefined;
                node.updatedAt = Date.now();

                node.validation = await this.validator.validate(node);
                this.emitNodeEvent('node.updated', node);
                this.emitNodeEvent('node.validated', node);
            } catch (retryErr) {
                await this.handleFailure(nodeId, executor, retryErr);
            }
        } else {
            // All retries exhausted → create error node
            node.status = 'failed';
            node.error = String(error);
            node.updatedAt = Date.now();
            this.emitNodeEvent('node.updated', node);

            // Create error node as child
            const errorNode = this.createNode(
                'error',
                'Execution Failed',
                `Failed after ${node.maxRetries} retries.\n\n**Error:** ${String(error)}`,
                node.id,
                { failedNodeId: nodeId, error: String(error), attempts: node.maxRetries }
            );
            errorNode.status = 'failed';
            this.emitNodeEvent('node.updated', errorNode);

            // Broadcast workflow paused
            this.broadcast('workspace.event', {
                sessionId: this.sessionId,
                type: 'workflow_paused',
                data: { reason: 'Node execution failed', errorNodeId: errorNode.id, failedNodeId: nodeId },
                timestamp: Date.now()
            });
        }
    }

    // ── Edit Cascade ────────────────────────────────────────────────────

    async editNode(
        nodeId: string,
        newContent: string,
        executor: (node: WorkflowNode) => Promise<{ content: string; output: any; toolsUsed?: string[] }>
    ): Promise<void> {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        // Update content
        node.content = newContent;
        node.input = newContent;
        node.status = 'idle';
        node.retryCount = 0;
        node.updatedAt = Date.now();
        this.emitNodeEvent('node.updated', node);

        // Re-execute this node
        await this.executeNode(nodeId, executor);

        // Cascade: re-execute all downstream children
        await this.cascadeChildren(nodeId, executor);
    }

    private async cascadeChildren(
        nodeId: string,
        executor: (node: WorkflowNode) => Promise<{ content: string; output: any; toolsUsed?: string[] }>
    ): Promise<void> {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        for (const childId of node.children) {
            const child = this.nodes.get(childId);
            if (!child || child.type === 'error') continue;

            // Feed parent output as child input
            child.input = node.output;
            child.status = 'idle';
            child.retryCount = 0;
            child.updatedAt = Date.now();
            this.emitNodeEvent('node.updated', child);

            await this.executeNode(childId, executor);
            await this.cascadeChildren(childId, executor);
        }
    }

    // ── Approval ────────────────────────────────────────────────────────

    async approveNode(nodeId: string): Promise<void> {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        node.status = 'complete';
        node.updatedAt = Date.now();
        this.emitNodeEvent('node.updated', node);
    }

    // ── Export ───────────────────────────────────────────────────────────

    exportNode(nodeId: string, format: 'md' | 'json' | 'push'): any {
        const node = this.nodes.get(nodeId);
        if (!node) return null;

        if (format === 'md') {
            return {
                type: 'markdown',
                content: `# ${node.label}\n\n${node.content}\n\n---\n_Output:_\n\`\`\`json\n${JSON.stringify(node.output, null, 2)}\n\`\`\``
            };
        }

        if (format === 'json') {
            return {
                type: 'json',
                content: {
                    id: node.id,
                    type: node.type,
                    label: node.label,
                    content: node.content,
                    output: node.output,
                    validation: node.validation,
                    toolsUsed: node.toolsUsed,
                }
            };
        }

        if (format === 'push') {
            // Push to Facebook / external API — placeholder
            return { type: 'push', status: 'not_implemented', message: 'External push not configured' };
        }

        return null;
    }

    // ── Getters ─────────────────────────────────────────────────────────

    getNode(id: string): WorkflowNode | undefined {
        return this.nodes.get(id);
    }

    getAllNodes(): WorkflowNode[] {
        return this.nodeOrder.map(id => this.nodes.get(id)!).filter(Boolean);
    }

    getChildren(nodeId: string): WorkflowNode[] {
        const node = this.nodes.get(nodeId);
        if (!node) return [];
        return node.children.map(id => this.nodes.get(id)!).filter(Boolean);
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    private emitNodeEvent(type: string, node: WorkflowNode) {
        this.broadcast('workspace.event', {
            sessionId: this.sessionId,
            nodeId: node.id,
            parentNodeId: node.parentId,
            type,
            source: 'engine',
            data: {
                id: node.id,
                type: node.type,
                label: node.label,
                status: node.status,
                content: node.content,
                input: node.input,
                output: node.output,
                parentId: node.parentId,
                children: node.children,
                validation: node.validation,
                retryCount: node.retryCount,
                maxRetries: node.maxRetries,
                agent: node.agent,
                toolsUsed: node.toolsUsed,
                error: node.error,
            },
            timestamp: Date.now()
        });
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
