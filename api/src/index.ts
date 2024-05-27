import Fastify from 'fastify'

const fastify = Fastify();

fastify.get('/', async (request, reply) => {
  return 'Hello there! 👋';

})

const start = async () => {
  try {
    await fastify.listen({ port: 8000 });
    console.log('Server listening on port 8000');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();