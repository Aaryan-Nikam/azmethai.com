import { Handle, Position } from '@xyflow/react';
import { ListChecks, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import './nodeStyles.css';

interface PlanNodeData {
    content: string;
    status: string;
    label: string;
    steps?: { label: string; description: string }[];
}

export function PlanNode({ data }: { data: PlanNodeData }) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="canvas-node node-plan">
            <div className="node-header">
                <div className="node-icon"><ListChecks size={14} /></div>
                <span className="node-label">{data.label || 'Task Plan'}</span>
                <span className={`node-status ${data.status === 'complete' ? 'status-complete' : 'status-active'}`}>
                    {data.status === 'complete' ? 'Ready' : 'Planning'}
                </span>
                <button className="node-toggle" onClick={() => setExpanded(!expanded)}>
                    {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
            </div>
            {expanded && (
                <div className="node-body plan-body">
                    {data.content?.split('\n').map((line, i) => (
                        <div key={i} className="plan-step-line">{line}</div>
                    ))}
                </div>
            )}
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
