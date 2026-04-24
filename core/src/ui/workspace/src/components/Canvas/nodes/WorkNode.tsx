import { Handle, Position } from '@xyflow/react';
import { Wrench, Copy, Download, Send, Pencil, ShieldCheck, ShieldAlert } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './nodeStyles.css';

interface WorkNodeData {
    content: string;
    label: string;
    status: string;
    validation?: { sourcesCited: boolean; dataAccurate: boolean; noHallucinations: boolean; safetyPassed: boolean };
    toolsUsed?: string[];
    error?: string;
    retryCount?: number;
    maxRetries?: number;
    // Action callbacks
    onEdit?: (nodeId: string) => void;
    onExport?: (nodeId: string, format: string) => void;
    nodeId?: string;
}

export function WorkNode({ data }: { data: WorkNodeData }) {
    const v = data.validation;
    // const allPassed = v && v.sourcesCited && v.dataAccurate && v.noHallucinations && v.safetyPassed;
    const showValidation = data.status === 'complete' || data.status === 'pending_approval';

    return (
        <div className={`canvas-node node-work ${data.status === 'working' ? 'is-active' : ''}`}>
            <div className="node-header">
                <div className="node-icon"><Wrench size={14} /></div>
                <span className="node-label">{data.label || 'Work'}</span>
                <span className={`node-status ${
                    data.status === 'working' ? 'status-active' :
                    data.status === 'complete' ? 'status-complete' :
                    data.status === 'failed' ? 'status-error' :
                    data.status === 'pending_approval' ? 'status-warning' :
                    'status-idle'
                }`}>
                    {data.status === 'working' ? 'Working' :
                     data.status === 'complete' ? 'Done' :
                     data.status === 'failed' ? `Failed (${data.retryCount || 0}/${data.maxRetries || 3})` :
                     data.status === 'pending_approval' ? 'Needs Review' :
                     'Idle'}
                </span>
            </div>

            {/* Tools Used */}
            {data.toolsUsed && data.toolsUsed.length > 0 && (
                <div className="node-tools-bar">
                    {data.toolsUsed.map((t, i) => (
                        <span key={i} className="tool-tag">{t}</span>
                    ))}
                </div>
            )}

            {/* Content */}
            <div className="node-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.content || ''}</ReactMarkdown>
            </div>

            {/* Error */}
            {data.error && <div className="node-error-banner">{data.error}</div>}

            {/* Validation Badges */}
            {showValidation && v && (
                <div className="validation-bar">
                    <div className={`validation-dot ${v.sourcesCited ? 'v-pass' : 'v-fail'}`} title="Sources Cited">
                        {v.sourcesCited ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                        <span>Sources</span>
                    </div>
                    <div className={`validation-dot ${v.dataAccurate ? 'v-pass' : 'v-fail'}`} title="Data Accurate">
                        {v.dataAccurate ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                        <span>Accuracy</span>
                    </div>
                    <div className={`validation-dot ${v.noHallucinations ? 'v-pass' : 'v-fail'}`} title="No Hallucinations">
                        {v.noHallucinations ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                        <span>Grounded</span>
                    </div>
                    <div className={`validation-dot ${v.safetyPassed ? 'v-pass' : 'v-fail'}`} title="Safety">
                        {v.safetyPassed ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                        <span>Safe</span>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {data.status === 'complete' && (
                <div className="node-actions">
                    <button className="node-action-btn" onClick={() => data.onEdit?.(data.nodeId || '')} title="Edit">
                        <Pencil size={12} /><span>Edit</span>
                    </button>
                    <button className="node-action-btn" onClick={() => data.onExport?.(data.nodeId || '', 'md')} title="Copy Markdown">
                        <Copy size={12} /><span>MD</span>
                    </button>
                    <button className="node-action-btn" onClick={() => data.onExport?.(data.nodeId || '', 'json')} title="Export JSON">
                        <Download size={12} /><span>JSON</span>
                    </button>
                    <button className="node-action-btn" onClick={() => data.onExport?.(data.nodeId || '', 'push')} title="Push">
                        <Send size={12} /><span>Push</span>
                    </button>
                </div>
            )}

            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
