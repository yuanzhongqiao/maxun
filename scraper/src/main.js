import Fastify from 'fastify'
import cors from '@fastify/cors'

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