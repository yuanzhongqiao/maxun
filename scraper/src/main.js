import Fastify from 'fastify'
import cors from '@fastify/cors'
import scrapeData from './scraper';
import loadWebsite from './load';

const fastify = Fastify();

// Change this later
const corsOptions = {
  origin: 'http://localhost:5173'
}

await fastify.register(cors, corsOptions)

fastify.get('/', async (request, reply) => {
  reply.send('Vroom Vroom Vroom');
});

fastify.post('/load-website', async (request, reply) => {
  const { url } = request.body;
  try {
    const response = await loadWebsite(url);
    reply.send(response);
    console.log('Response is::', response)
  } catch (error) {
    reply.status(500).send({ error: error });
  }
});

fastify.post('/scrape', async (request, reply) => {
  const { url, selectors } = request.body;
  try {
    const response = await scrapeData(url, selectors);
    reply.send(response);
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
});

await fastify.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${fastify.server.address().port}`)
});