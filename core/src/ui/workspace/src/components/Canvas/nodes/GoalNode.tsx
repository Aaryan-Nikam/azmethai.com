import { Handle, Position } from '@xyflow/react';
import { Target } from 'lucide-react';
import './nodeStyles.css';

interface GoalNodeData {
    content: string;
    status: string;
}

export function GoalNode({ data }: { data: GoalNodeData }) {
    return (
        <div className="canvas-node node-goal">
            <div className="node-header">
                <div className="node-icon"><Target size={14} /></div>
                <span className="node-label">Goal</span>
                <span className={`node-status ${data.status === 'complete' ? 'status-complete' : 'status-active'}`}>
                    {data.status === 'complete' ? 'Set' : 'Active'}
                </span>
            </div>
            <div className="node-body">{data.content}</div>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
