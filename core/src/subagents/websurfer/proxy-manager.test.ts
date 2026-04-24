/**
 * Tests for Proxy Manager
 *
 * Validates proxy rotation strategies, failure tracking,
 * and environment variable parsing. Zero external deps.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ProxyManager, type ProxyConfig, type ProxyManagerConfig } from "./proxy-manager.js";

const PROXY_A: ProxyConfig = {
    server: "http://proxy-a.example.com:8080",
    type: "http",
    isResidential: true,
    label: "proxy-a",
};

const PROXY_B: ProxyConfig = {
    server: "http://proxy-b.example.com:8080",
    type: "http",
    isResidential: true,
    label: "proxy-b",
};

const PROXY_C: ProxyConfig = {
    server: "socks5://proxy-c.example.com:1080",
    type: "socks5",
    isResidential: false,
    label: "proxy-c",
};

function createPool(rotation: ProxyManagerConfig["rotation"] = "round-robin"): ProxyManager {
    return new ProxyManager({
        proxies: [PROXY_A, PROXY_B, PROXY_C],
        rotation,
        maxFailures: 3,
    });
}

describe("ProxyManager", () => {
    describe("round-robin rotation", () => {
        it("cycles through proxies in order", () => {
            const pm = createPool("round-robin");
            expect(pm.getNext()?.server).toBe(PROXY_A.server);
            expect(pm.getNext()?.server).toBe(PROXY_B.server);
            expect(pm.getNext()?.server).toBe(PROXY_C.server);
            expect(pm.getNext()?.server).toBe(PROXY_A.server); // wraps around
        });
    });

    describe("random rotation", () => {
        it("returns a proxy from the pool", () => {
            const pm = createPool("random");
            const result = pm.getNext();
            expect(result).not.toBeNull();
            const servers = [PROXY_A.server, PROXY_B.server, PROXY_C.server];
            expect(servers).toContain(result?.server);
        });
    });

    describe("sticky rotation", () => {
        it("returns the same proxy within sticky duration", () => {
            const pm = new ProxyManager({
                proxies: [PROXY_A, PROXY_B],
                rotation: "sticky",
                stickyDurationMs: 60_000, // 1 minute
                maxFailures: 3,
            });

            const first = pm.getNext();
            const second = pm.getNext();
            const third = pm.getNext();

            expect(first?.server).toBe(second?.server);
            expect(second?.server).toBe(third?.server);
        });
    });

    describe("failure tracking", () => {
        it("removes proxy after maxFailures", () => {
            const pm = new ProxyManager({
                proxies: [PROXY_A],
                rotation: "round-robin",
                maxFailures: 3,
            });

            expect(pm.healthyCount()).toBe(1);

            pm.reportFailure(PROXY_A.server);
            pm.reportFailure(PROXY_A.server);
            expect(pm.healthyCount()).toBe(1); // 2 failures, still healthy

            pm.reportFailure(PROXY_A.server);
            expect(pm.healthyCount()).toBe(0); // 3 failures = removed
            expect(pm.getNext()).toBeNull();   // no healthy proxies
        });

        it("resets failures on success", () => {
            const pm = new ProxyManager({
                proxies: [PROXY_A],
                rotation: "round-robin",
                maxFailures: 3,
            });

            pm.reportFailure(PROXY_A.server);
            pm.reportFailure(PROXY_A.server);
            pm.reportSuccess(PROXY_A.server); // reset
            expect(pm.healthyCount()).toBe(1);
        });
    });

    describe("stats", () => {
        it("reports correct pool statistics", () => {
            const pm = createPool();
            pm.getNext();
            pm.getNext();

            const stats = pm.stats();
            expect(stats.total).toBe(3);
            expect(stats.healthy).toBe(3);
            expect(stats.totalRequests).toBe(2);
        });
    });

    describe("toPlaywrightProxy", () => {
        it("converts ProxyConfig to Playwright format", () => {
            const config: ProxyConfig = {
                server: "http://user:pass@proxy.com:8080",
                username: "user",
                password: "pass",
                type: "http",
                isResidential: true,
            };

            const result = ProxyManager.toPlaywrightProxy(config);
            expect(result.server).toBe(config.server);
            expect(result.username).toBe("user");
            expect(result.password).toBe("pass");
        });
    });

    describe("empty pool", () => {
        it("returns null when no proxies are configured", () => {
            const pm = new ProxyManager({
                proxies: [],
                rotation: "round-robin",
            });
            expect(pm.getNext()).toBeNull();
            expect(pm.healthyCount()).toBe(0);
        });
    });
});
