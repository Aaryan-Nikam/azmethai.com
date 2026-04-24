/**
 * @file background.js
 * @description Azmeth Browser Agent — Background Service Worker (Plain JS)
 *
 * Connects to ws://localhost:4002/browser and relays commands to the active
 * Chrome tab. Returns results back to the Azmeth engine.
 */

const GATEWAY_URL = 'ws://localhost:4002/browser'
const RECONNECT_DELAY_MS = 3000

let ws = null
let isConnected = false

// ── Connection Management ────────────────────────────────────────────────────

function connect() {
  console.log('[Azmeth] Connecting to engine at', GATEWAY_URL)

  ws = new WebSocket(GATEWAY_URL)

  ws.onopen = () => {
    isConnected = true
    console.log('[Azmeth] ✅ Connected to Azmeth Engine')
    updateBadge(true)
    chrome.runtime.sendMessage({ type: 'CONNECTION_STATUS', connected: true }).catch(() => {})
  }

  ws.onmessage = async (event) => {
    try {
      const command = JSON.parse(event.data)
      if (command.type === 'browser:connected') return

      console.log('[Azmeth] Command received:', command.action, command)
      const result = await handleCommand(command)
      ws?.send(JSON.stringify({ commandId: command.commandId, result }))
    } catch (err) {
      console.error('[Azmeth] Error handling command:', err)
    }
  }

  ws.onclose = () => {
    isConnected = false
    ws = null
    updateBadge(false)
    chrome.runtime.sendMessage({ type: 'CONNECTION_STATUS', connected: false }).catch(() => {})
    console.log(`[Azmeth] Disconnected. Retrying in ${RECONNECT_DELAY_MS}ms...`)
    setTimeout(connect, RECONNECT_DELAY_MS)
  }

  ws.onerror = (err) => {
    console.warn('[Azmeth] WebSocket error (engine may not be running):', err)
  }
}

function updateBadge(connected) {
  chrome.action.setBadgeText({ text: connected ? 'ON' : 'OFF' })
  chrome.action.setBadgeBackgroundColor({ color: connected ? '#4ade80' : '#6b6b80' })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error('No active tab found')
  return tab
}

function humanDelay(min = 80, max = 300) {
  const delay = Math.floor(Math.random() * (max - min) + min)
  return new Promise(resolve => setTimeout(resolve, delay))
}

async function waitForTabLoad(tabId, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener)
      resolve()
    }, timeoutMs)

    function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        clearTimeout(timeout)
        chrome.tabs.onUpdated.removeListener(listener)
        setTimeout(resolve, 500)
      }
    }

    chrome.tabs.onUpdated.addListener(listener)
  })
}

// ── Command Dispatcher ───────────────────────────────────────────────────────

async function handleCommand(cmd) {
  const { action } = cmd

  try {
    await humanDelay()

    switch (action) {
      case 'navigate': {
        const tab = await getActiveTab()
        await chrome.tabs.update(tab.id, { url: cmd.url })
        await waitForTabLoad(tab.id)
        const updated = await chrome.tabs.get(tab.id)
        return { status: 'success', url: updated.url }
      }

      case 'new_tab': {
        const tab = await chrome.tabs.create({ url: cmd.url, active: true })
        if (cmd.url) await waitForTabLoad(tab.id)
        return { status: 'success', url: tab.url }
      }

      case 'close_tab': {
        const tab = await getActiveTab()
        await chrome.tabs.remove(tab.id)
        return { status: 'success' }
      }

      case 'screenshot': {
        const dataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: 'png' })
        const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
        return { status: 'success', screenshot: base64 }
      }

      case 'get_url': {
        const tab = await getActiveTab()
        return { status: 'success', url: tab.url }
      }

      case 'wait': {
        const ms = Math.min(cmd.delay_ms ?? 1000, 10000)
        await new Promise(resolve => setTimeout(resolve, ms))
        return { status: 'success' }
      }

      case 'extract_text': {
        const tab = await getActiveTab()
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const clone = document.body.cloneNode(true)
            clone.querySelectorAll('script, style, noscript').forEach(el => el.remove())
            return clone.innerText.slice(0, 12000).trim()
          },
        })
        return { status: 'success', text: result.result }
      }

      case 'click': {
        const tab = await getActiveTab()
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (selector) => {
            let el = document.querySelector(selector)
            if (!el) {
              const all = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]'))
              el = all.find(e => e.textContent?.trim().toLowerCase() === selector.toLowerCase()) ?? null
            }
            if (!el) throw new Error(`Element not found: ${selector}`)
            el.click()
          },
          args: [cmd.selector],
        })
        await humanDelay(200, 600)
        const tab2 = await getActiveTab()
        return { status: 'success', url: tab2.url }
      }

      case 'type': {
        const tab = await getActiveTab()
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (selector, value) => {
            const el = document.querySelector(selector)
            if (!el) throw new Error(`Input not found: ${selector}`)
            el.focus()
            el.value = ''
            el.dispatchEvent(new Event('input', { bubbles: true }))
            for (const char of value) {
              el.value += char
              el.dispatchEvent(new Event('input', { bubbles: true }))
            }
            el.dispatchEvent(new Event('change', { bubbles: true }))
          },
          args: [cmd.selector, cmd.value ?? ''],
        })
        await humanDelay(100, 400)
        return { status: 'success' }
      }

      case 'scroll': {
        const tab = await getActiveTab()
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (scrollY) => window.scrollBy({ top: scrollY, behavior: 'smooth' }),
          args: [cmd.scroll_y ?? 500],
        })
        await humanDelay(300, 700)
        return { status: 'success' }
      }

      default:
        return { status: 'error', message: `Unknown action: ${action}` }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[Azmeth] Command "${action}" failed:`, message)
    return { status: 'error', message }
  }
}

// ── Startup ──────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Azmeth] Extension installed. Connecting to engine...')
  updateBadge(false)
  connect()
})

// Reconnect when service worker wakes from sleep
connect()

// Handle popup status requests
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_STATUS') {
    sendResponse({ connected: isConnected })
  }
  return true // Keep message channel open for async response
})
