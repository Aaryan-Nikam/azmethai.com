/**
 * @file content.js
 * @description Azmeth Browser Agent — Content Script
 *
 * Injected into every page. Provides a safe helper layer for complex
 * DOM interactions that scripting.executeScript can't handle directly
 * (e.g., shadow DOM, React-controlled inputs, iframe traversal).
 *
 * Listens for messages from the background service worker.
 */

// Content script — runs in every page context
// Currently a lightweight observer; heavy lifting is done via executeScript
// from the background worker for reliability.

console.debug('[Azmeth Content] Loaded on', window.location.hostname)

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'PING') {
    sendResponse({ alive: true, url: window.location.href })
  }
})
