
import { FbAdLibraryScraper } from "./tools/fb-ad-scraper.js";

async function main() {
    // Default to "monday.com" keyword if not provided
    const keyword = process.argv[2] || "monday.com";

    console.log(`\n🧪 Testing FB Ad Scraper for keyword: ${keyword}\n`);

    const scraper = new FbAdLibraryScraper();
    const ads = await scraper.scrape(keyword);

    console.log(`\n✅ Scrape Complete. Found ${ads.length} ads.\n`);
    if (ads.length > 0) {
        // Log a sample ad to verify fields
        console.log("Sample Ad:", JSON.stringify(ads[0], null, 2));
    } else {
        console.log("❌ No ads found. Check screenshots/logs.");
    }
}

main();
