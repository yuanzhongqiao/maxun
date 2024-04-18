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

            return { data: scrapedData };
        },
    });
  
    await crawler.run([{ url }]);
}

export default scrapeData