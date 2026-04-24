import { VerifiedContextStore, VerifiedCommit } from '../session/verified-context';

export interface Session {
    id: string;
    clientIndustry?: string;
    budget?: number;
    previousWorkflows: any[];
    assignedExpert?: string;
    currentGoal?: string;
    config: any;
    verifiedContext: VerifiedContextStore;
    queue: { dequeue: () => Promise<any> };
    gateway: { send: (event: string, payload: any) => void };
    context: Map<string, any>;
    sendResponse: (msg: any) => Promise<void>;
}

export interface Config {
    [key: string]: any;
}

export interface ToolRegistry {
    [key: string]: any;
}

export interface ToolDefinition {
    name: string;
    description: string;
    input_schema: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
}

export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
    sources?: string[];
    toolName: string;
}

export interface Tool {
    name: string;
    definition: ToolDefinition;
    execute(input: any, sessionId?: string): Promise<ToolResult>;
}
