import { Handle, Position } from '@xyflow/react';
import { Package, Copy, Download, Send, RotateCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './nodeStyles.css';

interface OutputNodeData {
    content: string;
    label: string;
    status: string;
    onExport?: (nodeId: string, format: string) => void;
    onRetrigger?: (nodeId: string) => void;
    nodeId?: string;
}

export function OutputNode({ data }: { data: OutputNodeData }) {
    return (
        <div className="canvas-node node-output">
            <div className="node-header">
                <div className="node-icon"><Package size={14} /></div>
                <span className="node-label">{data.label || 'Deliverable'}</span>
                <span className={`node-status ${data.status === 'complete' ? 'status-complete' : 'status-active'}`}>
                    {data.status === 'complete' ? 'Ready' : 'Building'}
                </span>
            </div>

            <div className="node-body output-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.content || ''}</ReactMarkdown>
            </div>

            {data.status === 'complete' && (
                <div className="node-actions">
                    <button className="node-action-btn" onClick={() => data.onExport?.(data.nodeId || '', 'md')} title="Copy Markdown">
                        <Copy size={12} /><span>Copy MD</span>
                    </button>
                    <button className="node-action-btn" onClick={() => data.onExport?.(data.nodeId || '', 'json')} title="Download JSON">
                        <Download size={12} /><span>JSON</span>
                    </button>
                    <button className="node-action-btn" onClick={() => data.onExport?.(data.nodeId || '', 'push')} title="Push to Facebook">
                        <Send size={12} /><span>Push</span>
                    </button>
                    <button className="node-action-btn" onClick={() => data.onRetrigger?.(data.nodeId || '')} title="Re-run Workflow">
                        <RotateCw size={12} /><span>Re-run</span>
                    </button>
                </div>
            )}

            <Handle type="target" position={Position.Top} />
        </div>
    );
}
