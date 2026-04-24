// Content script injected into every page
// Handles DOM reading and stealthy actions

console.log("Claude Workspace content script loaded!");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_DOM') {
    const info = await extractPageInfo();
    sendResponse(info);
    return true; // async stringification might take a tiny bit
  }

  if (request.type === 'PERFORM_ACTION') {
    // LLM asked us to perform a physical action on the page
    console.log("Received action request:", request.payload);
    performAction(request.payload).then(res => {
        console.log("Action result:", res);
        sendResponse(res);
    });
    return true; // async
  }
});

async function extractPageInfo() {
  // Enhanced DOM extraction for the LLM
  // We can return the full text content, or a simplified accessibility tree
  
  // Clone body to manipulate without affecting real page
  const bodyClone = document.body.cloneNode(true) as HTMLElement;
  
  // Remove scripts, styles, noscript, svg, path to save tokens
  const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'IFRAME'];
  skipTags.forEach(tag => {
      const els = bodyClone.getElementsByTagName(tag);
      for (let i = els.length - 1; i >= 0; i--) {
          els[i].parentNode?.removeChild(els[i]);
      }
  });

  return {
    title: document.title,
    url: window.location.href,
    textContent: bodyClone.innerText.substring(0, 100000), // Safety limit
    htmlSnippet: bodyClone.innerHTML.substring(0, 50000), // Raw structure snippet
    elementCount: document.querySelectorAll('*').length
  };
}

async function performAction(actionDef: any) {
  try {
    const selector = actionDef.selector;
    const el = document.querySelector(selector) as HTMLElement;

    if (!el && actionDef.action !== 'scroll' && actionDef.action !== 'wait') {
        return { success: false, error: `Element not found: ${selector}` };
    }

    switch(actionDef.action) {
        case 'click':
            // Stealthy click: ensure element is in view, simulate hover, then click
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(r => setTimeout(r, 200 + Math.random() * 300)); // Human delay
            el.click();
            return { success: true };

        case 'type':
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
            await new Promise(r => setTimeout(r, 100)); // Human delay
            // React inputs need native value setter patched
            const inputEl = el as HTMLInputElement;
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
            nativeInputValueSetter?.call(inputEl, actionDef.text);
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            return { success: true };
            
        case 'scroll':
            const direction = actionDef.direction || 'down';
            const amount = actionDef.amount || window.innerHeight / 2;
            window.scrollBy({
                top: direction === 'down' ? amount : -amount,
                behavior: 'smooth'
            });
            await new Promise(r => setTimeout(r, 500));
            return { success: true };
            
        case 'extract_selector':
            // Extract HTML of a specific sub-tree
             return { success: true, content: el.outerHTML, text: el.innerText };
             
        case 'wait':
             await new Promise(r => setTimeout(r, actionDef.ms || 1000));
             return { success: true };

        default:
            return { success: false, error: `Unknown action: ${actionDef.action}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
