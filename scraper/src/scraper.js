import playwright from 'playwright';

async function scraper(url, selectors) {
const browser = await playwright.chromium.launch({
    headless: false // setting this to true will not run the UI
});
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
    return scrapedData;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

module.exports = scraper;