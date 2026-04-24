/**
 * @file ExtensionBrowserTool.ts
 * @description Stealth browser tool that routes commands through the Azmeth
 * Chrome Extension, using the user's REAL browser session.
 *
 * Unlike Browserbase (which uses a remote headless browser), this tool
 * operates directly in the user's Chrome/Arc browser — using their existing
 * cookies, fingerprint, IP, and account sessions. It is 100% undetectable
 * as automation by anti-bot systems.
 *
 * Prerequisites:
 *   1. The Azmeth Browser Extension must be installed in Chrome.
 *   2. The extension connects to ws://localhost:4002/browser.
 *   3. The engine sends commands and waits for results.
 *
 * Risk level: MEDIUM for read actions (navigate, screenshot, extract),
 *             HIGH for write actions (click, type, submit_form)
 */

import { EventEmitter } from 'events'

export interface ExtensionBrowserInput {
  action:
    | 'navigate'
    | 'click'
    | 'type'
    | 'screenshot'
    | 'extract_text'
    | 'scroll'
    | 'get_url'
    | 'wait'
    | 'new_tab'
    | 'close_tab'
  url?: string
  selector?: string
  value?: string
  /** Pixels to scroll (positive = down, negative = up) */
  scroll_y?: number
  /** Milliseconds to wait (for wait action) */
  delay_ms?: number
}

export interface ExtensionBrowserResult {
  status: 'success' | 'error' | 'disconnected'
  url?: string
  text?: string
  screenshot?: string
  message?: string
}

// ── Global shared state (singleton in the gateway process) ─────────────────────

/** WebSocket connection to the extension. Set by server-browser-ws.ts */
let _extensionWs: import('ws').WebSocket | null = null

/** Pending command resolvers keyed by commandId */
const _pendingCommands = new Map<
  string,
  { resolve: (r: ExtensionBrowserResult) => void; reject: (e: Error) => void }
>()

export const extensionBrowserEvents = new EventEmitter()

/**
 * Called by server-browser-ws.ts when the extension connects.
 */
export function registerExtensionConnection(ws: import('ws').WebSocket): void {
  _extensionWs = ws
  console.log('[ExtensionBrowserTool] Chrome Extension connected ✅')

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as {
        commandId: string
        result: ExtensionBrowserResult
      }
      const pending = _pendingCommands.get(msg.commandId)
      if (pending) {
        _pendingCommands.delete(msg.commandId)
        pending.resolve(msg.result)
      }
    } catch {
      // Ignore malformed messages
    }
  })

  ws.on('close', () => {
    _extensionWs = null
    // Reject all pending commands
    for (const [id, pending] of _pendingCommands) {
      pending.reject(new Error('[ExtensionBrowserTool] Extension disconnected mid-command'))
      _pendingCommands.delete(id)
    }
    console.log('[ExtensionBrowserTool] Chrome Extension disconnected')
  })
}

export function isExtensionConnected(): boolean {
  return _extensionWs !== null && _extensionWs.readyState === 1
}

// ── Tool Definition & Executor ─────────────────────────────────────────────────

export class ExtensionBrowserTool {
  static readonly toolName = 'browser_real'

  static get definition() {
    return {
      type: 'function' as const,
      function: {
        name: ExtensionBrowserTool.toolName,
        description:
          'Controls YOUR REAL Chrome browser using the Azmeth Extension. This is undetectable by anti-bot systems because it operates in your actual browser session with your real cookies, IP address, and login sessions. Use this for any site where you need to be logged in (LinkedIn, Gmail, HubSpot, internal tools, etc.). Requires the Azmeth Chrome Extension to be installed and active. Check if it\'s available before using — if not, fall back to browser_navigate.',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: [
                'navigate',
                'click',
                'type',
                'screenshot',
                'extract_text',
                'scroll',
                'get_url',
                'wait',
                'new_tab',
                'close_tab',
              ],
              description:
                'navigate: go to URL | click: click an element by CSS selector or visible text | type: type into an input | screenshot: capture visible screen | extract_text: get all visible text | scroll: scroll the page | get_url: return current URL | wait: pause execution | new_tab: open a new tab | close_tab: close current tab',
            },
            url: {
              type: 'string',
              description: 'URL to navigate to (required for "navigate" and "new_tab").',
            },
            selector: {
              type: 'string',
              description:
                'CSS selector, element ID, or visible text to target an element (required for "click" and "type").',
            },
            value: {
              type: 'string',
              description: 'Text to type into an input field (required for "type").',
            },
            scroll_y: {
              type: 'number',
              description:
                'Pixels to scroll vertically. Positive scrolls down, negative scrolls up.',
            },
            delay_ms: {
              type: 'number',
              description: 'Milliseconds to wait (for "wait" action). Max 10000.',
            },
          },
          required: ['action'],
        },
      },
    }
  }

  static async execute(input: ExtensionBrowserInput): Promise<ExtensionBrowserResult> {
    if (!isExtensionConnected()) {
      return {
        status: 'disconnected',
        message:
          'The Azmeth Chrome Extension is not connected. Install it from the Azmeth dashboard and make sure it is enabled. Falling back is recommended — use browser_navigate instead.',
      }
    }

    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const TIMEOUT_MS = 30_000

    return new Promise<ExtensionBrowserResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        _pendingCommands.delete(commandId)
        reject(
          new Error(
            `[ExtensionBrowserTool] Command "${input.action}" timed out after ${TIMEOUT_MS}ms`,
          ),
        )
      }, TIMEOUT_MS)

      _pendingCommands.set(commandId, {
        resolve: (result) => {
          clearTimeout(timeout)
          resolve(result)
        },
        reject: (err) => {
          clearTimeout(timeout)
          reject(err)
        },
      })

      // Send command to the extension
      _extensionWs!.send(
        JSON.stringify({
          commandId,
          ...input,
        }),
      )
    })
  }
}
