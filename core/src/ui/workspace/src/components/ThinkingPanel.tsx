import { useState, useRef, useEffect } from 'react';
import { StreamEvent } from '../hooks/useWorkspaceWebSocket';
import { X, Activity, Cpu, Brain, Wrench, CheckCircle, AlertTriangle } from 'lucide-react';

interface ThinkingPanelProps {
    events: StreamEvent[];
    onInterrupt: (feedback: string) => void;
    connected: boolean;
}

export function ThinkingPanel({ events, onInterrupt, connected }: ThinkingPanelProps) {
    const [interruptFeedback, setInterruptFeedback] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [events]);

    const handleInterrupt = () => {
        if (!interruptFeedback.trim()) return;
        onInterrupt(interruptFeedback);
        setInterruptFeedback('');
    };

    // Filter to only show "under the hood" events
    const thinkingEvents = events.filter(e =>
        e.type === 'thinking' ||
        e.type === 'tool_use' ||
        e.type === 'tool_result' ||
        e.type === 'workflow_complete' ||
        e.type === 'error' ||
        (e.source === 'user' && e.type === 'chat_message') ||
        (e.type === 'chat_response')
    );

    const getEventIcon = (event: StreamEvent) => {
        if (event.type === 'thinking') return <Brain size={14} style={{ color: '#d2a8ff' }} />;
        if (event.type === 'tool_use') return <Wrench size={14} style={{ color: '#79c0ff' }} />;
        if (event.type === 'tool_result') return <CheckCircle size={14} style={{ color: '#3fb950' }} />;
        if (event.type === 'error') return <AlertTriangle size={14} style={{ color: '#f85149' }} />;
        if (event.type === 'workflow_complete') return <CheckCircle size={14} style={{ color: '#3fb950' }} />;
        if (event.type === 'chat_message') return <Activity size={14} style={{ color: '#58a6ff' }} />;
        if (event.type === 'chat_response') return <Activity size={14} style={{ color: '#3fb950' }} />;
        return <Activity size={14} />;
    };

    const formatSource = (source: string) => {
        switch (source) {
            case 'browser_tool': return 'Browser';
            case 'api_tool': return 'API';
            case 'agent': return 'Agent';
            case 'user': return 'User';
            default: return 'System';
        }
    };

    const getEventLabel = (event: StreamEvent) => {
        if (event.type === 'chat_message') return 'MESSAGE SENT';
        if (event.type === 'chat_response') return 'RESPONSE READY';
        if (event.type === 'workflow_complete') return 'WORKFLOW COMPLETE';
        return event.type.replace(/_/g, ' ').toUpperCase();
    };

    return (
        <div className="panel thinking-panel">
            <div className="panel-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} />
                    <span>Under The Hood</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#3fb950' : '#f85149' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {connected ? 'WS Linked' : 'Disconnected'}
                    </span>
                </div>
            </div>

            <div className="panel-content bg-gradient-to-b" style={{ overflowY: 'auto' }}>
                {thinkingEvents.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>
                        <Cpu size={32} opacity={0.3} style={{ margin: '0 auto 12px' }} />
                        System Idle
                    </div>
                )}

                {thinkingEvents.map((event, i) => (
                    <div key={i} className="stream-event" style={{
                        borderLeft: event.type === 'workflow_complete' ? '3px solid #3fb950' :
                            event.type === 'tool_use' ? '3px solid #79c0ff' :
                                event.type === 'error' ? '3px solid #f85149' :
                                    '3px solid transparent'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            {getEventIcon(event)}
                            <span className="event-time">
                                {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className={`event-source event-${event.source}`}>
                                [{formatSource(event.source)}]
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>
                                {getEventLabel(event)}
                            </span>
                        </div>

                        {event.data?.thought && (
                            <div className="event-data" style={{ color: '#d2a8ff', fontStyle: 'italic' }}>
                                💭 {event.data.thought}
                            </div>
                        )}
                        {event.data?.toolName && (
                            <div className="event-data">
                                <span style={{ color: '#79c0ff' }}>🔧 {event.data.toolName}</span>
                            </div>
                        )}
                        {event.data?.input && typeof event.data.input === 'object' && (
                            <pre className="event-data" style={{ margin: '4px 0 0', fontSize: '11px', color: '#8b949e' }}>
                                {JSON.stringify(event.data.input, null, 2)}
                            </pre>
                        )}
                        {event.data?.summary && (
                            <div className="event-data" style={{ color: '#3fb950' }}>
                                ✅ {event.data.summary}
                            </div>
                        )}
                        {event.data?.result && typeof event.data.result === 'object' && (
                            <pre className="event-data" style={{ margin: '4px 0 0', fontSize: '11px', color: '#3fb950' }}>
                                {JSON.stringify(event.data.result, null, 2)}
                            </pre>
                        )}
                        {event.data?.error && (
                            <div className="event-data" style={{ color: '#f85149' }}>
                                ❌ {event.data.error}
                            </div>
                        )}
                        {event.data?.message && event.type === 'chat_message' && (
                            <div className="event-data" style={{ color: '#58a6ff', fontSize: '12px' }}>
                                "{event.data.message}"
                            </div>
                        )}
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', background: '#161b22' }}>
                <div style={{ fontSize: '11px', marginBottom: '8px', color: 'var(--text-secondary)' }}>INTERRUPT / GUIDE AGENT</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        className="chat-input"
                        style={{ padding: '6px 10px', fontSize: '13px' }}
                        placeholder="Change direction..."
                        value={interruptFeedback}
                        onChange={e => setInterruptFeedback(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleInterrupt()}
                    />
                    <button
                        onClick={handleInterrupt}
                        style={{
                            background: 'var(--bg-color)',
                            color: 'var(--error)',
                            border: '1px solid var(--error)',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
