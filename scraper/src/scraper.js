import { PlaywrightCrawler } from 'crawlee';

async function scrapeData(url, selectors, waitForSeconds = 2) {
    const crawler = new PlaywrightCrawler({
        requestHandler: async ({ page }) => {
            await page.goto(url);
  
            // Wait for specific time (optional)
            await page.waitForTimeout(waitForSeconds * 1000);
  
            console.log('Received selectors:', selectors);
  
            const scrapedData = [];
            for (const selector of selectors) {
                const elementData = await page.$$eval(selector, elements => elements.map(el => el.textContent.trim()));
                scrapedData.push(...elementData);
            }
  
            console.log('Scraped data:', scrapedData);
        },
    });
  
    await crawler.run([{ url }]);
}

const url = process.argv[2];
const selectors = process.argv.slice(3); // Selectors are passed as subsequent arguments
const waitForSeconds = parseInt(process.argv[selectors.length + 2] || 2); // Optional wait time

if (url && selectors.length > 0) {
    await scrapeData(url, selectors, waitForSeconds);
} else {
    console.error('Please provide URL and selectors as arguments.');
}