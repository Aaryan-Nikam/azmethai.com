import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Search, Globe, Zap, Image } from 'lucide-react';
import './nodeStyles.css';

interface ToolNodeData {
    toolName: string;
    input?: any;
    result?: any;
    status: 'running' | 'complete' | 'error';
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
    web_search: <Search size={14} />,
    browser: <Globe size={14} />,
    facebook_api: <Zap size={14} />,
    image_gen: <Image size={14} />,
};

const TOOL_LABELS: Record<string, string> = {
    web_search: 'Web Search',
    browser: 'Browser',
    facebook_api: 'API Call',
    image_gen: 'Image Generation',
};

export function ToolNode({ data }: { data: ToolNodeData }) {
    const icon = TOOL_ICONS[data.toolName] || <Zap size={14} />;
    const label = TOOL_LABELS[data.toolName] || data.toolName;
    const statusClass = data.status === 'running' ? 'status-active'
        : data.status === 'error' ? 'status-error'
            : 'status-complete';

    return (
        <div className="canvas-node node-tool">
            <div className="node-header">
                <div className="node-icon">{icon}</div>
                <span className="node-label">{label}</span>
                <span className={`node-status ${statusClass}`}>
                    {data.status === 'running' ? 'Running' : data.status === 'error' ? 'Error' : 'Complete'}
                </span>
            </div>

            {data.input && (
                <div className="tool-details">
                    {typeof data.input === 'object' ? JSON.stringify(data.input, null, 2) : String(data.input)}
                </div>
            )}

            {data.result && (
                <div className="tool-result">
                    ✅ {typeof data.result === 'object'
                        ? (data.result.summary || JSON.stringify(data.result, null, 2))
                        : String(data.result)}
                </div>
            )}

            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
