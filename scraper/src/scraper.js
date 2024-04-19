import { PlaywrightCrawler, Configuration } from 'crawlee';

async function scrapeData(url, selectors, waitForSeconds = 2) {
    const scrapedData = [];
    const crawler = new PlaywrightCrawler({
        requestHandler: async ({ page, request }) => {
            console.log('Request object:', request)
            await page.goto(url);
  
            await page.waitForTimeout(waitForSeconds * 1000);
  
            console.log('Received selectors:', selectors);
  
            for (const selector of selectors) {
                const elementData = await page.$$eval(selector, elements => elements.map(el => el.textContent.trim()));
                scrapedData.push(...elementData);
            }
  
            console.log('Scraped data:', scrapedData);
        },
    },
    new Configuration({
        persistStorage: false,
    }));

    await crawler.run([ url ]);
    return scrapedData;
   
}

export default scrapeData;