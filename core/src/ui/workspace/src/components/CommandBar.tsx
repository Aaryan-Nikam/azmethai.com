import { useState } from 'react';
import { Send, Loader } from 'lucide-react';

interface CommandBarProps {
    onSend: (message: string) => void;
    agentStatus: 'idle' | 'working' | 'waiting_for_user';
    connected: boolean;
}

export function CommandBar({ onSend, agentStatus, connected }: CommandBarProps) {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim() || agentStatus === 'working') return;
        onSend(input);
        setInput('');
    };

    return (
        <div className="command-bar">
            <div className="command-bar-inner">
                {agentStatus === 'working' && (
                    <div className="command-bar-status">
                        <Loader size={14} className="spin" />
                        <span>Agent is working...</span>
                    </div>
                )}
                <div className="command-bar-input-row">
                    <input
                        type="text"
                        className="command-input"
                        placeholder="Describe a task for the agent..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        disabled={agentStatus === 'working'}
                    />
                    <button
                        className="command-send"
                        onClick={handleSend}
                        disabled={!input.trim() || agentStatus === 'working'}
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="command-bar-footer">
                    <div className="command-bar-dot" style={{ background: connected ? '#4ade80' : '#f87171' }} />
                    <span>{connected ? 'Connected' : 'Disconnected'}</span>
                </div>
            </div>
        </div>
    );
}
