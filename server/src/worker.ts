import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import logger from './logger';
import { handleRunRecording } from "./workflow-management/scheduler";

const connection = new IORedis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null,
});

connection.on('connect', () => {
    console.log('Connected to Redis!');
});

connection.on('error', (err) => {
    console.error('Redis connection error:', err);
});

const workflowQueue = new Queue('workflow', { connection });

const worker = new Worker('workflow', async job => {
    const { fileName, runId } = job.data;
    try {
        const result = await handleRunRecording(fileName, runId);
        return result;
    } catch (error) {
        logger.error('Error running workflow:', error);
        throw error;
    }
}, { connection });

worker.on('completed', async (job: any) => {
    logger.log(`info`, `Job ${job.id} completed for ${job.data.fileName}_${job.data.runId}`);
});

worker.on('failed', async (job: any, err) => {
    logger.log(`error`, `Job ${job.id} failed for ${job.data.fileName}_${job.data.runId}:`, err);
});

async function jobCounts() {
    const jobCounts = await workflowQueue.getJobCounts();
    console.log('Jobs:', jobCounts);
}

jobCounts();

export { workflowQueue, worker };