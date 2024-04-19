import Fastify from 'fastify'
import cors from '@fastify/cors'
import scrapeData from './scraper';

const fastify = Fastify();

// Change this later
const corsOptions = {
  origin: 'http://localhost:5173'
}

await fastify.register(cors, corsOptions)

fastify.get('/', async (request, reply) => {
  reply.send('Vroom Vroom Vroom');
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