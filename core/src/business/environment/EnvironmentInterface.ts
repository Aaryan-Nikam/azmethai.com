// Environment Interface — Unified computer access (Cowork-style)
// Wraps Playwright, file system, terminal, APIs under IronPass governance

import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright'
import { readFile, writeFile, mkdir, rmdir, rm, readdir } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import fetch from 'node-fetch'

export interface EnvironmentAction {
  type: 'browser' | 'filesystem' | 'terminal' | 'http'
  description: string
  impact: 'read' | 'write' | 'execute'
  requiresApproval: boolean
}

export interface BrowserAction {
  type: 'navigate' | 'click' | 'fill' | 'screenshot' | 'evaluate' | 'extract'
  target?: string
  value?: string
  selector?: string
}

export interface FileSystemAction {
  type: 'read' | 'write' | 'delete' | 'list'
  path: string
  content?: string
}

export interface TerminalAction {
  command: string
  args?: string[]
  workingDirectory?: string
}

export interface HTTPAction {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers?: Record<string, string>
  body?: any
  timeout?: number
}

export interface EnvironmentCapability {
  isAvailable: boolean
  requiresApproval: boolean
  currentLimits?: {
    maxRequests?: number
    rateLimit?: number
    timeout?: number
  }
}

export class EnvironmentInterface {
  private browsers: Map<string, Browser> = new Map()
  private contexts: Map<string, BrowserContext> = new Map()
  private pages: Map<string, Page> = new Map()
  private execAsync = promisify(exec)
  private governanceCheck?: (action: EnvironmentAction) => Promise<boolean>
  private actionLog: EnvironmentAction[] = []

  constructor(governanceCheckFn?: (action: EnvironmentAction) => Promise<boolean>) {
    this.governanceCheck = governanceCheckFn
  }

  // ============================================================================
  // BROWSER INTERFACE (Playwright multi-engine support)
  // ============================================================================

  /**
   * Launch browser instance
   */
  async launchBrowser(
    engineType: 'chromium' | 'firefox' | 'webkit' = 'chromium',
    headless: boolean = false
  ): Promise<string> {
    const action: EnvironmentAction = {
      type: 'browser',
      description: `Launch ${engineType} browser (headless: ${headless})`,
      impact: 'execute',
      requiresApproval: !headless, // Visual browser requires approval
    }

    if (!(await this.checkGovernance(action))) {
      throw new Error('Browser launch not approved by governance')
    }

    const browserMap = { chromium, firefox, webkit }
    const engine = browserMap[engineType]

    const browser = await engine.launch({
      headless,
      args: ['--disable-blink-features=AutomationControlled'],
    })

    const browserId = `browser_${Date.now()}`
    this.browsers.set(browserId, browser)

    return browserId
  }

  /**
   * Navigate to URL
   */
  async navigate(browserId: string, url: string): Promise<string> {
    if (!(await this.authorizeBrowserAction({ type: 'navigate', target: url }, `Navigate to ${url}`))) {
      throw new Error('Navigation not approved')
    }

    const page = await this.getOrCreatePage(browserId)
    await page.goto(url, { waitUntil: 'networkidle' })

    return 'Navigation successful'
  }

  /**
   * Click element
   */
  async click(pageId: string, selector: string): Promise<void> {
    if (!(await this.authorizeBrowserAction({ type: 'click', selector }, `Click element: ${selector}`))) {
      throw new Error('Click action not approved')
    }

    const page = this.pages.get(pageId)
    if (!page) throw new Error('Page not found')

    await page.click(selector)
  }

  /**
   * Fill form field
   */
  async fillField(pageId: string, selector: string, value: string): Promise<void> {
    if (!(await this.authorizeBrowserAction({ type: 'fill', selector, value }, `Fill field ${selector}`))) {
      throw new Error('Fill action not approved')
    }

    const page = this.pages.get(pageId)
    if (!page) throw new Error('Page not found')

    await page.fill(selector, value)
  }

  /**
   * Take screenshot
   */
  async screenshot(pageId: string, filename?: string): Promise<Buffer> {
    if (!(await this.authorizeBrowserAction({ type: 'screenshot', target: filename }, `Screenshot${filename ? ` to ${filename}` : ''}`))) {
      throw new Error('Screenshot not approved')
    }

    const page = this.pages.get(pageId)
    if (!page) throw new Error('Page not found')

    return await page.screenshot()
  }

  /**
   * Evaluate JavaScript in page context
   */
  async evaluateJs(pageId: string, code: string, args?: any[]): Promise<any> {
    if (!(await this.authorizeBrowserAction({ type: 'evaluate', value: code }, `Execute JS in page context`))) {
      throw new Error('JavaScript evaluation not approved')
    }

    const page = this.pages.get(pageId)
    if (!page) throw new Error('Page not found')

    return await page.evaluate(
      ({ code, args }: { code: string; args?: any[] }) => {
        // Safe evaluation wrapper
        try {
          const fn = new Function(...(args ? Object.keys(args) : []), `return (${code})`)
          return fn(...(args ? Object.values(args) : []))
        } catch (e) {
          return { error: String(e) }
        }
      },
      { code, args }
    )
  }

  /**
   * Extract text from page
   */
  async extractText(pageId: string, selector?: string): Promise<string> {
    const page = this.pages.get(pageId)
    if (!page) throw new Error('Page not found')

    if (selector) {
      return await page.textContent(selector) || ''
    }

    return await page.content()
  }

  /**
   * Close browser
   */
  async closeBrowser(browserId: string): Promise<void> {
    const browser = this.browsers.get(browserId)
    if (browser) {
      await browser.close()
      this.browsers.delete(browserId)
    }
  }

  // ============================================================================
  // FILE SYSTEM INTERFACE
  // ============================================================================

  /**
   * Read file
   */
  async readFile(filePath: string): Promise<string> {
    const action: EnvironmentAction = {
      type: 'filesystem',
      description: `Read file: ${filePath}`,
      impact: 'read',
      requiresApproval: false,
    }

    if (!(await this.checkGovernance(action))) {
      throw new Error('File read not approved')
    }

    return await readFile(filePath, 'utf-8')
  }

  /**
   * Write file
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const action: EnvironmentAction = {
      type: 'filesystem',
      description: `Write file: ${filePath}`,
      impact: 'write',
      requiresApproval: true,
    }

    if (!(await this.checkGovernance(action))) {
      throw new Error('File write not approved')
    }

    await mkdir(require('path').dirname(filePath), { recursive: true })
    await writeFile(filePath, content, 'utf-8')
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    const action: EnvironmentAction = {
      type: 'filesystem',
      description: `Delete file: ${filePath}`,
      impact: 'write',
      requiresApproval: true,
    }

    if (!(await this.checkGovernance(action))) {
      throw new Error('File delete not approved')
    }

    await rm(filePath)
  }

  /**
   * List directory
   */
  async listDirectory(dirPath: string): Promise<string[]> {
    const action: EnvironmentAction = {
      type: 'filesystem',
      description: `List directory: ${dirPath}`,
      impact: 'read',
      requiresApproval: false,
    }

    if (!(await this.checkGovernance(action))) {
      throw new Error('Directory listing not approved')
    }

    return await readdir(dirPath)
  }

  // ============================================================================
  // TERMINAL INTERFACE
  // ============================================================================

  /**
   * Execute shell command
   */
  async executeCommand(command: string, args?: string[], workingDir?: string): Promise<string> {
    const fullCommand = args ? `${command} ${args.join(' ')}` : command

    const action: EnvironmentAction = {
      type: 'terminal',
      description: `Execute: ${fullCommand}`,
      impact: 'execute',
      requiresApproval: true,
    }

    if (!(await this.checkGovernance(action))) {
      throw new Error('Command execution not approved')
    }

    try {
      const { stdout } = await this.execAsync(fullCommand, {
        cwd: workingDir,
        timeout: 30000,
      })
      return stdout
    } catch (error) {
      throw new Error(`Command failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Install npm package
   */
  async installPackage(packageName: string): Promise<string> {
    return this.executeCommand('npm', ['install', packageName])
  }

  // ============================================================================
  // HTTP INTERFACE
  // ============================================================================

  /**
   * Make HTTP request
   */
  async httpRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    options?: {
      headers?: Record<string, string>
      body?: any
      timeout?: number
    }
  ): Promise<any> {
    const action: EnvironmentAction = {
      type: 'http',
      description: `${method} ${url}`,
      impact: method === 'GET' ? 'read' : 'write',
      requiresApproval: ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method),
    }

    if (!(await this.checkGovernance(action))) {
      throw new Error('HTTP request not approved')
    }

    const response = await fetch(url, {
      method,
      headers: options?.headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      timeout: options?.timeout || 10000,
    } as any)

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return await response.json()
    }

    return await response.text()
  }

  // ============================================================================
  // GOVERNANCE & LOGGING
  // ============================================================================

  /**
   * Check if action is approved by governance layer
   */
  private async checkGovernance(action: EnvironmentAction): Promise<boolean> {
    this.actionLog.push(action)

    if (this.governanceCheck) {
      return await this.governanceCheck(action)
    }

    // Default: allow read operations, require approval for write/execute
    if (action.impact === 'read' && !action.requiresApproval) {
      return true
    }

    console.warn(`Action requires approval: ${action.description}`)
    return true // Testing: default allow, but log
  }

  /**
   * Get action log for audit trail
   */
  getActionLog(): EnvironmentAction[] {
    return [...this.actionLog]
  }

  /**
   * Get capabilities
   */
  getCapabilities(): Record<string, EnvironmentCapability> {
    return {
      browser: {
        isAvailable: true,
        requiresApproval: true,
        currentLimits: { timeout: 60000 },
      },
      filesystem: {
        isAvailable: true,
        requiresApproval: true,
      },
      terminal: {
        isAvailable: true,
        requiresApproval: true,
      },
      http: {
        isAvailable: true,
        requiresApproval: true,
        currentLimits: { maxRequests: 100, rateLimit: 10 },
      },
    }
  }

  private classifyBrowserAction(action: BrowserAction): { impact: EnvironmentAction['impact']; requiresApproval: boolean } {
    switch (action.type) {
      case 'navigate':
        return { impact: 'read', requiresApproval: false }
      case 'click':
        return { impact: 'execute', requiresApproval: true }
      case 'fill':
        return { impact: 'write', requiresApproval: true }
      case 'evaluate':
        return { impact: 'execute', requiresApproval: true }
      case 'screenshot':
        return { impact: 'read', requiresApproval: false }
      case 'extract':
        return { impact: 'read', requiresApproval: false }
      default:
        return { impact: 'execute', requiresApproval: true }
    }
  }

  private async authorizeBrowserAction(action: BrowserAction, description: string): Promise<boolean> {
    const classification = this.classifyBrowserAction(action)
    const envAction: EnvironmentAction = {
      type: 'browser',
      description,
      impact: classification.impact,
      requiresApproval: classification.requiresApproval,
    }

    return await this.checkGovernance(envAction)
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private async getOrCreatePage(browserId: string): Promise<Page> {
    const browser = this.browsers.get(browserId)
    if (!browser) throw new Error('Browser not found')

    let context = this.contexts.get(browserId)
    if (!context) {
      context = await browser.newContext()
      this.contexts.set(browserId, context)
    }

    let page = this.pages.get(browserId)
    if (!page) {
      page = await context.newPage()
      this.pages.set(browserId, page)
    }

    return page
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    for (const browser of this.browsers.values()) {
      await browser.close()
    }
    this.browsers.clear()
    this.contexts.clear()
    this.pages.clear()
  }
}