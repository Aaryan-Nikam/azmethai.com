import { Handle, Position } from '@xyflow/react';
import { ShieldAlert, Check, X, Pencil } from 'lucide-react';
import './nodeStyles.css';

interface ApprovalNodeData {
    content: string;
    label: string;
    status: string;
    validation?: { sourcesCited: boolean; dataAccurate: boolean; noHallucinations: boolean; safetyPassed: boolean };
    issues?: string[];
    onApprove?: (nodeId: string) => void;
    onEdit?: (nodeId: string) => void;
    onReject?: (nodeId: string) => void;
    nodeId?: string;
}

export function ApprovalNode({ data }: { data: ApprovalNodeData }) {
    const failedChecks: string[] = [];
    if (data.validation) {
        if (!data.validation.sourcesCited) failedChecks.push('Sources not cited');
        if (!data.validation.dataAccurate) failedChecks.push('Data accuracy concerns');
        if (!data.validation.noHallucinations) failedChecks.push('Possible hallucinations detected');
        if (!data.validation.safetyPassed) failedChecks.push('Safety check flagged');
    }

    return (
        <div className="canvas-node node-approval">
            <div className="node-header">
                <div className="node-icon"><ShieldAlert size={14} /></div>
                <span className="node-label">{data.label || 'Needs Approval'}</span>
                <span className="node-status status-warning">Pending</span>
            </div>

            <div className="node-body">
                {data.content && <p>{data.content}</p>}
                {failedChecks.length > 0 && (
                    <div className="approval-issues">
                        {failedChecks.map((issue, i) => (
                            <div key={i} className="approval-issue-item">⚠️ {issue}</div>
                        ))}
                    </div>
                )}
            </div>

            <div className="approval-actions">
                <button className="approval-btn approve" onClick={() => data.onApprove?.(data.nodeId || '')}>
                    <Check size={14} /> Approve
                </button>
                <button className="approval-btn edit" onClick={() => data.onEdit?.(data.nodeId || '')}>
                    <Pencil size={14} /> Edit
                </button>
                <button className="approval-btn reject" onClick={() => data.onReject?.(data.nodeId || '')}>
                    <X size={14} /> Reject
                </button>
            </div>

            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
