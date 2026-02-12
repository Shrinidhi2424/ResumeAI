/**
 * LinkedIn Content Script
 *
 * Scrapes job details from LinkedIn job posting pages.
 * Targets specific DOM elements for job title and description.
 *
 * Communication: Listens for messages from the popup/background
 * and returns scraped job data.
 */

interface ScrapedJobData {
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    url: string;
    scrapedAt: string;
}

/**
 * Scrape job details from the current LinkedIn page.
 *
 * LinkedIn DOM selectors (as of 2024):
 *   Job Title:       .job-details-jobs-unified-top-card__job-title
 *   Company:         .job-details-jobs-unified-top-card__company-name
 *   Description:     .jobs-description__content, .jobs-box__html-content
 */
function scrapeLinkedInJob(): ScrapedJobData | null {
    try {
        // ── Job Title ────────────────────────────────────────────
        const titleElement = document.querySelector(
            ".job-details-jobs-unified-top-card__job-title"
        ) as HTMLElement | null;

        // Fallback selectors
        const titleFallback = document.querySelector(
            ".jobs-unified-top-card__job-title, .t-24.job-details-jobs-unified-top-card__job-title"
        ) as HTMLElement | null;

        const jobTitle = (titleElement || titleFallback)?.innerText?.trim() || "";

        // ── Company Name ─────────────────────────────────────────
        const companyElement = document.querySelector(
            ".job-details-jobs-unified-top-card__company-name"
        ) as HTMLElement | null;

        const companyFallback = document.querySelector(
            ".jobs-unified-top-card__company-name a"
        ) as HTMLElement | null;

        const companyName =
            (companyElement || companyFallback)?.innerText?.trim() || "";

        // ── Job Description ──────────────────────────────────────
        const descriptionElement = document.querySelector(
            ".jobs-description__content .jobs-box__html-content"
        ) as HTMLElement | null;

        const descriptionFallback = document.querySelector(
            ".jobs-description-content__text, .jobs-description__content"
        ) as HTMLElement | null;

        const jobDescription =
            (descriptionElement || descriptionFallback)?.innerText?.trim() || "";

        if (!jobTitle && !jobDescription) {
            return null;
        }

        return {
            jobTitle,
            companyName,
            jobDescription,
            url: window.location.href,
            scrapedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error("[ResumeAI] Scraping error:", error);
        return null;
    }
}

// ── Message Listener ─────────────────────────────────────────
// The popup sends a message asking for scraped data

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "SCRAPE_JOB") {
        // Wait a moment for any lazy-loaded content
        setTimeout(() => {
            const data = scrapeLinkedInJob();
            sendResponse({ success: !!data, data });
        }, 500);
        return true; // async response
    }

    if (message.type === "PING") {
        sendResponse({ alive: true });
        return true;
    }
});

// ── Auto-detect Job Page ─────────────────────────────────────
// Notify background when we land on a job page

function notifyJobPage() {
    const data = scrapeLinkedInJob();
    if (data) {
        chrome.runtime.sendMessage({
            type: "JOB_DETECTED",
            data,
        });
    }
}

// Run after a delay to let LinkedIn SPA render
setTimeout(notifyJobPage, 2000);

// Also watch for SPA navigation
let lastUrl = location.href;
const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(notifyJobPage, 2000);
    }
});

observer.observe(document.body, { childList: true, subtree: true });
