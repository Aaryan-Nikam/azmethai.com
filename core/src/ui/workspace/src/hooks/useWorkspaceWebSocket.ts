import { useState, useEffect, useCallback, useRef } from 'react';

export interface StreamEvent {
    source: 'agent' | 'browser_tool' | 'api_tool' | 'system' | 'user' | 'engine';
    type: string;
    data: any;
    timestamp: number;
    nodeId?: string;
    parentNodeId?: string;
}

export interface WorkspaceState {
    connected: boolean;
    sessionId: string;
    events: StreamEvent[];
    browserStreamUrl: string | null;
    agentStatus: 'idle' | 'working' | 'waiting_for_user';
}

export function useWorkspaceWebSocket(sessionId: string) {
    const [state, setState] = useState<WorkspaceState>({
        connected: false,
        sessionId,
        events: [],
        browserStreamUrl: null,
        agentStatus: 'idle',
    });

    const wsRef = useRef<WebSocket | null>(null);
    const pendingRequests = useRef<Map<string, string>>(new Map());

    useEffect(() => {
        const wsUrl = `ws://localhost:18789/`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: 'req',
                method: 'connect',
                id: `connect-${Date.now()}`,
                params: {
                    minProtocol: 3,
                    maxProtocol: 3,
                    client: { id: 'webchat-ui', version: '1.0.0', platform: 'web', mode: 'ui' },
                    auth: { token: 'test' },
                    scopes: ['operator.admin']
                }
            }));
        };

        ws.onmessage = (messageEvent) => {
            try {
                const payload = JSON.parse(messageEvent.data);

                // 1. Handshake
                if (payload.type === 'res' && payload.payload?.type === 'hello-ok') {
                    const wsConnId = `wsconnect-${Date.now()}`;
                    pendingRequests.current.set(wsConnId, 'workspace.connect');
                    ws.send(JSON.stringify({
                        type: 'req',
                        method: 'workspace.connect',
                        params: { sessionId },
                        id: wsConnId
                    }));
                    setState(s => ({ ...s, connected: true }));
                    return;
                }

                // 2. Workspace events (broadcasts from engine)
                if (payload.type === 'event' && payload.event === 'workspace.event') {
                    const eventData = payload.payload;
                    if (eventData?.sessionId && eventData.sessionId !== sessionId) return;

                    const streamEvent: StreamEvent = {
                        source: eventData.source || 'engine',
                        type: eventData.type || 'update',
                        data: eventData.data || {},
                        timestamp: eventData.timestamp || Date.now(),
                        nodeId: eventData.nodeId,
                        parentNodeId: eventData.parentNodeId,
                    };

                    setState(s => {
                        const newState = { ...s, events: [...s.events, streamEvent] };

                        // Track agent status from engine events
                        if (streamEvent.type === 'node.created' || streamEvent.type === 'node.updated') {
                            const status = streamEvent.data?.status;
                            if (status === 'working') newState.agentStatus = 'working';
                            if (status === 'pending_approval') newState.agentStatus = 'waiting_for_user';
                        }
                        if (streamEvent.type === 'workflow_complete') {
                            newState.agentStatus = 'idle';
                        }
                        if (streamEvent.type === 'workflow_paused') {
                            newState.agentStatus = 'waiting_for_user';
                        }

                        return newState;
                    });
                    return;
                }

                // 3. RPC responses
                if (payload.type === 'res' && payload.ok === true && payload.id) {
                    const method = pendingRequests.current.get(payload.id);
                    pendingRequests.current.delete(payload.id);

                    if (method === 'workspace.exportNode' && payload.payload?.result) {
                        // Handle export: copy to clipboard or trigger download
                        const result = payload.payload.result;
                        if (result.type === 'markdown' || result.type === 'json') {
                            const text = typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2);
                            navigator.clipboard.writeText(text).then(() => {
                                console.log('Exported to clipboard');
                            });
                        }
                    }
                    return;
                }

                // 4. RPC errors
                if (payload.type === 'res' && payload.ok === false) {
                    console.error('RPC error:', payload.error);
                    return;
                }

                // 5. Skip system events
                if (payload.type === 'event') {
                    if (['tick', 'health', 'presence', 'connect.challenge'].includes(payload.event)) {
                        return;
                    }
                }
            } catch (e) {
                console.error('WebSocket parse error', e);
            }
        };

        ws.onclose = () => setState(s => ({ ...s, connected: false }));
        ws.onerror = (err) => console.error('WebSocket error:', err);

        return () => { ws.close(); };
    }, [sessionId]);

    // ── RPC Helpers ──────────────────────────────────────────

    const sendRpc = useCallback((method: string, params: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const id = `${method.split('.').pop()}-${Date.now()}`;
            pendingRequests.current.set(id, method);
            wsRef.current.send(JSON.stringify({ type: 'req', method, params: { sessionId, ...params }, id }));
        }
    }, [sessionId]);

    const sendMessage = useCallback((message: string) => {
        // Add user message to events immediately (creates Goal node)
        setState(s => ({
            ...s,
            events: [...s.events, {
                source: 'user' as const,
                type: 'chat_message',
                data: { message },
                timestamp: Date.now()
            }],
            agentStatus: 'working'
        }));
        sendRpc('workspace.chat', { message });
    }, [sendRpc]);

    const editNode = useCallback((nodeId: string, content: string) => {
        sendRpc('workspace.editNode', { nodeId, content });
    }, [sendRpc]);

    const retryNode = useCallback((nodeId: string) => {
        sendRpc('workspace.retryNode', { nodeId });
    }, [sendRpc]);

    const approveNode = useCallback((nodeId: string) => {
        sendRpc('workspace.approveNode', { nodeId });
    }, [sendRpc]);

    const exportNode = useCallback((nodeId: string, format: string) => {
        sendRpc('workspace.exportNode', { nodeId, format });
    }, [sendRpc]);

    const interruptAgent = useCallback((feedback: string) => {
        sendRpc('workspace.interrupt', { feedback });
    }, [sendRpc]);

    return { state, sendMessage, editNode, retryNode, approveNode, exportNode, interruptAgent };
}
