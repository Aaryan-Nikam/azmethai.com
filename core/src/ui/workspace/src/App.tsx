import { useState, useCallback, useRef, useEffect } from 'react';
import { ReactFlowProvider, type Node, type Edge, applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange } from '@xyflow/react';
import { WorkspaceCanvas } from './components/Canvas/WorkspaceCanvas';
import { CommandBar } from './components/CommandBar';
import { Sidebar } from './components/Sidebar';
import { useWorkspaceWebSocket } from './hooks/useWorkspaceWebSocket';
import './index.css';

const SESSION_ID = 'workspace-session';

/**
 * 🌿 Organic vine layout — inspired by natural growth patterns.
 * Nodes flow downward in a gentle S-curve, like a vine or fern unfurling.
 * Uses sine-wave horizontal offsets with golden-ratio vertical rhythm.
 */

const BASE_GAP_Y = 260;
const VINE_AMPLITUDE = 180; // horizontal sway range
const VINE_FREQUENCY = 0.7; // how tight the S-curves are
const CENTER_X = 500;

/** Calculate organic position for node index i */
function vinePosition(i: number): { x: number; y: number } {
    if (i === 0) return { x: CENTER_X, y: 40 }; // Goal node: centered at top

    // Vertical: golden-ratio-inspired spacing with slight acceleration
    const yPos = 40 + i * BASE_GAP_Y + Math.pow(i, 1.15) * 12;

    // Horizontal: sine wave with phase offset — creates natural S-curve
    const phase = (i - 1) * VINE_FREQUENCY;
    const dampening = Math.min(1, 0.4 + i * 0.12); // grows wider as vine extends
    const xOffset = Math.sin(phase) * VINE_AMPLITUDE * dampening;

    return { x: CENTER_X + xOffset, y: yPos };
}

function App() {
    const { state, sendMessage, editNode, retryNode, approveNode, exportNode } = useWorkspaceWebSocket(SESSION_ID);

    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const processedCount = useRef(0);
    const nodeIndexRef = useRef(0);

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    // Action callbacks passed into node data
    const handleEdit = useCallback((nodeId: string) => {
        const content = prompt('Edit node content:');
        if (content) editNode(nodeId, content);
    }, [editNode]);

    const handleExport = useCallback((nodeId: string, format: string) => {
        exportNode(nodeId, format);
    }, [exportNode]);

    const handleApprove = useCallback((nodeId: string) => {
        approveNode(nodeId);
    }, [approveNode]);

    const handleRetry = useCallback((nodeId: string) => {
        retryNode(nodeId);
    }, [retryNode]);

    // Convert streaming events → canvas nodes + edges
    useEffect(() => {
        const events = state.events;
        if (events.length <= processedCount.current) return;

        const newEvents = events.slice(processedCount.current);
        processedCount.current = events.length;

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        for (const event of newEvents) {
            // ── User prompt → Goal node ──
            if (event.source === 'user' && event.type === 'chat_message') {
                const id = `user-prompt-${Date.now()}`;
                const pos = vinePosition(nodeIndexRef.current);
                newNodes.push({
                    id,
                    type: 'goal',
                    position: pos,
                    data: { content: event.data.message, status: 'complete' },
                });
                nodeIndexRef.current++;
                continue;
            }

            // ── Engine events: node.created / node.updated / node.validated ──
            if (event.type === 'node.created') {
                const d = event.data;
                const nodeType = mapNodeType(d.type);

                // 🌿 Organic vine position for this node
                const pos = vinePosition(nodeIndexRef.current);
                nodeIndexRef.current++;

                newNodes.push({
                    id: d.id,
                    type: nodeType,
                    position: pos,
                    data: buildNodeData(d, handleEdit, handleExport, handleApprove, handleRetry),
                });

                // Edge from parent
                if (d.parentId) {
                    newEdges.push({
                        id: `edge-${d.parentId}-${d.id}`,
                        source: d.parentId,
                        target: d.id,
                    });
                }
            }

            if (event.type === 'node.updated' || event.type === 'node.validated') {
                const d = event.data;
                setNodes(prev => prev.map(n => {
                    if (n.id === d.id) {
                        return {
                            ...n,
                            data: buildNodeData(d, handleEdit, handleExport, handleApprove, handleRetry),
                        };
                    }
                    return n;
                }));
            }

            // ── Tool activity → update the parent node with tool info ──
            if (event.type === 'tool_activity') {
                const nodeId = event.nodeId;
                if (nodeId) {
                    setNodes(prev => prev.map(n => {
                        if (n.id === nodeId) {
                            return {
                                ...n,
                                data: {
                                    ...n.data,
                                    toolActivity: event.data,
                                    toolsUsed: Array.isArray(n.data.toolsUsed) 
                                        ? [...n.data.toolsUsed, event.data.toolName].filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
                                        : [event.data.toolName],
                                },
                            };
                        }
                        return n;
                    }));
                }
            }

            // ── Workflow complete ──
            if (event.type === 'workflow_complete') {
                setNodes(prev => prev.map(n => {
                    if (n.data.status === 'working') {
                        return { ...n, data: { ...n.data, status: 'complete' } };
                    }
                    return n;
                }));
            }
        }

        if (newNodes.length > 0) {
            setNodes(prev => [...prev, ...newNodes]);
        }
        if (newEdges.length > 0) {
            setEdges(prev => [...prev, ...newEdges]);
        }
    }, [state.events, handleEdit, handleExport, handleApprove, handleRetry]);

    const handleSend = useCallback((message: string) => {
        sendMessage(message);
    }, [sendMessage]);

    const handleClear = useCallback(() => {
        setNodes([]);
        setEdges([]);
        nodeIndexRef.current = 0;
    }, []);

    return (
        <div className="workspace-root">
            <Sidebar onClearCanvas={handleClear} />
            <div className="canvas-area">
                <div className="canvas-header">
                    <span className="canvas-title">⚡ Mantis</span>
                    <div className="canvas-header-right">
                        <div className="canvas-status-dot" style={{ background: state.connected ? '#4ade80' : '#f87171' }} />
                        <span className="canvas-status-text">
                            {state.agentStatus === 'working' ? 'Agent Working' : 'Ready'}
                        </span>
                    </div>
                </div>

                <div className="canvas-container">
                    <ReactFlowProvider>
                        <WorkspaceCanvas nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
                    </ReactFlowProvider>
                </div>

                <CommandBar
                    onSend={handleSend}
                    agentStatus={state.agentStatus}
                    connected={state.connected}
                />
            </div>
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function mapNodeType(engineType: string): string {
    const typeMap: Record<string, string> = {
        goal: 'goal',
        plan: 'plan',
        work: 'work',
        browser: 'browser',
        api: 'api',
        approval: 'approval',
        output: 'output',
        error: 'error',
    };
    return typeMap[engineType] || 'work';
}

function buildNodeData(
    d: any,
    onEdit: (id: string) => void,
    onExport: (id: string, fmt: string) => void,
    onApprove: (id: string) => void,
    onRetry: (id: string) => void,
) {
    return {
        // Common
        content: d.content || '',
        label: d.label || '',
        status: d.status || 'idle',
        nodeId: d.id,

        // Validation
        validation: d.validation,

        // Tools
        toolsUsed: d.toolsUsed || [],
        toolActivity: null,

        // Error info
        error: d.error,
        retryCount: d.retryCount,
        maxRetries: d.maxRetries,
        failedNodeId: d.input?.failedNodeId,
        attempts: d.input?.attempts,

        // Plan steps
        steps: d.output?.steps,

        // API data
        input: d.input,

        // Actions
        onEdit,
        onExport,
        onApprove,
        onReject: onApprove, // For now, reject = approve (skip)
        onRetry,
        onRetrigger: onRetry,
        onSkip: onApprove,
    };
}

export default App;
