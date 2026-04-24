/**
 * @file server-browser-ws.ts
 * @description WebSocket handler for the Azmeth Browser Extension relay.
 *
 * The Chrome Extension connects here at ws://localhost:4002/browser.
 * Once connected, the engine can send browser:command events and receive
 * browser:result responses, effectively controlling the user's real browser.
 */

import type WebSocket from 'ws'
import type { WebSocketServer } from 'ws'
import { registerExtensionConnection, isExtensionConnected } from '../business/tools/native/ExtensionBrowserTool.js'
import { createSubsystemLogger } from '../logging/subsystem.js'

const log = createSubsystemLogger('browser-ws')

/**
 * Attaches the browser extension WebSocket relay to the existing WSS.
 * Extension connects to the /browser path on port 4002.
 */
export function attachBrowserExtensionWsHandler(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req) => {
    const url = req.url ?? ''

    // Only handle /browser path — engine sessions use /engine
    if (!url.includes('/browser')) return

    log.info('Azmeth Browser Extension connected', { url })

    // Register this WS as the active extension connection
    registerExtensionConnection(ws)

    // Send confirmation to the extension
    ws.send(
      JSON.stringify({
        type: 'browser:connected',
        message: 'Azmeth Engine connected. Extension is active and ready for commands.',
        timestamp: new Date().toISOString(),
      }),
    )

    ws.on('close', () => {
      log.info('Azmeth Browser Extension disconnected')
    })

    ws.on('error', (err) => {
      log.error('Browser Extension WS error', { error: err.message })
    })
  })

  log.info('Azmeth Browser Extension WS handler attached on /browser path')
}

/** Returns whether the extension is currently active */
export { isExtensionConnected }
