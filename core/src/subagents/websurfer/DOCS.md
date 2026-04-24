# Websurfer Subagent — Documentation

**File**: `src/subagents/websurfer/`
**Type**: Subagent (uses LLM for extraction step only)
**Used By**: Growth Agent, Content Agent, Analytics Agent, *any expert agent as fallback*

---

## What It Does

The Websurfer can access any website in two ways:

1. **Fetch Mode** (fast, cheap) — HTTP request + HTML parsing. For public pages.
2. **Browser Mode** (stealth, interactive) — Full Chromium browser with anti-detection. For logins, JS-rendered pages, and interactive workflows on third-party platforms.

When an Expert Agent's API call fails, the Websurfer's browser mode is the **fallback** — it opens the platform directly and does what a human would do.

---

## How It Works

### Mode 1: Fetch (Default)

```
Input: { goal: "Find pricing info", params: { url: "https://acme.com", mode: "fetch" } }
                              │
                              ▼
              ┌─────────────────────────────────┐
              │  Step 1: HTTP FETCH             │
              │  Standard GET request           │
              │  Uses real Chrome user-agent    │
              │  15-second timeout              │
              └───────────────┬─────────────────┘
                              │ raw HTML
                              ▼
              ┌─────────────────────────────────┐
              │  Step 2: PARSE (linkedom)       │
              │  Strip scripts, styles, nav     │
              │  Cap at 15,000 characters       │
              └───────────────┬─────────────────┘
                              │ clean text
                              ▼
              ┌─────────────────────────────────┐
              │  Step 3: LLM EXTRACT (Haiku)    │
              │  Structured JSON extraction     │
              └───────────────┬─────────────────┘
                              │
                              ▼
                     SubagentResult (~$0.001)
```

### Mode 2: Browser (Stealth)

```
Input: { 
  goal: "Get account dashboard data",
  params: { 
    url: "https://platform.com/login", 
    mode: "browser",
    actions: [
      { action: "type", selector: "#email", value: "user@example.com" },
      { action: "type", selector: "#password", value: "secret" },
      { action: "click", selector: "#login-btn" },
      { action: "wait", selector: ".dashboard" }
    ]
  }
}
                              │
                              ▼
              ┌─────────────────────────────────┐
              │  Step 1: LAUNCH STEALTH BROWSER │
              │  • Random fingerprint           │
              │  • Proxy rotation               │
              │  • Anti-detection patches       │
              └───────────────┬─────────────────┘
                              │
                              ▼
              ┌─────────────────────────────────┐
              │  Step 2: NAVIGATE               │
              │  • Go to URL                    │
              │  • Human-like page exploration   │
              │  • Bezier mouse movements        │
              └───────────────┬─────────────────┘
                              │
                              ▼
              ┌─────────────────────────────────┐
              │  Step 3: EXECUTE ACTIONS         │
              │  • Type with variable speed      │
              │  • Click with natural hesitation │
              │  • Wait for elements to appear   │
              └───────────────┬─────────────────┘
                              │
                              ▼
              ┌─────────────────────────────────┐
              │  Step 4: EXTRACT PAGE CONTENT    │
              │  + LLM structured extraction     │
              └───────────────┬─────────────────┘
                              │
                              ▼
              ┌─────────────────────────────────┐
              │  Step 5: SAVE STATE & CLOSE     │
              │  • Persist cookies for reuse     │
              │  • Close browser cleanly         │
              └─────────────────────────────────┘
                              │
                              ▼
                     SubagentResult (~$0.002)
```

---

## Anti-Detection Measures

| Layer | What It Does | How |
| :--- | :--- | :--- |
| **Stealth Patches** | Defeats common bot detectors | Removes `navigator.webdriver`, adds `chrome.runtime` stub, fakes plugins, fixes Permissions API |
| **Fingerprint Randomization** | Each session looks like a different real device | Random viewport, user-agent, timezone, device scale factor from real device pools |
| **Human Behavior** | Actions look human, not robotic | Bezier curve mouse movements, variable-speed typing, natural scroll with reading pauses |
| **Proxy Rotation** | Different IP per session | Round-robin, random, or sticky rotation. Supports residential IPs. Auto-removes dead proxies |
| **Session Persistence** | Remembers logins | Cookies and storage saved to disk between sessions |

---

## Capabilities

| Capability | Fetch | Browser |
| :--- | :--- | :--- |
| Public page scraping | ✅ | ✅ |
| JavaScript-rendered content | ❌ | ✅ |
| Login / sign-in | ❌ | ✅ |
| Form submission | ❌ | ✅ |
| Click, type, scroll | ❌ | ✅ |
| Anti-detection | ❌ | ✅ |
| Proxy rotation | ❌ | ✅ |
| Session persistence | ❌ | ✅ |
| Screenshot on failure | ❌ | ✅ |
| Speed | Fast (~1s) | Slower (~5-15s) |
| Cost | ~$0.001 | ~$0.002 |

---

## File Structure

| File | Purpose |
| :--- | :--- |
| `websurfer.ts` | Main subagent — dual-mode router (fetch vs browser) |
| `stealth-browser.ts` | Playwright wrapper with anti-detection (standalone + Docker sandbox) |
| `human-behavior.ts` | Mouse, typing, scrolling simulation + fingerprint randomization |
| `proxy-manager.ts` | Proxy pool with rotation strategies and failure tracking |
| `websurfer.test.ts` | Unit tests — fetch mode (6 tests) |
| `proxy-manager.test.ts` | Unit tests — proxy rotation and failure tracking (8 tests) |
| `human-behavior.test.ts` | Unit tests — fingerprint and behavior pools (10 tests) |
| `DOCS.md` | This file |

---

## Proxy Setup

Set environment variables to enable proxy rotation:

```bash
# Comma-separated proxy URLs
MANTIS_PROXY_LIST="http://user:pass@resi1.proxy.com:8080,http://user:pass@resi2.proxy.com:8080"

# Rotation strategy: round-robin | random | sticky
MANTIS_PROXY_ROTATION="round-robin"

# Whether these are residential IPs
MANTIS_PROXY_RESIDENTIAL="true"
```

**Recommended providers**: BrightData, Oxylabs, SmartProxy, or self-hosted via [proxy-chain](https://github.com/apify/proxy-chain) (open source).

---

## Example Usage

### Simple scrape (fetch mode)
```typescript
const websurfer = createWebsurfer(myLlmFn);
const result = await websurfer.execute({
  goal: "Extract company name, pricing, and employee count",
  params: { url: "https://acme.com/about" },
});
```

### Login + extract (browser mode)
```typescript
const websurfer = createWebsurfer(myLlmFn, { storagePath: "./sessions/facebook.json" });
const result = await websurfer.execute({
  goal: "Get ad performance data for the last 7 days",
  params: {
    url: "https://business.facebook.com/adsmanager",
    mode: "browser",
    actions: [
      { action: "type", selector: "#email", value: "user@company.com" },
      { action: "type", selector: "#pass", value: "password123" },
      { action: "click", selector: "#loginbutton" },
      { action: "wait", selector: "[data-testid='ad-table']" },
    ],
  },
});
```

---

## Update Log

| Date | Change | Author |
| :--- | :--- | :--- |
| 2026-02-17 | Initial implementation — fetch mode only | Mantis Engineering |
| 2026-02-17 | Added stealth browser mode with anti-detection, proxy rotation, human behavior, session persistence, and interactive actions | Mantis Engineering |
| 2026-02-17 | Refactored stealth browser for dual launch: standalone (dev) + Docker sandbox (production security). 24/24 tests. | Mantis Engineering |
