/**
 * @file BrowserbaseTool.ts
 * @description Remote headless browser tool powered by Browserbase.
 *
 * Used when the extension isn't connected, or for browser automation on
 * sites that don't require the user's personal authentication.
 *
 * Risk level: MEDIUM (interacts with external services)
 */

import { Browserbase } from '@browserbasehq/sdk'

export interface BrowserbaseInput {
  action: 'navigate' | 'screenshot' | 'extract_text' | 'click' | 'type' | 'get_url'
  url?: string
  selector?: string
  value?: string
  session_id?: string // If provided, reuses existing session
}

export interface BrowserbaseResult {
  status: 'success' | 'error'
  url?: string
  text?: string
  screenshot?: string // base64
  session_id?: string
  message?: string
}

// Reuse sessions within a single agent run
const activeSessions = new Map<string, string>() // roleId → sessionId

export class BrowserbaseTool {
  static readonly toolName = 'browser_navigate'

  private static sdk = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY ?? '',
  })

  static get definition() {
    return {
      type: 'function' as const,
      function: {
        name: BrowserbaseTool.toolName,
        description:
          'Controls a remote headless browser to navigate websites, take screenshots, extract text, or interact with page elements. Use this when you need to visit a URL, read a web page, or interact with a web UI. For sites requiring your personal login (LinkedIn, Gmail, etc.) use the browser_real tool (requires the Azmeth extension installed in Chrome).',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['navigate', 'screenshot', 'extract_text', 'click', 'type', 'get_url'],
              description:
                'Action to perform: navigate to a URL, screenshot the current page, extract all visible text, click an element, type into an element, or get the current URL.',
            },
            url: {
              type: 'string',
              description: 'URL to navigate to. Required for the "navigate" action.',
            },
            selector: {
              type: 'string',
              description:
                'CSS selector or text content to target an element. Required for "click" and "type" actions.',
            },
            value: {
              type: 'string',
              description: 'Text to type into an element. Required for the "type" action.',
            },
            session_id: {
              type: 'string',
              description:
                'Reuse an existing browser session ID from a previous call. Leave empty to start a new session.',
            },
          },
          required: ['action'],
        },
      },
    }
  }

  static async execute(input: BrowserbaseInput, roleId = 'default'): Promise<BrowserbaseResult> {
    const apiKey = process.env.BROWSERBASE_API_KEY
    const projectId = process.env.BROWSERBASE_PROJECT_ID

    if (!apiKey || !projectId) {
      throw new Error(
        '[BrowserbaseTool] BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID must be set.',
      )
    }

    // Get or create a session
    let sessionId = input.session_id ?? activeSessions.get(roleId)
    if (!sessionId) {
      const session = await BrowserbaseTool.sdk.sessions.create({ projectId })
      sessionId = session.id
      activeSessions.set(roleId, sessionId)
      console.log(`[BrowserbaseTool] Created new session: ${sessionId}`)
    }

    const debugUrl = `https://www.browserbase.com/sessions/${sessionId}`

    try {
      switch (input.action) {
        case 'navigate': {
          if (!input.url) throw new Error('url is required for navigate action')

          // Use the Browserbase REST API to run a simple navigation script
          const res = await fetch(
            `https://api.browserbase.com/v1/sessions/${sessionId}/execute`,
            {
              method: 'POST',
              headers: {
                'x-bb-api-key': apiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                script: `
                  await page.goto("${input.url}", { waitUntil: "networkidle2", timeout: 30000 });
                  return { url: page.url(), title: await page.title() };
                `,
              }),
            },
          )
          const data = await res.json() as { url?: string; title?: string }
          return { status: 'success', url: data.url, session_id: sessionId }
        }

        case 'extract_text': {
          const res = await fetch(
            `https://api.browserbase.com/v1/sessions/${sessionId}/execute`,
            {
              method: 'POST',
              headers: {
                'x-bb-api-key': apiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                script: `
                  return document.body.innerText.slice(0, 8000);
                `,
              }),
            },
          )
          const text = await res.text()
          return { status: 'success', text, session_id: sessionId }
        }

        case 'screenshot': {
          const res = await fetch(
            `https://api.browserbase.com/v1/sessions/${sessionId}/screenshot`,
            {
              headers: { 'x-bb-api-key': apiKey },
            },
          )
          const buffer = await res.arrayBuffer()
          const b64 = Buffer.from(buffer).toString('base64')
          return { status: 'success', screenshot: b64, session_id: sessionId }
        }

        case 'click': {
          if (!input.selector) throw new Error('selector is required for click action')
          const res = await fetch(
            `https://api.browserbase.com/v1/sessions/${sessionId}/execute`,
            {
              method: 'POST',
              headers: {
                'x-bb-api-key': apiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                script: `
                  await page.click("${input.selector.replace(/"/g, '\\"')}");
                  await page.waitForTimeout(500);
                  return { url: page.url() };
                `,
              }),
            },
          )
          const data = await res.json() as { url?: string }
          return { status: 'success', url: data.url, session_id: sessionId }
        }

        case 'type': {
          if (!input.selector) throw new Error('selector is required for type action')
          if (!input.value) throw new Error('value is required for type action')
          await fetch(
            `https://api.browserbase.com/v1/sessions/${sessionId}/execute`,
            {
              method: 'POST',
              headers: {
                'x-bb-api-key': apiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                script: `
                  await page.type("${input.selector.replace(/"/g, '\\"')}", "${input.value.replace(/"/g, '\\"')}");
                `,
              }),
            },
          )
          return { status: 'success', session_id: sessionId }
        }

        case 'get_url': {
          const res = await fetch(
            `https://api.browserbase.com/v1/sessions/${sessionId}/execute`,
            {
              method: 'POST',
              headers: {
                'x-bb-api-key': apiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ script: 'return page.url();' }),
            },
          )
          const url = await res.text()
          return { status: 'success', url: url.replace(/"/g, ''), session_id: sessionId }
        }

        default:
          throw new Error(`[BrowserbaseTool] Unknown action: ${input.action}`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[BrowserbaseTool] Action failed:`, msg)
      return { status: 'error', message: msg, session_id: sessionId }
    }
  }
}
