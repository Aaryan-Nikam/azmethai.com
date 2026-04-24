import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';

interface ConversationPanelProps {
    messages: { role: string; content: string }[];
    onSend: (text: string) => void;
    agentStatus: string;
}

export function ConversationPanel({ messages, onSend, agentStatus }: ConversationPanelProps) {
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input);
        setInput('');
    };

    return (
        <div className="panel conversation-panel">
            <div className="panel-header">
                Conversation
                {agentStatus === 'working' ? (
                    <span style={{ fontSize: '11px', color: '#58a6ff' }}>Agent is thinking...</span>
                ) : null}
            </div>

            <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: msg.role === 'user' ? '#1f6feb' : '#21262d',
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '90%'
                        }}
                    >
                        {msg.content}
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            <div className="chat-input-container">
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Type your message..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        style={{
                            background: 'var(--accent)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Play size={16} fill="currentColor" />
                    </button>
                </div>
            </div>
        </div>
    );
}
