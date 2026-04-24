import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function ChatBar({ onSend }: { onSend: (message: string) => void }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      width: '600px',
      maxWidth: '90vw',
      background: 'rgba(17, 17, 20, 0.85)',
      backdropFilter: 'blur(12px)',
      border: '1px solid #2a2a32',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      padding: '8px 12px',
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the agent to do something..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#f0f0f2',
            fontSize: '15px',
            outline: 'none',
            padding: '8px',
          }}
        />
        <button 
          type="submit"
          style={{
            background: '#4ade80',
            border: 'none',
            color: '#0a0a0b',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.1s',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
