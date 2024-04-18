import Fastify from 'fastify'
import cors from '@fastify/cors'
import fetch from 'node-fetch';
import playwright from 'playwright'
import { PlaywrightCrawler } from 'crawlee';

const fastify = Fastify();

// Change this later
const corsOptions = {
  origin: 'http://localhost:5173' 
}

await fastify.register(cors, corsOptions)

fastify.get('/', async (request, reply) => {
  reply.send('Welcome to the Playwright Scraper API');
});

await fastify.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${fastify.server.address().port}`)
});

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
  
            console.log('Scraped data:', scrapedData); // Replace with desired saving method
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