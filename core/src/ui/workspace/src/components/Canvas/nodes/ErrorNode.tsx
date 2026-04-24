import { Handle, Position } from '@xyflow/react';
import { AlertTriangle, RotateCw, SkipForward, Pencil } from 'lucide-react';
import './nodeStyles.css';

interface ErrorNodeData {
    content: string;
    error?: string;
    failedNodeId?: string;
    attempts?: number;
    onRetry?: (nodeId: string) => void;
    onSkip?: (nodeId: string) => void;
    onEdit?: (nodeId: string) => void;
    nodeId?: string;
}

export function ErrorNode({ data }: { data: ErrorNodeData }) {
    return (
        <div className="canvas-node node-error">
            <div className="node-header">
                <div className="node-icon"><AlertTriangle size={14} /></div>
                <span className="node-label">Execution Failed</span>
                <span className="node-status status-error">
                    {data.attempts ? `${data.attempts} attempts` : 'Failed'}
                </span>
            </div>

            <div className="node-body">
                <div className="error-message">{data.content}</div>
                {data.error && (
                    <div className="error-details">
                        <code>{data.error}</code>
                    </div>
                )}
            </div>

            <div className="error-actions">
                <button className="error-btn retry" onClick={() => data.onRetry?.(data.failedNodeId || data.nodeId || '')}>
                    <RotateCw size={14} /> Retry
                </button>
                <button className="error-btn edit" onClick={() => data.onEdit?.(data.failedNodeId || data.nodeId || '')}>
                    <Pencil size={14} /> Edit & Retry
                </button>
                <button className="error-btn skip" onClick={() => data.onSkip?.(data.nodeId || '')}>
                    <SkipForward size={14} /> Skip
                </button>
            </div>

            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
