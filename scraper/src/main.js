const fastify = require('fastify')();
const scraper = require('./scraper');
const fetch = require('node-fetch');


// Change this later
const corsOptions = {
  origin: 'http://localhost:5173' 
}
fastify.register(require('@fastify/cors'), corsOptions)


fastify.post('/scrape', async (request, reply) => {
  const { url, selectors } = request.body;

  try {
    const data = await scraper(url, selectors);
    console.log('Scraped data:', data);
    reply.send(data);
  } catch (error) {
    console.error('Error scraping:', error);
    reply.status(500).send({ error: 'Failed to scrape data' });
  }
});

fastify.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${fastify.server.address().port}`)
});