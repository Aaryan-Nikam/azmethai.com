import { Handle, Position } from '@xyflow/react';
import { Globe } from 'lucide-react';
import './nodeStyles.css';

interface BrowserNodeData {
    content: string;
    label: string;
    status: string;
    streamUrl?: string;
    toolActivity?: { toolName: string; status: string; result?: any };
    validation?: { sourcesCited: boolean; dataAccurate: boolean; noHallucinations: boolean; safetyPassed: boolean };
}

export function BrowserNode({ data }: { data: BrowserNodeData }) {
    return (
        <div className={`canvas-node node-browser ${data.status === 'working' ? 'is-active' : ''}`}>
            <div className="node-header">
                <div className="node-icon"><Globe size={14} /></div>
                <span className="node-label">{data.label || 'Browser'}</span>
                <span className={`node-status ${data.status === 'working' ? 'status-active' : data.status === 'complete' ? 'status-complete' : 'status-idle'}`}>
                    {data.status === 'working' ? 'Browsing' : data.status === 'complete' ? 'Done' : 'Idle'}
                </span>
            </div>

            {/* Browser stream embed */}
            {data.streamUrl ? (
                <div className="browser-embed">
                    <iframe src={data.streamUrl} title="Browser View" className="browser-iframe" />
                </div>
            ) : (
                <div className="browser-placeholder">
                    <Globe size={32} opacity={0.2} />
                    <span>Browser view will appear here</span>
                </div>
            )}

            {/* Tool activity indicator */}
            {data.toolActivity && (
                <div className="tool-activity-bar">
                    <div className={`tool-activity-dot ${data.toolActivity.status === 'running' ? 'running' : 'done'}`} />
                    <span>{data.toolActivity.toolName}: {data.toolActivity.status}</span>
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
