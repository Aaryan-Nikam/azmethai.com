/**
 * Proxy Manager
 *
 * Manages proxy rotation for the stealth browser.
 * Supports residential proxies (BrightData, Oxylabs, SmartProxy, etc.)
 * and open-source/self-hosted SOCKS5/HTTP proxies.
 *
 * Zero LLM cost — pure infrastructure code.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface ProxyConfig {
    /** Proxy server URL (e.g. "http://user:pass@proxy.example.com:8080") */
    server: string;
    /** Optional username (if not embedded in URL) */
    username?: string;
    /** Optional password (if not embedded in URL) */
    password?: string;
    /** Proxy type */
    type: "http" | "https" | "socks5";
    /** Country code for geo-targeting (e.g. "US", "GB") */
    country?: string;
    /** Whether this is a residential IP (harder to detect) */
    isResidential: boolean;
    /** Label for tracking/logging */
    label?: string;
}

export interface ProxyManagerConfig {
    /** List of available proxies to rotate through */
    proxies: ProxyConfig[];
    /** Rotation strategy */
    rotation: "round-robin" | "random" | "sticky";
    /** How long to stick with one proxy in "sticky" mode (ms) */
    stickyDurationMs?: number;
    /** Max failures before a proxy is removed from rotation */
    maxFailures?: number;
}

interface ProxyState {
    proxy: ProxyConfig;
    failures: number;
    lastUsedAt: number;
    requestCount: number;
}

// ─── Proxy Manager ───────────────────────────────────────────────────

export class ProxyManager {
    private pool: ProxyState[] = [];
    private currentIndex = 0;
    private stickyProxy: ProxyState | null = null;
    private stickyStartedAt = 0;
    private config: ProxyManagerConfig;

    constructor(config: ProxyManagerConfig) {
        this.config = config;
        this.pool = config.proxies.map((proxy) => ({
            proxy,
            failures: 0,
            lastUsedAt: 0,
            requestCount: 0,
        }));
    }

    /**
     * Get the next proxy based on the rotation strategy.
     * Returns null if no healthy proxies are available.
     */
    getNext(): ProxyConfig | null {
        const healthy = this.pool.filter(
            (p) => p.failures < (this.config.maxFailures ?? 5),
        );

        if (healthy.length === 0) return null;

        switch (this.config.rotation) {
            case "round-robin": {
                this.currentIndex = this.currentIndex % healthy.length;
                const state = healthy[this.currentIndex];
                this.currentIndex++;
                state.lastUsedAt = Date.now();
                state.requestCount++;
                return state.proxy;
            }

            case "random": {
                const idx = Math.floor(Math.random() * healthy.length);
                const state = healthy[idx];
                state.lastUsedAt = Date.now();
                state.requestCount++;
                return state.proxy;
            }

            case "sticky": {
                const stickyMs = this.config.stickyDurationMs ?? 300_000; // default 5 min
                const now = Date.now();

                if (
                    this.stickyProxy &&
                    now - this.stickyStartedAt < stickyMs &&
                    this.stickyProxy.failures < (this.config.maxFailures ?? 5)
                ) {
                    this.stickyProxy.lastUsedAt = now;
                    this.stickyProxy.requestCount++;
                    return this.stickyProxy.proxy;
                }

                // Pick a new sticky proxy
                const idx = Math.floor(Math.random() * healthy.length);
                this.stickyProxy = healthy[idx];
                this.stickyStartedAt = now;
                this.stickyProxy.lastUsedAt = now;
                this.stickyProxy.requestCount++;
                return this.stickyProxy.proxy;
            }

            default:
                return healthy[0]?.proxy ?? null;
        }
    }

    /**
     * Report a proxy failure. After maxFailures, the proxy is removed from rotation.
     */
    reportFailure(server: string): void {
        const state = this.pool.find((p) => p.proxy.server === server);
        if (state) {
            state.failures++;
        }
    }

    /**
     * Report a proxy success. Resets the failure counter.
     */
    reportSuccess(server: string): void {
        const state = this.pool.find((p) => p.proxy.server === server);
        if (state) {
            state.failures = 0;
        }
    }

    /**
     * Get the count of healthy proxies available.
     */
    healthyCount(): number {
        return this.pool.filter(
            (p) => p.failures < (this.config.maxFailures ?? 5),
        ).length;
    }

    /**
     * Get stats about the proxy pool.
     */
    stats(): { total: number; healthy: number; totalRequests: number } {
        return {
            total: this.pool.length,
            healthy: this.healthyCount(),
            totalRequests: this.pool.reduce((sum, p) => sum + p.requestCount, 0),
        };
    }

    /**
     * Convert a ProxyConfig to Playwright's proxy format.
     */
    static toPlaywrightProxy(proxy: ProxyConfig): {
        server: string;
        username?: string;
        password?: string;
    } {
        return {
            server: proxy.server,
            username: proxy.username,
            password: proxy.password,
        };
    }

    /**
     * Create a ProxyManager from environment variables.
     * Expects: MANTIS_PROXY_LIST = comma-separated proxy URLs
     *          MANTIS_PROXY_ROTATION = round-robin | random | sticky
     */
    static fromEnv(): ProxyManager | null {
        const proxyList = process.env.MANTIS_PROXY_LIST;
        if (!proxyList) return null;

        const proxies: ProxyConfig[] = proxyList.split(",").map((url, i) => {
            const trimmed = url.trim();
            const isSocks = trimmed.startsWith("socks5://");
            const isHttps = trimmed.startsWith("https://");

            return {
                server: trimmed,
                type: isSocks ? "socks5" : isHttps ? "https" : "http",
                isResidential: process.env.MANTIS_PROXY_RESIDENTIAL === "true",
                label: `proxy-${i}`,
            };
        });

        return new ProxyManager({
            proxies,
            rotation: (process.env.MANTIS_PROXY_ROTATION as ProxyManagerConfig["rotation"]) || "round-robin",
            maxFailures: 5,
        });
    }
}
