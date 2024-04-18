import { PlaywrightCrawler } from 'crawlee';

async function scrapeData(url, selectors, waitForSeconds = 2) {
    const scrapedData = [];
    const crawler = new PlaywrightCrawler({
        requestHandler: async ({ page }) => {
            await page.goto(url);
  
            await page.waitForTimeout(waitForSeconds * 1000);
  
            console.log('Received selectors:', selectors);
  
            for (const selector of selectors) {
                const elementData = await page.$$eval(selector, elements => elements.map(el => el.textContent.trim()));
                scrapedData.push(...elementData);
            }
  
            console.log('Scraped data:', scrapedData);
        },
    });
    await crawler.run([{ url }]);
    return scrapedData;
}

export default scrapeData;