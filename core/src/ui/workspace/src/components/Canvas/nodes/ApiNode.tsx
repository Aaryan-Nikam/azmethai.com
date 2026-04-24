import { Handle, Position } from '@xyflow/react';
import { Zap, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import './nodeStyles.css';

interface ApiNodeData {
    content: string;
    label: string;
    status: string;
    toolActivity?: { toolName: string; status: string; input?: any; result?: any };
    validation?: { sourcesCited: boolean; dataAccurate: boolean; noHallucinations: boolean; safetyPassed: boolean };
}

export function ApiNode({ data }: { data: ApiNodeData }) {
    return (
        <div className={`canvas-node node-api ${data.status === 'working' ? 'is-active' : ''}`}>
            <div className="node-header">
                <div className="node-icon"><Zap size={14} /></div>
                <span className="node-label">{data.label || 'API Call'}</span>
                <span className={`node-status ${data.status === 'working' ? 'status-active' : data.status === 'complete' ? 'status-complete' : 'status-idle'}`}>
                    {data.status === 'working' ? 'Calling' : data.status === 'complete' ? 'Done' : 'Idle'}
                </span>
            </div>

            {/* Request/Response viewer */}
            {data.toolActivity && (
                <div className="api-viewer">
                    {data.toolActivity.input && (
                        <div className="api-section">
                            <div className="api-section-header">
                                <ArrowUpRight size={10} /> Request
                            </div>
                            <pre className="api-json">{JSON.stringify(data.toolActivity.input, null, 2)}</pre>
                        </div>
                    )}
                    {data.toolActivity.result && (
                        <div className="api-section api-response">
                            <div className="api-section-header">
                                <ArrowDownLeft size={10} /> Response
                                <span className="api-status-badge">200</span>
                            </div>
                            <pre className="api-json">{JSON.stringify(data.toolActivity.result, null, 2)}</pre>
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="node-body" style={{ fontSize: '12px' }}>
                {data.content}
            </div>

            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
