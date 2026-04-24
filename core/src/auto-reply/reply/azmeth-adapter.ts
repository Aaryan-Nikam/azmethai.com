import { MantisOrchestrator } from '../../business/orchestrator/MantisOrchestrator.js';
import { ChannelRouter } from '../../business/routing/ChannelRouter.js';

const orchestrator = new MantisOrchestrator();
const channelRouter = new ChannelRouter();

export function isAzmethEnabled(): boolean {
    return process.env.AZMETH_AGENT_ENABLED === 'true';
}

/**
 * Bridges the legacy auto-reply pipeline directly into the true MantisOrchestrator.
 */
export async function runAzmethAgentTurn(params: {
    commandBody: string;
    sessionKey?: string;
    workspaceDir?: string;
    onToolUse?: (toolName: string, input: any, needsApproval?: boolean) => void;
    onToolResult?: (toolName: string, result: any) => void;
}): Promise<{
    kind: 'success';
    runResult: {
        payloads: Array<{ text: string }>;
        messagingToolSentTexts: string[];
        messagingToolSentTargets: string[];
        meta: { agentMeta?: { usage?: any; model?: string; provider?: string } };
    };
    fallbackProvider?: string;
    fallbackModel?: string;
    didLogHeartbeatStrip: boolean;
    autoCompactionCompleted: boolean;
}> {

    // 1. Resolve Identity Layer via ChannelRouter
    // Note: sessionKey typically encodes channel and sender (e.g. 'whatsapp-1234')
    const sessionParts = (params.sessionKey || '').split('-');
    const channel = (sessionParts[0] as any) || 'whatsapp';
    const from = sessionParts.slice(1).join('-') || 'unknown_sender';

    // Route inbound message to the correct Role + Tenant context
    const turnInput = await channelRouter.resolve({
        channel,
        from,
        tenant_domain: process.env.MANTIS_TENANT_DOMAIN || 'mehta-associates.com', // Defaults to our pilot test domain
        text: params.commandBody,
        session_id: params.sessionKey,
    });

    // 2. Execute through the MantisOrchestrator (handles Token Budgets, Approval Chains, Checkpoints)
    const result = await orchestrator.handleTurn(turnInput);

    let finalReply = result.reply;

    // 3. Handle HIGH risk approval suspensions natively
    if (result.approval_required) {
        finalReply += `\n\n⚠️ *Action Suspended: Requires Manager Approval to ${result.approval_required.tool}. Request dispatched.*`;
    }

    // 4. Return to the legacy pipeline in the expected format
    return {
        kind: 'success',
        runResult: {
            payloads: [{ text: finalReply || 'Task checkpointed successfully.' }],
            messagingToolSentTexts: [],
            messagingToolSentTargets: [],
            meta: {
                agentMeta: { model: 'claude-opus-4-20250514', provider: 'anthropic' },
            },
        },
        didLogHeartbeatStrip: false,
        autoCompactionCompleted: true,
    };
}

/**
 * Expose a new resume hook so channels (like WhatsApp webhooks) can release 
 * paused orchestrator states when a 'Yes/No' button is clicked by a manager.
 */
export async function onManagerApproval(approvalId: string, approved: boolean, managerIdentifier: string) {
    const result = await orchestrator.resumeAfterApproval(approvalId, approved, managerIdentifier);
    // You would push result.reply back to the original channel here via your gateway.
    return result;
}
