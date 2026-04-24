// Removed unused React import
import { Handle, Position } from '@xyflow/react';
import { User } from 'lucide-react';
import './nodeStyles.css';

interface PromptNodeData {
    message: string;
}

export function PromptNode({ data }: { data: PromptNodeData }) {
    return (
        <div className="canvas-node node-prompt">
            <div className="node-header">
                <div className="node-icon">
                    <User size={14} />
                </div>
                <span className="node-label">User Prompt</span>
            </div>
            <div className="node-body">
                {data.message}
            </div>
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
