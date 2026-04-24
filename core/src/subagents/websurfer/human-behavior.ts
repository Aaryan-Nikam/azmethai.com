/**
 * Human Behavior Simulator
 *
 * Makes browser automation look human by mimicking natural interaction patterns:
 *   - Mouse movements with realistic curves (not straight lines)
 *   - Typing with variable speed and occasional pauses
 *   - Natural scroll patterns (not instant jumps)
 *   - Random micro-delays between actions
 *   - Viewport and timezone fingerprint randomization
 *
 * Zero LLM cost — pure code.
 */

import type { Page } from "playwright-core";

// ─── Random Helpers ──────────────────────────────────────────────────

/** Random integer between min and max (inclusive). */
function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random float between min and max. */
function randFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/** Sleep for a random duration within a range. */
export function humanDelay(minMs: number, maxMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, randInt(minMs, maxMs)));
}

// ─── Mouse Movement ─────────────────────────────────────────────────

/**
 * Generate Bezier curve points between two positions.
 * Humans don't move mice in straight lines — they curve slightly.
 */
function bezierPoints(
    startX: number, startY: number,
    endX: number, endY: number,
    steps: number,
): Array<{ x: number; y: number }> {
    // Two random control points create a natural-looking curve
    const cp1x = startX + (endX - startX) * randFloat(0.2, 0.5) + randFloat(-50, 50);
    const cp1y = startY + (endY - startY) * randFloat(0.1, 0.3) + randFloat(-50, 50);
    const cp2x = startX + (endX - startX) * randFloat(0.5, 0.8) + randFloat(-30, 30);
    const cp2y = startY + (endY - startY) * randFloat(0.7, 0.9) + randFloat(-30, 30);

    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const u = 1 - t;
        const x = u * u * u * startX + 3 * u * u * t * cp1x + 3 * u * t * t * cp2x + t * t * t * endX;
        const y = u * u * u * startY + 3 * u * u * t * cp1y + 3 * u * t * t * cp2y + t * t * t * endY;
        points.push({ x: Math.round(x), y: Math.round(y) });
    }
    return points;
}

/**
 * Move mouse to a target position with a human-like curved path.
 */
export async function humanMouseMove(page: Page, targetX: number, targetY: number): Promise<void> {
    const viewport = page.viewportSize() ?? { width: 1280, height: 720 };

    // Start from a reasonable current position (center-ish if unknown)
    const startX = randInt(viewport.width * 0.3, viewport.width * 0.7);
    const startY = randInt(viewport.height * 0.3, viewport.height * 0.7);

    const steps = randInt(15, 35); // Number of intermediate points
    const points = bezierPoints(startX, startY, targetX, targetY, steps);

    for (const point of points) {
        await page.mouse.move(point.x, point.y);
        await humanDelay(5, 25); // Tiny delay between each micro-movement
    }
}

/**
 * Click on an element with human-like behavior:
 * 1. Move mouse to the element with a natural curve
 * 2. Short pause before clicking (humans hesitate slightly)
 * 3. Click with a natural press-release duration
 */
export async function humanClick(page: Page, selector: string): Promise<void> {
    const element = page.locator(selector).first();
    const box = await element.boundingBox();

    if (!box) {
        // Fallback: just click the selector directly
        await element.click();
        return;
    }

    // Aim slightly off-center (humans don't click dead center)
    const targetX = box.x + box.width * randFloat(0.3, 0.7);
    const targetY = box.y + box.height * randFloat(0.3, 0.7);

    await humanMouseMove(page, targetX, targetY);
    await humanDelay(50, 200); // Pre-click hesitation
    await page.mouse.click(targetX, targetY, { delay: randInt(30, 100) });
    await humanDelay(100, 400); // Post-click pause
    await humanDelay(100, 400); // Post-click pause
}

/**
 * Move the mouse slightly in a random direction.
 * Simulates "micro-jitters" or "subconscious" movements.
 */
export async function humanMicroJitter(page: Page): Promise<void> {
    const mouse = page.mouse;
    const viewport = page.viewportSize() ?? { width: 1280, height: 720 };

    // Get current position (approximated or tracked if needed, but relative jitter is fine)
    // We'll move to a random point nearby
    const x = randInt(0, viewport.width);
    const y = randInt(0, viewport.height);

    // Small random movements (2-5 times)
    for (let i = 0; i < randInt(2, 5); i++) {
        const deltaX = randInt(-50, 50);
        const deltaY = randInt(-50, 50);
        await mouse.move(x + deltaX, y + deltaY, { steps: randInt(2, 10) });
        await humanDelay(50, 200);
    }
}

/**
 * Simulate a user reading the page content.
 * Pauses for a duration, but includes micro-movements to avoid "dead" state.
 */
export async function humanReadingPause(page: Page, durationMs: number = 2000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < durationMs) {
        // 30% chance to micro-jitter
        if (Math.random() < 0.3) {
            await humanMicroJitter(page);
        }

        // Wait a chunk of time
        const chunk = Math.min(randInt(500, 1500), durationMs - (Date.now() - startTime));
        if (chunk > 0) await humanDelay(chunk, chunk + 200);
    }
}

// ─── Typing ─────────────────────────────────────────────────────────

/**
 * Type text at the current cursor position with human-like behavior.
 * Does NOT click first — assumes the element is already focused.
 * Features:
 * - Variable speed (bursts)
 * - Occasional typos and corrections
 * - Thinking pauses
 */
export async function humanPressKeys(page: Page, text: string): Promise<void> {
    const TYPO_RATE = 0.03; // 3% chance of typo per char

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        // 1. Maybe make a typo
        if (Math.random() < TYPO_RATE) {
            const nearbyKeys: Record<string, string> = {
                'a': 's', 's': 'd', 'd': 'f', 'f': 'g', 'j': 'k', 'k': 'l',
                'q': 'w', 'w': 'e', 'e': 'r', 'r': 't', 't': 'y', 'y': 'u',
                'o': 'p', 'p': '[', 'z': 'x', 'x': 'c', 'c': 'v', 'v': 'b',
                'n': 'm', 'm': ','
            };
            const typo = nearbyKeys[char.toLowerCase()] ?? char;
            if (typo !== char) {
                await page.keyboard.type(typo, { delay: randInt(20, 80) });
                await humanDelay(50, 200); // Realize mistake
                await page.keyboard.press("Backspace", { delay: randInt(30, 70) });
                await humanDelay(50, 150); // Recover
            }
        }

        // 2. Determine delay for this keystroke
        let delay = randInt(30, 120); // Base speed (faster than before)

        // Burst typing: sometimes we speed up
        if (Math.random() < 0.2) delay = randInt(10, 40);

        // Pause at word boundaries
        if (char === " " || char === "." || char === ",") {
            delay = randInt(80, 200);
        }

        // Occasional "thinking" pause (2% chance)
        if (Math.random() < 0.02) {
            delay = randInt(300, 800);
        }

        await page.keyboard.type(char, { delay: 0 }); // Playwright delay is additional
        await humanDelay(delay * 0.8, delay * 1.2);
    }
}

/**
 * Type text with human-like variable speed.
 * Focuses the element by clicking, then types.
 */
export async function humanType(page: Page, selector: string, text: string): Promise<void> {
    await humanClick(page, selector); // Focus the field first
    await humanDelay(200, 500); // Pause before typing starts
    await humanPressKeys(page, text);
}

// ─── Scrolling ──────────────────────────────────────────────────────

/**
 * Scroll down the page in a human-like pattern.
 * - Variable scroll amounts (not uniform)
 * - Occasional pauses (reading)
 * - Occasionally scrolls up a bit (re-reading)
 */
export async function humanScroll(
    page: Page,
    options?: { scrolls?: number; direction?: "down" | "up" },
): Promise<void> {
    const scrollCount = options?.scrolls ?? randInt(3, 8);
    const direction = options?.direction ?? "down";
    const multiplier = direction === "down" ? 1 : -1;

    for (let i = 0; i < scrollCount; i++) {
        const amount = randInt(100, 400) * multiplier;
        await page.mouse.wheel(0, amount);

        // Reading pause — longer for some scrolls (simulating reading)
        if (Math.random() < 0.3) {
            await humanDelay(1500, 4000); // Longer reading pause
        } else {
            await humanDelay(300, 1000); // Normal scroll pause
        }

        // Occasionally scroll back up a tiny bit (re-reading, 15% chance)
        if (Math.random() < 0.15 && direction === "down") {
            await page.mouse.wheel(0, -randInt(50, 150));
            await humanDelay(500, 1500);
        }
    }
}

// ─── Page Interaction Patterns ──────────────────────────────────────

/**
 * Wait and explore — mimics a human landing on a page.
 * Looks around, scrolls a bit, reads content.
 */
export async function humanPageExplore(page: Page): Promise<void> {
    // Initial page load — wait and look around
    await humanDelay(1000, 3000);

    // Move mouse around randomly (looking at different parts)
    const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
    for (let i = 0; i < randInt(2, 4); i++) {
        const x = randInt(100, viewport.width - 100);
        const y = randInt(100, viewport.height - 100);
        await humanMouseMove(page, x, y);
        await humanDelay(500, 2000);
    }

    // Scroll down to explore content
    await humanScroll(page, { scrolls: randInt(2, 5) });
}

// ─── Fingerprint Randomization ──────────────────────────────────────

/** Common viewport sizes that look natural (real device sizes). */
export const COMMON_VIEWPORTS = [
    { width: 1920, height: 1080 }, // Full HD (most common)
    { width: 1366, height: 768 },  // HD laptop
    { width: 1440, height: 900 },  // MacBook standard
    { width: 1536, height: 864 },  // Windows laptop
    { width: 1280, height: 720 },  // HD
    { width: 2560, height: 1440 }, // QHD
    { width: 1680, height: 1050 }, // MacBook Pro
] as const;

/** Common timezone IDs for US-based browsing. */
export const COMMON_TIMEZONES = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
] as const;

/** Common user-agent strings (Chrome on Windows/Mac). */
export const COMMON_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
] as const;

export interface BrowserFingerprint {
    viewport: { width: number; height: number };
    userAgent: string;
    timezone: string;
    locale: string;
    colorScheme: "light" | "dark";
    deviceScaleFactor: number;
}

/**
 * Generate a random but consistent browser fingerprint.
 * Uses real device characteristics so it looks natural.
 */
export function randomFingerprint(): BrowserFingerprint {
    const viewport = COMMON_VIEWPORTS[randInt(0, COMMON_VIEWPORTS.length - 1)];
    const userAgent = COMMON_USER_AGENTS[randInt(0, COMMON_USER_AGENTS.length - 1)];
    const timezone = COMMON_TIMEZONES[randInt(0, COMMON_TIMEZONES.length - 1)];

    return {
        viewport: { width: viewport.width, height: viewport.height },
        userAgent,
        timezone,
        locale: "en-US",
        colorScheme: Math.random() > 0.3 ? "light" : "dark",
        deviceScaleFactor: Math.random() > 0.5 ? 2 : 1, // Retina vs non-retina
    };
}
