import { useMemo } from 'react';
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    Controls,
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { GoalNode } from './nodes/GoalNode';
import { PlanNode } from './nodes/PlanNode';
import { WorkNode } from './nodes/WorkNode';
import { BrowserNode } from './nodes/BrowserNode';
import { ApiNode } from './nodes/ApiNode';
import { ApprovalNode } from './nodes/ApprovalNode';
import { OutputNode } from './nodes/OutputNode';
import { ErrorNode } from './nodes/ErrorNode';

interface WorkspaceCanvasProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
}

const nodeTypes = {
    goal: GoalNode,
    plan: PlanNode,
    work: WorkNode,
    browser: BrowserNode,
    api: ApiNode,
    approval: ApprovalNode,
    output: OutputNode,
    error: ErrorNode,
};

const defaultEdgeOptions = {
    type: 'bezier',
    animated: true,
};

export function WorkspaceCanvas({ nodes, edges, onNodesChange, onEdgesChange }: WorkspaceCanvasProps) {
    const proOptions = useMemo(() => ({ hideAttribution: true }), []);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                proOptions={proOptions}
                fitView
                fitViewOptions={{ padding: 0.4, maxZoom: 1 }}
                minZoom={0.1}
                maxZoom={2}
                nodesDraggable
                nodesConnectable={false}
                panOnDrag
                zoomOnScroll
                style={{ background: 'transparent' }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={28}
                    size={1}
                    color="rgba(255,255,255,0.04)"
                />
                {/* 🌿 SVG gradient for organic vine edges */}
                <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                    <defs>
                        <linearGradient id="vine-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                            <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.6" />
                            <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.4" />
                        </linearGradient>
                    </defs>
                </svg>
                <Controls
                    showInteractive={false}
                    style={{
                        background: 'rgba(20,20,22,0.9)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                    }}
                />
            </ReactFlow>
        </div>
    );
}
