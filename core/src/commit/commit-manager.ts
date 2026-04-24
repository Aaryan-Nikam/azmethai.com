import { VerifiedCommit } from '../session/verified-context';

export interface CreateCommitParams {
    agentId: string;
    sessionId: string;
    content: any;
    type: string;
    timestamp: number;
}

export async function createCommit(params: CreateCommitParams): Promise<VerifiedCommit> {
    return {
        commitId: `commit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        agentId: params.agentId,
        type: params.type,
        content: params.content,
        sources: params.content?.sources || [],
        timestamp: params.timestamp,
        validatedBy: 'pending'
    };
}
