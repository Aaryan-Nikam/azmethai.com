/**
 * Tests for Human Behavior Simulator
 *
 * Validates fingerprint randomization and utility functions.
 * Does NOT test Playwright-dependent functions (those need integration tests).
 */

import { describe, it, expect } from "vitest";
import {
    randomFingerprint,
    COMMON_VIEWPORTS,
    COMMON_USER_AGENTS,
    COMMON_TIMEZONES,
} from "./human-behavior.js";

describe("Human Behavior", () => {
    describe("randomFingerprint", () => {
        it("generates a complete fingerprint object", () => {
            const fp = randomFingerprint();

            expect(fp).toHaveProperty("viewport");
            expect(fp).toHaveProperty("userAgent");
            expect(fp).toHaveProperty("timezone");
            expect(fp).toHaveProperty("locale");
            expect(fp).toHaveProperty("colorScheme");
            expect(fp).toHaveProperty("deviceScaleFactor");
        });

        it("uses a real viewport size", () => {
            const fp = randomFingerprint();
            const viewports = COMMON_VIEWPORTS.map((v) => `${v.width}x${v.height}`);
            expect(viewports).toContain(`${fp.viewport.width}x${fp.viewport.height}`);
        });

        it("uses a real user agent string", () => {
            const fp = randomFingerprint();
            const agents = Array.from(COMMON_USER_AGENTS);
            expect(agents).toContain(fp.userAgent);
        });

        it("uses a real timezone", () => {
            const fp = randomFingerprint();
            const timezones = Array.from(COMMON_TIMEZONES);
            expect(timezones).toContain(fp.timezone);
        });

        it("locale is always en-US", () => {
            const fp = randomFingerprint();
            expect(fp.locale).toBe("en-US");
        });

        it("colorScheme is either light or dark", () => {
            const fp = randomFingerprint();
            expect(["light", "dark"]).toContain(fp.colorScheme);
        });

        it("deviceScaleFactor is 1 or 2", () => {
            const fp = randomFingerprint();
            expect([1, 2]).toContain(fp.deviceScaleFactor);
        });

        it("generates different fingerprints (statistical check)", () => {
            // Generate 10 fingerprints and check at least 2 are different
            const fingerprints = Array.from({ length: 10 }, () => randomFingerprint());
            const uniqueAgents = new Set(fingerprints.map((f) => f.userAgent));
            // With 5 user agents and 10 samples, statistically we should get > 1 unique
            expect(uniqueAgents.size).toBeGreaterThan(1);
        });
    });

    describe("viewport pool", () => {
        it("contains realistic screen sizes", () => {
            expect(COMMON_VIEWPORTS.length).toBeGreaterThanOrEqual(5);
            for (const vp of COMMON_VIEWPORTS) {
                expect(vp.width).toBeGreaterThan(1000);
                expect(vp.height).toBeGreaterThan(600);
            }
        });
    });

    describe("user agent pool", () => {
        it("all contain Chrome identifiers", () => {
            for (const ua of COMMON_USER_AGENTS) {
                expect(ua).toContain("Chrome/");
                expect(ua).toContain("AppleWebKit/");
            }
        });
    });
});
