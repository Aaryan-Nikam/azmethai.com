/**
 * BrowserSessionManager.ts
 * 
 * Manages a single persistent Chromium instance shared across all browser tasks.
 * All tasks reuse this session — cookies, auth, localStorage are preserved.
 * Connects via CDP so the browser outlives any single agent execution.
 */

import { chromium, Browser, BrowserContext, Page, CDPSession, BrowserServer } from 'playwright';
import { EventEmitter } from 'events';

export interface SessionConfig {
  headless: boolean;           // false for visual debugging, true for production
  cdpPort: number;             // default 9222
  remoteDebuggingUrl?: string;  // connect to an existing browser via CDP
  userDataDir?: string;        // persist cookies/auth across restarts
  viewportWidth: number;
  viewportHeight: number;
  recordVideo?: boolean;       // write video to audit dir for IronPass
  auditDir?: string;
}

export interface ActivePage {
  id: string;
  page: Page;
  cdpSession: CDPSession;
  createdAt: Date;
  lastUsedAt: Date;
  taskId?: string;
}

const DEFAULT_CONFIG: SessionConfig = {
  headless: false,
  cdpPort: 9222,
  viewportWidth: 1280,
  viewportHeight: 800,
  recordVideo: true,
  auditDir: './audit/browser-sessions',
};

export class BrowserSessionManager extends EventEmitter {
  private static instance: BrowserSessionManager;
  private browser: Browser | null = null;
  private browserServer: BrowserServer | null = null;
  private context: BrowserContext | null = null;
  private pages: Map<string, ActivePage> = new Map();
  private config: SessionConfig;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor(config: Partial<SessionConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<SessionConfig>): BrowserSessionManager {
    if (!BrowserSessionManager.instance) {
      BrowserSessionManager.instance = new BrowserSessionManager(config);
    }
    return BrowserSessionManager.instance;
  }

  /**
   * Initialize the persistent browser session.
   * Call once at agent startup — not per task.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const remoteDebuggingUrl = this.config.remoteDebuggingUrl ||
        process.env.BROWSER_REMOTE_DEBUGGING_URL ||
        (process.env.CDP_PORT ? `http://127.0.0.1:${process.env.CDP_PORT}` : undefined);

      if (remoteDebuggingUrl) {
        this.browser = await chromium.connectOverCDP(remoteDebuggingUrl);
        // Always create a new context for isolation, even when connecting to existing browser
        this.context = await this.browser.newContext({
          viewport: {
            width: this.config.viewportWidth,
            height: this.config.viewportHeight,
          },
          recordVideo: this.config.recordVideo ? {
            dir: this.config.auditDir!,
          } : undefined,
        });
        console.log(`[BrowserSessionManager] Connected to remote Chrome and created new context at ${remoteDebuggingUrl}`);
      } else if (this.config.userDataDir) {
        this.context = await chromium.launchPersistentContext(this.config.userDataDir, {
          headless: this.config.headless,
          viewport: {
            width: this.config.viewportWidth,
            height: this.config.viewportHeight,
          },
          recordVideo: this.config.recordVideo ? {
            dir: this.config.auditDir!,
          } : undefined,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
          ],
        })
        this.browser = this.context.browser()
      } else {
        this.browser = await chromium.launch({
          headless: this.config.headless,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled', // avoid bot detection
          ],
        })

        this.context = await this.browser.newContext({
          viewport: {
            width: this.config.viewportWidth,
            height: this.config.viewportHeight,
          },
          recordVideo: this.config.recordVideo ? {
            dir: this.config.auditDir!,
          } : undefined,
        });
      }

      // Inject stealth scripts to avoid bot detection on all pages
      if (this.context) {
        await this.context.addInitScript(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });
      }

      this.isInitialized = true;
      this.startHeartbeat();
      this.emit('initialized');

      if (this.config.userDataDir) {
        console.log(`[BrowserSessionManager] Initialized with persistent user data dir: ${this.config.userDataDir}`);
      } else {
        console.log(`[BrowserSessionManager] Initialized on CDP port ${this.config.cdpPort}`);
      }
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Failed to initialize browser session: ${error}`);
    }
  }

  /**
   * Get or create a page for a given task.
   * Tasks that need isolation get their own page; shared tasks reuse one.
   */
  async getPage(taskId: string, isolated = false): Promise<ActivePage> {
    if (!this.isInitialized || !this.context) {
      await this.initialize();
    }

    // Return existing page for this task if available
    const existing = this.findPageForTask(taskId);
    if (existing && !isolated) {
      existing.lastUsedAt = new Date();
      return existing;
    }

    // Create a new page
    const page = await this.context!.newPage();
    const cdpSession = await page.context().newCDPSession(page);

    // Enable network monitoring for IronPass audit
    await cdpSession.send('Network.enable');
    await cdpSession.send('Page.enable');

    // Intercept network requests for governance
    cdpSession.on('Network.requestWillBeSent', (params) => {
      this.emit('network:request', { taskId, ...params });
    });

    const activePage: ActivePage = {
      id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      page,
      cdpSession,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      taskId,
    };

    this.pages.set(activePage.id, activePage);
    this.emit('page:created', { pageId: activePage.id, taskId });

    return activePage;
  }

  /**
   * Release a page when a task completes.
   * Saves video artifact for IronPass audit trail.
   */
  async releasePage(pageId: string, taskId: string): Promise<string | null> {
    const activePage = this.pages.get(pageId);
    if (!activePage) return null;

    let videoPath: string | null = null;

    try {
      // Save video recording if enabled
      if (this.config.recordVideo) {
        const video = activePage.page.video();
        if (video) {
          videoPath = await video.path();
          console.log(`[BrowserSessionManager] Video saved: ${videoPath} for task ${taskId}`);
        }
      }

      await activePage.cdpSession.detach();
      await activePage.page.close();
      this.pages.delete(pageId);
      this.emit('page:released', { pageId, taskId, videoPath });
    } catch (error) {
      console.error(`[BrowserSessionManager] Error releasing page ${pageId}:`, error);
    }

    return videoPath;
  }

  /**
   * Take a screenshot from a specific page — read-only, always auto-approved.
   */
  async screenshot(pageId: string): Promise<Buffer> {
    const activePage = this.pages.get(pageId);
    if (!activePage) throw new Error(`Page ${pageId} not found`);

    activePage.lastUsedAt = new Date();
    return await activePage.page.screenshot({ fullPage: false });
  }

  /**
   * Graceful shutdown — save all videos, close browser.
   */
  async shutdown(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    for (const [pageId, activePage] of this.pages) {
      try {
        if (this.config.recordVideo) {
          const video = activePage.page.video();
          if (video) await video.path(); // finalize video
        }
        await activePage.page.close();
      } catch { /* best effort */ }
    }

    this.pages.clear();
    
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    if (this.browserServer) await this.browserServer.close();
    
    this.isInitialized = false;
    this.emit('shutdown');
    console.log('[BrowserSessionManager] Shutdown complete');
  }

  getActivePagesCount(): number {
    return this.pages.size;
  }

  isReady(): boolean {
    return this.isInitialized && this.browser !== null;
  }

  private findPageForTask(taskId: string): ActivePage | undefined {
    for (const page of this.pages.values()) {
      if (page.taskId === taskId) return page;
    }
    return undefined;
  }

  /**
   * Heartbeat: check browser is still alive, restart if crashed.
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (!this.browser?.isConnected()) {
        console.warn('[BrowserSessionManager] Browser disconnected — reinitializing');
        this.isInitialized = false;
        this.pages.clear();
        await this.initialize();
      }
    }, 10_000);
  }
}