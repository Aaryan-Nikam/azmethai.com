// Background service worker orchestrates the LLM interaction via Azmeth Gateway

// Open the side panel on extension icon click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

let ws: WebSocket | null = null;
const GATEWAY_URL = 'ws://localhost:18789/';
const SESSION_ID = 'chrome-workspace-session'; // Can be made dynamic later

function connectWebSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return;
  }

  console.log("Connecting to Azmeth Gateway at", GATEWAY_URL);
  ws = new WebSocket(GATEWAY_URL);

  ws.onopen = () => {
    console.log("Connected to Gateway WebSocket");
    // 1. Initial Handshake
    ws?.send(JSON.stringify({
      type: 'req',
      method: 'connect',
      id: `connect-${Date.now()}`,
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: { id: 'chrome-workspace', version: '1.0.0', platform: 'chrome', mode: 'extension' },
        auth: { token: 'test' }, // Replace with proper auth if needed
        scopes: ['operator.admin']
      }
    }));
  };

  ws.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      
      // 2. Handshake OK -> Connect to Workspace
      if (payload.type === 'res' && payload.payload?.type === 'hello-ok') {
          console.log("Handshake successful, connecting to workspace session");
          ws?.send(JSON.stringify({
              type: 'req',
              method: 'workspace.connect',
              params: { sessionId: SESSION_ID },
              id: `wsconnect-${Date.now()}`
          }));
          
          // Notify the UI that we are connected
          chrome.runtime.sendMessage({ type: 'CONNECTION_STATUS', connected: true });
          return;
      }
      
      // 3. Handle Workspace Events (e.g., Agent requesting an action)
      if (payload.type === 'event' && payload.event === 'workspace.event') {
          const eventData = payload.payload;
          if (eventData?.sessionId && eventData.sessionId !== SESSION_ID) return;
          
          console.log("Workspace event:", eventData);
          
          // Forward event to the Side Panel UI to display
          chrome.runtime.sendMessage({ 
              type: 'WORKSPACE_EVENT', 
              payload: eventData 
          });

          // Check if the agent is requesting a tool call intended for the browser
          if (eventData.type === 'tool_call' && eventData.data?.name) {
             handleAgentToolCall(eventData.data, eventData.nodeId);
          }
      }
      
    } catch (e) {
      console.error("WebSocket message parse error", e);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket disconnected, retrying in 5 seconds...");
    chrome.runtime.sendMessage({ type: 'CONNECTION_STATUS', connected: false });
    ws = null;
    setTimeout(connectWebSocket, 5000);
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
}

// Keep connection alive or reconnect on wake
chrome.alarms.create("keepAlive", { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    connectWebSocket();
  }
});

// Initial connect
connectWebSocket();

// Handle messages from the Side Panel UI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'USER_MESSAGE') {
    handleUserMessage(request.payload, sendResponse);
    return true; // Keep channel open
  }
  
  if (request.type === 'GET_CONNECTION_STATUS') {
      sendResponse({ connected: ws?.readyState === WebSocket.OPEN });
      return false;
  }
});

function handleUserMessage(message: string, sendResponse: (response: any) => void) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
      sendResponse({ reply: "Not connected to Azmeth Gateway. Please ensure it is running on port 18789." });
      return;
  }
  
  console.log("Sending chat message to workspace:", message);
  ws.send(JSON.stringify({
      type: 'req',
      method: 'workspace.chat',
      params: { sessionId: SESSION_ID, message },
      id: `chat-${Date.now()}`
  }));
  
  sendResponse({ reply: null }); // UI will be updated via WORKSPACE_EVENT broadcast
}

async function handleAgentToolCall(toolData: any, nodeId?: string) {
    console.log("Agent requested tool:", toolData.name, toolData.args);
    
    // Examples of tools the agent might call
    if (toolData.name === 'read_page' || toolData.name === 'get_dom') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'GET_DOM' }, (domResponse) => {
                // Send the result back to the Gateway workspace
                sendToolResult(nodeId, domResponse || { error: "Failed to read DOM" });
            });
        } else {
             sendToolResult(nodeId, { error: "No active tab found" });
        }
    } else if (toolData.name === 'perform_action') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'PERFORM_ACTION', payload: toolData.args }, (actionResponse) => {
                sendToolResult(nodeId, actionResponse || { error: "Failed to perform action" });
            });
        }
    }
}

function sendToolResult(nodeId: string | undefined, result: any) {
    if (!ws || ws.readyState !== WebSocket.OPEN || !nodeId) return;
    
    // Tell the workspace that the node (tool call) has completed
    // Note: this assumes the Azmeth workspace uses `workspace.editNode` or similar to return results
    ws.send(JSON.stringify({
        type: 'req',
        method: 'workspace.editNode',
        params: { 
            sessionId: SESSION_ID, 
            nodeId, 
            content: JSON.stringify(result) // Adjust payload shape to match Mantis engine requirements
        },
        id: `toolRes-${Date.now()}`
    }));
}
