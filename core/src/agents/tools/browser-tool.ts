import { chromium, Browser, Page } from 'playwright';
import Browserbase from '@browserbasehq/sdk';
import { Tool, ToolDefinition, ToolResult } from '../../types/mantis';
import { streamingManager } from '../../streaming/streaming-manager';

export interface BrowserToolInput {
  action: 'navigate' | 'click' | 'type' | 'screenshot' | 'scroll' | 'wait' | 'extract';
  target?: string;
  value?: string;
  selector?: string;
}

export class BrowserTool implements Tool {
  name = 'browser';
  private browserbase: Browserbase;
  private browser: Browser | null = null;
  private page: Page | null = null;
  private sessionId: string | null = null;
  private streamUrl: string | null = null;

  definition: ToolDefinition = {
    name: 'browser',
    description: 'Control a web browser to navigate websites, extract information, take screenshots. Browser activity is streamed live to the user.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['navigate', 'click', 'type', 'screenshot', 'scroll', 'wait', 'extract'],
          description: 'The browser action to perform'
        },
        target: {
          type: 'string',
          description: 'URL for navigate, CSS selector for click, milliseconds for wait'
        },
        value: {
          type: 'string',
          description: 'Text to type (for type action)'
        },
        selector: {
          type: 'string',
          description: 'CSS selector to extract text from (for extract action)'
        }
      },
      required: ['action']
    }
  };

  constructor() {
    this.browserbase = new Browserbase({
      apiKey: process.env.BROWSERBASE_API_KEY || 'dummy_key'
    });
  }

  async execute(input: BrowserToolInput, sessionId?: string): Promise<ToolResult> {
    try {
      if (sessionId) this.sessionId = sessionId;

      // Initialize browser if not already running
      if (!this.browser) {
        await this.initializeBrowser();
      }

      const { action, target, value, selector } = input;

      // Stream action start to UI
      await this.streamToUI({
        type: 'browser_action',
        action,
        target,
        status: 'starting'
      });

      let result: any;

      switch (action) {
        case 'navigate':
          if (!target) throw new Error('URL required for navigate');
          await this.page!.goto(target, { waitUntil: 'domcontentloaded' });
          result = {
            url: this.page!.url(),
            title: await this.page!.title(),
            streamUrl: this.streamUrl
          };
          break;

        case 'click':
          if (!target) throw new Error('Selector required for click');
          await this.page!.click(target);
          result = {
            clicked: target,
            currentUrl: this.page!.url()
          };
          break;

        case 'type':
          if (!target || !value) throw new Error('Selector and value required for type');
          await this.page!.fill(target, value);
          result = {
            typed: value.substring(0, 50) + '...', // Don't expose full input
            target
          };
          break;

        case 'screenshot':
          const screenshot = await this.page!.screenshot({
            fullPage: false,
            type: 'jpeg',
            quality: 80
          });
          result = {
            screenshot: screenshot.toString('base64'),
            url: this.page!.url()
          };
          break;

        case 'scroll':
          await this.page!.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
          });
          result = {
            scrolled: true,
            position: await this.page!.evaluate(() => window.scrollY)
          };
          break;

        case 'wait':
          const duration = parseInt(target || '1000');
          await this.page!.waitForTimeout(duration);
          result = {
            waited: duration,
            currentUrl: this.page!.url()
          };
          break;

        case 'extract':
          if (!selector) throw new Error('Selector required for extract');
          const text = await this.page!.textContent(selector);
          result = {
            extracted: text,
            from: selector
          };
          break;

        default:
          throw new Error(`Unknown browser action: ${action}`);
      }

      // Stream success to UI
      await this.streamToUI({
        type: 'browser_action',
        action,
        status: 'complete',
        result
      });

      return {
        success: true,
        data: result,
        sources: [this.page!.url()],
        toolName: 'browser'
      };

    } catch (error: any) {
      // Stream error to UI
      await this.streamToUI({
        type: 'browser_action',
        action: input.action,
        status: 'error',
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        toolName: 'browser'
      };
    }
  }

  private async initializeBrowser(): Promise<void> {
    try {
      // Create Browserbase session (includes streaming URL)
      const session = await this.browserbase.sessions.create({
        projectId: process.env.BROWSERBASE_PROJECT_ID || 'dummy_project',
        // Enable debugging/live view
        browserSettings: {
          viewport: { width: 1280, height: 720 }
        }
      });

      this.sessionId = session.id;
      // In newer browserbase SDK, streaming might be accessed differently, we just map it for now
      this.streamUrl = `https://www.browserbase.com/sessions/${session.id}`;

      // Connect Playwright to Browserbase
      this.browser = await chromium.connectOverCDP(session.connectUrl);

      // Get the default context and page
      const contexts = this.browser.contexts();
      const context = contexts[0];
      const pages = context.pages();
      this.page = pages[0] || await context.newPage();

      console.log('[BrowserTool] Initialized:', {
        sessionId: this.sessionId,
        streamUrl: this.streamUrl
      });

      // Send stream URL to UI
      await this.streamToUI({
        type: 'browser_initialized',
        streamUrl: this.streamUrl
      });

    } catch (error) {
      console.error('[BrowserTool] Initialization failed:', error);
      throw error;
    }
  }

  private async streamToUI(data: any): Promise<void> {
    if (!this.sessionId) return;

    if (data.type === 'browser_initialized') {
      streamingManager.streamBrowserInit(this.sessionId, data.streamUrl);
    } else if (data.type === 'browser_action') {
      streamingManager.streamBrowserAction(this.sessionId, data.action, data.status, data);
    }
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export const createBrowserTool = undefined as any;
