import playwright from 'playwright'

fastify.post('/scrape', async (request, reply) => {
    const { url, selectors } = request.body;
  
    try {
      const browser = await playwright.chromium.launch({ headless: true }); // Launch headless browser
      const page = await browser.newPage();
  
      try {
        await page.goto(url);
        // Handle any required interactions (logins, captchas, etc.)
  
        const scrapedData = await page.evaluate((selectors) => {
          const data = [];
          for (const selector of selectors) {
            const elements = Array.from(document.querySelectorAll(selector));
            const elementData = elements.map((el) => el.textContent);
            data.push(elementData);
          }
          return data;
        }, selectors);
  
        await browser.close();
        reply.send(scrapedData);
      } catch (error) {
        console.error('Error scraping:', error);
        await browser.close();
        reply.status(500).send({ error: 'Failed to scrape data' });
      }
    } catch (error) {
      console.error('Error launching browser:', error);
      reply.status(500).send({ error: 'Failed to initiate scraping' });
    }
  });