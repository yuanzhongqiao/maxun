import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis();

const workflowQueue = new Queue('workflow', { connection });

const worker = new Worker('workflow', async job => {
  const { fileName, runId } = job.data;
  try {
    const result = await runWorkflow(fileName, runId);
    return result;
  } catch (error) {
    console.error('Error running workflow:', error);
    throw error;
  }
}, { connection });

worker.on('completed', (job: any) => {
  console.log(`Job ${job.id} completed for ${job.data.fileName}_${job.data.runId}`);
});

worker.on('failed', (job: any, err) => {
  console.error(`Job ${job.id} failed for ${job.data.fileName}_${job.data.runId}:`, err);
});

export { workflowQueue };