// Removed unused React import
import { Handle, Position } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './nodeStyles.css';

interface ResponseNodeData {
    message: string;
}

export function ResponseNode({ data }: { data: ResponseNodeData }) {
    return (
        <div className="canvas-node node-response">
            <div className="node-header">
                <div className="node-icon">
                    <MessageSquare size={14} />
                </div>
                <span className="node-label">Agent Response</span>
                <span className="node-status status-complete">Complete</span>
            </div>
            <div className="node-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {data.message}
                </ReactMarkdown>
            </div>
            <Handle type="target" position={Position.Left} />
        </div>
    );
}
