const STORAGE_KEY = "copyPasteBypassEnabled";
const STORAGE_KEY_CTRL = "ctrlKeyBypassEnabled";

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.sync.get([STORAGE_KEY, STORAGE_KEY_CTRL]);
  const updates = {};
  if (typeof stored[STORAGE_KEY] !== "boolean") {
    updates[STORAGE_KEY] = true;
  }
  if (typeof stored[STORAGE_KEY_CTRL] !== "boolean") {
    updates[STORAGE_KEY_CTRL] = true;
  }
  if (Object.keys(updates).length) {
    await chrome.storage.sync.set(updates);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return;
  }

  if (message.type === "GET_BYPASS_STATE") {
    chrome.storage.sync
      .get([STORAGE_KEY, STORAGE_KEY_CTRL])
      .then((stored) => {
        sendResponse({
          enabled: stored[STORAGE_KEY] !== false,
          ctrlKeyEnabled: stored[STORAGE_KEY_CTRL] !== false
        });
      })
      .catch(() => sendResponse({ enabled: true, ctrlKeyEnabled: true }));
    return true;
  }

  if (message.type === "SET_BYPASS_STATE") {
    const enabled = Boolean(message.enabled);
    chrome.storage.sync
      .set({ [STORAGE_KEY]: enabled })
      .then(async () => {
        const tabs = await chrome.tabs.query({});
        await Promise.all(
          tabs
            .filter((tab) => typeof tab.id === "number")
            .map((tab) =>
              chrome.tabs
                .sendMessage(tab.id, { type: "BYPASS_STATE_CHANGED", enabled })
                .catch(() => null)
            )
        );
        sendResponse({ ok: true, enabled });
      })
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "SET_CTRL_BYPASS_STATE") {
    const enabled = Boolean(message.enabled);
    chrome.storage.sync
      .set({ [STORAGE_KEY_CTRL]: enabled })
      .then(async () => {
        const tabs = await chrome.tabs.query({});
        await Promise.all(
          tabs
            .filter((tab) => typeof tab.id === "number")
            .map((tab) =>
              chrome.tabs
                .sendMessage(tab.id, { type: "CTRL_BYPASS_STATE_CHANGED", enabled })
                .catch(() => null)
            )
        );
        sendResponse({ ok: true, enabled });
      })
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "RUN_BULK_FILL") {
    runBulkFillOnActiveTab(message.fieldName, message.value)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }
});

async function runBulkFillOnActiveTab(fieldName, value) {
  const tab = await getActiveTab();
  if (!tab || typeof tab.id !== "number") {
    return { ok: false, error: "No active tab found." };
  }

  if (!isScriptableTabUrl(tab.url)) {
    return {
      ok: false,
      error: "This page is restricted. Open a regular website tab and try again."
    };
  }

  const payload = { type: "RUN_BULK_FILL", fieldName, value };
  try {
    return await chrome.tabs.sendMessage(tab.id, payload);
  } catch (_initialError) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ["content.js"]
      });
      return await chrome.tabs.sendMessage(tab.id, payload);
    } catch (error) {
      return {
        ok: false,
        error:
          "Could not connect to the page. Refresh the tab and try again. " + String(error)
      };
    }
  }
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function isScriptableTabUrl(url) {
  if (!url) {
    return false;
  }
  return !(
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("view-source:")
  );
}
