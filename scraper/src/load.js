import { PlaywrightCrawler, Configuration } from "crawlee";

async function loadWebsite(url) {
    let htmlContent = '';
    const crawler = new PlaywrightCrawler({
        requestHandler: async ({ page }) => {
            await page.goto(url);
            htmlContent = await page.content();
        }
    },
    new Configuration({
        persistStorage: false,
    }));

    await crawler.run([url]);
    return htmlContent;
}

export default loadWebsite;