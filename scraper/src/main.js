import Fastify from 'fastify'
import cors from '@fastify/cors'
import fetch from 'node-fetch';
import scraper from './scraper.js';

const fastify = Fastify();

// Change this later
const corsOptions = {
  origin: 'http://localhost:5173' 
}

await fastify.register(cors, corsOptions)

fastify.get('/proxy', async (request, reply) => {
  const { url } = request.query;

  try {
    const response = await fetch(url);
    const html = await response.text();
    reply.type('text/html').send(html);
  } catch (error) {
    reply.status(500).send(`Error fetching website: ${error.message}`);
  }
});


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

await fastify.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${fastify.server.address().port}`)
});