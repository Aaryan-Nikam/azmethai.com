// Removed unused React import
import { Handle, Position } from '@xyflow/react';
import { Brain } from 'lucide-react';
import './nodeStyles.css';

interface ThinkingNodeData {
    thought: string;
    isActive?: boolean;
}

export function ThinkingNode({ data }: { data: ThinkingNodeData }) {
    return (
        <div className={`canvas-node node-thinking ${data.isActive ? 'is-active' : ''}`}>
            <div className="node-header">
                <div className="node-icon">
                    <Brain size={14} />
                </div>
                <span className="node-label">Thinking</span>
                <span className={`node-status ${data.isActive ? 'status-active' : 'status-complete'}`}>
                    {data.isActive ? 'Processing' : 'Done'}
                </span>
            </div>
            <div className="node-body" style={{ fontStyle: 'italic' }}>
                💭 {data.thought}
            </div>
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
