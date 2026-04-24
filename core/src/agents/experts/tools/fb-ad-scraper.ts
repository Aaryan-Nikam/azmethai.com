
import { StealthBrowser } from "../../../subagents/websurfer/stealth-browser.js";
import { Page } from "playwright";
import * as fs from 'fs';

export interface FbAd {
    id?: string;
    advertiser: string;
    body: string;
    headline?: string;
    linkUrl?: string;
    cta?: string;
    imageUrl?: string;
    videoUrl?: string;
    status: string;
    startDate?: string;
    libraryId?: string;
}

export class FbAdLibraryScraper {
    private browser: StealthBrowser;

    constructor() {
        this.browser = new StealthBrowser({
            headless: true,
        });
    }

    /**
     * Scrapes ads for a brand/keyword.
     * @param keyword The brand name or keyword to search (e.g. "monday.com", "Airbnb")
     */
    async scrape(keyword: string): Promise<FbAd[]> {
        console.log(`[FbAdScraper] Launching browser for keyword: ${keyword}`);
        await this.browser.launch();
        const page = this.browser.getPage();
        if (!page) throw new Error("Failed to initialize browser page");

        try {
            // 1. Navigate to Ad Library (Keyword Search)
            // Use "All Ads" in "US" by default. 
            const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${encodeURIComponent(keyword)}&search_type=keyword_unordered&media_type=all`;
            console.log(`[FbAdScraper] Navigating to: ${url}`);
            await page.goto(url, { waitUntil: "networkidle" });

            // 2. Wait for content
            try {
                await page.waitForFunction(() => {
                    const text = document.body.innerText;
                    return text.includes("Sponsored") || text.includes("No ads match");
                }, { timeout: 15000 });
            } catch (e) {
                console.log("[FbAdScraper] Timeout waiting for 'Sponsored' text. Page might be slow or empty.");
            }

            // 3. Scroll to load more
            console.log(`[FbAdScraper] Scrolling...`);
            await this.autoScroll(page);

            // 4. Extract
            console.log(`[FbAdScraper] Extracting ads...`);
            const ads = await this.extractAds(page);
            console.log(`[FbAdScraper] Found ${ads.length} ads.`);

            return ads;

        } catch (error) {
            console.error("[FbAdScraper] Error:", error);
            // Snapshot on error
            await page.screenshot({ path: 'fb-scraper-error.png' });
            return [];
        } finally {
            await this.browser.close();
        }
    }

    private async autoScroll(page: Page) {
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(1500 + Math.random() * 1000);
        }
    }

    private async extractAds(page: Page): Promise<FbAd[]> {
        return await page.evaluate(() => {
            const results: any[] = [];

            // Broad search for potential text containers
            const allDivs = Array.from(document.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6'));

            // Fuzzy Find "Sponsored" labels
            const sponsoredLabels = allDivs.filter(d => {
                const text = (d as HTMLElement).innerText || "";
                return text.includes('Sponsored') && text.length < 30;
            });

            sponsoredLabels.forEach((label) => {
                // Determine Ad Card Container. 
                // Go up parents until we find "Library ID" text

                let card: HTMLElement | null = label.parentElement;
                let depth = 0;
                let foundLibId = false;

                while (card && depth < 20) {
                    if (card.innerText && card.innerText.includes("Library ID")) {
                        foundLibId = true;
                        break;
                    }
                    card = card.parentElement;
                    depth++;
                }

                // Internal verification content map to avoid duplicates
                const cardRef: any = card;

                if (card && foundLibId && !results.some(r => r._cardRef === cardRef)) {
                    // Extraction Logic
                    const fullText = card.innerText.split('\n').map(s => s.trim()).filter(s => s.length > 0);

                    // 1. Advertiser
                    const sponsoredIdx = fullText.findIndex(line => line.includes("Sponsored"));
                    const advertiser = sponsoredIdx > 0 ? fullText[sponsoredIdx - 1] : (fullText[0] || "Unknown");

                    // 2. Ad Body
                    let body = "";
                    if (sponsoredIdx > -1 && sponsoredIdx + 1 < fullText.length) {
                        body = fullText.slice(sponsoredIdx + 1, sponsoredIdx + 4).join("\n");
                    }

                    // 3. Status & Dates
                    let libraryId = "";
                    let status = "Unknown";
                    for (const line of fullText) {
                        if (line.includes("Library ID")) {
                            libraryId = line.replace("Library ID", "").replace(":", "").trim();
                        }
                        if (line === "Active" || line === "Inactive") {
                            status = line;
                        }
                    }

                    // 4. Media
                    const img = card.querySelector('img');
                    const video = card.querySelector('video');
                    const imageUrl = img ? (img as HTMLImageElement).src : undefined;
                    const videoUrl = video ? (video as HTMLVideoElement).src : undefined;

                    // 5. CTA
                    const buttons = Array.from(card.querySelectorAll('div, a, span'));
                    const ctaKeywords = ["Shop Now", "Learn More", "Sign Up", "Download", "Apply Now", "Subscribe", "Book Now", "Contact Us", "Install Now", "Use App", "Get Offer", "Watch More"];
                    let cta = "";

                    for (const btn of buttons) {
                        const txt = (btn as HTMLElement).innerText.trim();
                        if (ctaKeywords.includes(txt)) {
                            cta = txt;
                            break;
                        }
                    }

                    results.push({
                        advertiser,
                        body,
                        imageUrl,
                        videoUrl,
                        cta,
                        status,
                        libraryId,
                        _cardRef: card // Store ref to dedup
                    });
                }
            });

            // Cleanup internal marker
            return results.map(r => {
                const { _cardRef, ...safe } = r;
                return safe;
            });
        });
    }
}
