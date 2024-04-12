// import Fastify from 'fastify'
// import { PlaywrightCrawler } from 'crawlee';

// const fastify = Fastify();

const fastify = require('fastify')();
const scraper = require('./scraper');

fastify.post('/scrape', async (request, reply) => {
  const { url, selections } = request.body;

  try {
    const data = await scraper.scrape(url, selections);
    console.log('Scraped data:', data);
    reply.send(data);
  } catch (error) {
    console.error('Error scraping:', error);
    reply.status(500).send({ error: 'Failed to scrape data' });
  }
});

fastify.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`Server is now listening on ${address}`);
});