/**
 * Background Service Worker (Manifest V3)
 *
 * Handles:
 *   - Message routing between content scripts and popup
 *   - Storing scraped job data in chrome.storage.local
 *   - Badge updates when a job is detected
 */

// ── Message Handler ──────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "JOB_DETECTED") {
        // Store the latest scraped job data
        chrome.storage.local.set({
            lastScrapedJob: message.data,
            lastScrapedAt: new Date().toISOString(),
        });

        // Update badge to indicate a job was found
        chrome.action.setBadgeText({ text: "✓" });
        chrome.action.setBadgeBackgroundColor({ color: "#6366f1" });

        sendResponse({ stored: true });
        return true;
    }

    if (message.type === "GET_SCRAPED_JOB") {
        chrome.storage.local.get(["lastScrapedJob"], (result) => {
            sendResponse({ data: result.lastScrapedJob || null });
        });
        return true; // async
    }

    if (message.type === "CLEAR_BADGE") {
        chrome.action.setBadgeText({ text: "" });
        sendResponse({ cleared: true });
        return true;
    }
});

// ── Tab Update Listener ──────────────────────────────────────
// Clear badge when user leaves LinkedIn

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (changeInfo.url && !changeInfo.url.includes("linkedin.com")) {
        chrome.action.setBadgeText({ text: "" });
    }
});
