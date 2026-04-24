/**
 * @file start-gateway-ws.ts
 * @description Starts a standalone WebSocket server for testing the Engine Sandbox.
 *
 * This binds on port 4002 and attaches the Azmeth Engine WS handler so the frontend
 * `http://localhost:3000/sandbox` can actually connect!
 */

import { WebSocketServer } from 'ws'
import { attachEngineWsHandler } from './gateway/server-engine-ws.js'
import { attachBrowserExtensionWsHandler } from './gateway/server-browser-ws.js'

function main() {
  const HTTP_PORT = 4002
  const wss = new WebSocketServer({ port: HTTP_PORT })

  // Define a dummy broadcast function because standalone test mode doesn't have the gateway broadcast
  const dummyBroadcast = (event: string, payload: unknown) => {
    console.log(`[BROADCAST] ${event}:`, payload)
  }

  attachEngineWsHandler(wss, dummyBroadcast)
  attachBrowserExtensionWsHandler(wss)

  console.log(`📡 Engine Sandbox WebSocket server started on ws://localhost:${HTTP_PORT}/engine`)
  console.log(`🌐 Browser Extension relay started on ws://localhost:${HTTP_PORT}/browser`)

  wss.on('error', (err) => {
    console.error('🚨 WebSocket Server Error:', err)
  })
}

main()
