/**
 * @file popup.js
 * @description Azmeth Browser Extension — Popup UI Controller
 */

const dot = document.getElementById('status-dot')
const label = document.getElementById('status-label')
const sub = document.getElementById('status-sub')

function setConnected(connected) {
  if (connected) {
    dot.className = 'status-dot connected'
    label.textContent = 'Connected to Azmeth Engine'
    label.style.color = '#f0f0f2'
    sub.textContent = 'Agent is active — ready for commands'
    sub.className = 'status-sub connected'
  } else {
    dot.className = 'status-dot disconnected'
    label.textContent = 'Engine Disconnected'
    label.style.color = '#6b6b80'
    sub.textContent = 'Start the engine: npx tsx src/start-gateway-ws.ts'
    sub.className = 'status-sub'
  }
}

// Get current status from background worker
chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
  if (chrome.runtime.lastError) {
    setConnected(false)
    return
  }
  setConnected(response?.connected ?? false)
})

// Listen for live status updates while popup is open
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'CONNECTION_STATUS') {
    setConnected(msg.connected)
  }
})
