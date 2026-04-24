import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

const initialNodes = [
    { id: '1', position: { x: 250, y: 50 }, data: { label: 'Goal: Market Strategy' }, type: 'input' },
    { id: '2', position: { x: 100, y: 150 }, data: { label: 'Analyze Competitors (Agent A)' } },
    { id: '3', position: { x: 400, y: 150 }, data: { label: 'Identify Audience (Growth Expert)' } },
    { id: '4', position: { x: 250, y: 300 }, data: { label: 'Review & Synthesize' } },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3', animated: true },
    { id: 'e2-4', source: '2', target: '4' },
    { id: 'e3-4', source: '3', target: '4' },
];

function App() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [ws, setWs] = useState<WebSocket | null>(null);

    const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    useEffect(() => {
        // In a real application, this would listen to orchestrator events
        const socket = new WebSocket('ws://localhost:18789');

        socket.onopen = () => {
            console.log('Canvas connected to Mantis Gateway');
            setWs(socket);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'orchestrator.task.update') {
                // Dynamically update node states (colors, labels) based on orchestrator progress
            }
        };

        socket.onclose = () => {
            setWs(null);
        };

        return () => socket.close();
    }, []);

    return (
        <div className="canvas-container">
            <header className="canvas-header">
                <h1>Mantis Orchestration Canvas</h1>
                <span className="status">Status: {ws ? 'Live' : 'Disconnected'}</span>
            </header>
            <div className="reactflow-wrapper">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                >
                    <Controls />
                    <MiniMap />
                    <Background variant="dots" gap={12} size={1} />
                </ReactFlow>
            </div>
        </div>
    );
}

export default App;
