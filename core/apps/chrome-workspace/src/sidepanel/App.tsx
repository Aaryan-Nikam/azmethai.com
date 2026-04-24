import { useState, useEffect } from 'react';

const App = () => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'system', content: 'Connecting to Azmeth Gateway...' }
  ]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Check initial connection status
    chrome.runtime.sendMessage({ type: 'GET_CONNECTION_STATUS' }, (res) => {
      if (res && res.connected) {
         setConnected(true);
         setMessages([{ role: 'system', content: 'Connected to Azmeth Workspace.' }]);
      }
    });

    // Listen for WebSocket events from the background script
    const messageListener = (request: any) => {
      if (request.type === 'CONNECTION_STATUS') {
        setConnected(request.connected);
        if (request.connected) {
             setMessages([{ role: 'system', content: 'Connected to Azmeth Workspace.' }]);
        } else {
             setMessages(prev => [...prev, { role: 'system', content: 'Disconnected. Retrying...' }]);
        }
      }

      if (request.type === 'WORKSPACE_EVENT') {
          const event = request.payload;
          
          // Only show user and assistant chat messages for now
          if (event.type === 'chat_message' && event.data?.message) {
              setMessages(prev => {
                  // Avoid duplicating our own messages if the engine broadcasts them back
                  const isDuplicate = prev.some(m => m.content === event.data.message && m.role === event.source);
                  if (isDuplicate) return prev;
                  return [...prev, { role: event.source === 'user' ? 'user' : 'assistant', content: event.data.message }];
              });
          }
          
          // Optionally show tool calls taking place
          if (event.type === 'tool_call') {
               setMessages(prev => [...prev, { role: 'system', content: `Agent is using tool: ${event.data?.name}...` }]);
          }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  const handleSend = () => {
    if (!input.trim() || !connected) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    
    // Send to background script (which forwards to WS)
    chrome.runtime.sendMessage({ type: 'USER_MESSAGE', payload: userMsg });
  };

  return (
    <div className="workspace-container">
      <header className="workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Claude Workspace</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ 
                width: '10px', height: '10px', borderRadius: '50%', 
                backgroundColor: connected ? '#10a37f' : '#ef4444' 
            }}></span>
            <span style={{ fontSize: '0.8rem', color: '#666' }}>{connected ? 'Connected' : 'Offline'}</span>
        </div>
      </header>
      <main className="chat-area">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-bubble">{msg.content}</div>
          </div>
        ))}
      </main>
      <footer className="input-area">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={connected ? "Ask me to do something on this page..." : "Connecting..."}
          disabled={!connected}
        />
        <button onClick={handleSend} disabled={!connected}>Send</button>
      </footer>
    </div>
  );
};

export default App;
