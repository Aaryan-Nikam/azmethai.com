// Removed unused React import
import { StreamEvent } from '../hooks/useWorkspaceWebSocket';
import { Globe, Database } from 'lucide-react';

interface LiveWorkspacePanelProps {
    streamUrl: string | null;
    events: StreamEvent[];
}

export function LiveWorkspacePanel({ streamUrl, events }: LiveWorkspacePanelProps) {

    // Find the most recent active component to show in the UI data display (API response etc.)
    const latestApiEvents = events.filter(e => e.type === 'api_call' || e.type === 'api_response');
    const showBrowser = !!streamUrl;

    return (
        <div className="panel live-workspace-panel">
            <div className="panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {showBrowser ? <Globe size={16} /> : <Database size={16} />}
                    <span>Live Workspace {showBrowser ? "(Browser View)" : "(Data View)"}</span>
                </div>
            </div>

            {showBrowser ? (
                <iframe
                    className="browser-frame"
                    src={streamUrl}
                    title="Browserbase Live View"
                    allow="clipboard-read; clipboard-write; microphone; camera;"
                />
            ) : (
                <div className="panel-content">
                    {latestApiEvents.length === 0 ? (
                        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '100px' }}>
                            <Database size={48} opacity={0.3} style={{ marginBottom: '16px' }} />
                            <div>No active data stream.</div>
                            <div style={{ fontSize: '12px', marginTop: '8px' }}>Tools and views will appear here when used.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {latestApiEvents.slice(-5).map((e, idx) => (
                                <div key={idx} style={{ padding: '16px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px' }}>
                                    <h4 style={{ marginBottom: '8px', color: '#58a6ff' }}>
                                        {e.type === 'api_call' ? 'Outgoing Request' : 'Incoming Response'}
                                    </h4>
                                    <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: '#8b949e' }}>
                                        {JSON.stringify(e.data, null, 2)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
