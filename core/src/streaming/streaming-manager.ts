import { WebSocket } from 'ws';

export interface StreamMessage {
    source: 'agent' | 'browser_tool' | 'api_tool' | 'validator' | 'orchestrator';
    type: string;
    data: any;
    timestamp: number;
}

export class StreamingManager {
    private connections = new Map<string, WebSocket>();
    private sessionStreams = new Map<string, Set<string>>(); // sessionId -> connectionIds

    /**
     * Register a WebSocket connection for streaming
     */
    registerConnection(connectionId: string, sessionId: string, ws: WebSocket): void {
        this.connections.set(connectionId, ws);

        if (!this.sessionStreams.has(sessionId)) {
            this.sessionStreams.set(sessionId, new Set());
        }
        this.sessionStreams.get(sessionId)!.add(connectionId);

        console.log(`[StreamingManager] Registered connection ${connectionId} for session ${sessionId}`);
    }

    /**
     * Unregister a connection
     */
    unregisterConnection(connectionId: string, sessionId: string): void {
        this.connections.delete(connectionId);

        const sessionConns = this.sessionStreams.get(sessionId);
        if (sessionConns) {
            sessionConns.delete(connectionId);
            if (sessionConns.size === 0) {
                this.sessionStreams.delete(sessionId);
            }
        }

        console.log(`[StreamingManager] Unregistered connection ${connectionId}`);
    }

    /**
     * Stream a message to all connections watching a session
     */
    streamToSession(sessionId: string, message: Partial<StreamMessage>): void {
        const fullMessage: StreamMessage = {
            source: message.source || 'agent',
            type: message.type || 'update',
            data: message.data || {},
            timestamp: Date.now()
        };

        const connections = this.sessionStreams.get(sessionId);
        if (!connections) {
            console.warn(`[StreamingManager] No connections for session ${sessionId}`);
            return;
        }

        const messageStr = JSON.stringify(fullMessage);

        for (const connId of connections) {
            const ws = this.connections.get(connId);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        }

        console.log(`[StreamingManager] Streamed to ${connections.size} connections:`, {
            sessionId,
            type: fullMessage.type,
            source: fullMessage.source
        });
    }

    /**
     * Stream thinking/reasoning from agent
     */
    streamThinking(sessionId: string, thought: string): void {
        this.streamToSession(sessionId, {
            source: 'agent',
            type: 'thinking',
            data: { thought }
        });
    }

    /**
     * Stream tool usage
     */
    streamToolUse(sessionId: string, toolName: string, input: any): void {
        this.streamToSession(sessionId, {
            source: 'agent',
            type: 'tool_use',
            data: { toolName, input }
        });
    }

    /**
     * Stream tool result
     */
    streamToolResult(sessionId: string, toolName: string, result: any): void {
        this.streamToSession(sessionId, {
            source: 'agent',
            type: 'tool_result',
            data: { toolName, result }
        });
    }

    /**
     * Stream browser initialization (includes stream URL for embedding)
     */
    streamBrowserInit(sessionId: string, streamUrl: string): void {
        this.streamToSession(sessionId, {
            source: 'browser_tool',
            type: 'browser_initialized',
            data: { streamUrl }
        });
    }

    /**
     * Stream browser action
     */
    streamBrowserAction(sessionId: string, action: string, status: string, data?: any): void {
        this.streamToSession(sessionId, {
            source: 'browser_tool',
            type: 'browser_action',
            data: { action, status, ...data }
        });
    }

    /**
     * Stream API call details
     */
    streamAPICall(sessionId: string, api: string, method: string, endpoint: string, requestData: any): void {
        this.streamToSession(sessionId, {
            source: 'api_tool',
            type: 'api_call',
            data: { api, method, endpoint, requestData }
        });
    }

    /**
     * Stream API response
     */
    streamAPIResponse(sessionId: string, api: string, responseData: any): void {
        this.streamToSession(sessionId, {
            source: 'api_tool',
            type: 'api_response',
            data: { api, responseData }
        });
    }
}

// Global singleton
export const streamingManager = new StreamingManager();
