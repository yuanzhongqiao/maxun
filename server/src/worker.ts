import fs from "fs";
import { uuid } from "uuidv4";
import { chromium } from "playwright";
import { io, Socket } from "socket.io-client";
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { readFile, saveFile } from "./workflow-management/storage";
import { createRemoteBrowserForRun, destroyRemoteBrowser } from './browser-management/controller';
import logger from './logger';
import { browserPool } from "./server";
import { googleSheetUpdateTasks, processGoogleSheetUpdates } from "./workflow-management/integrations/gsheet";

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

  await worker.close();
  await workflowQueue.close();
  logger.log(`info`, `Worker and queue have been closed.`);
});

worker.on('failed', async (job: any, err) => {
  logger.log(`error`, `Job ${job.id} failed for ${job.data.fileName}_${job.data.runId}:`, err);

  await worker.close();
  await workflowQueue.close();
  logger.log(`info`, `Worker and queue have been closed after failure.`);
});

async function jobCounts() {
  const jobCounts = await workflowQueue.getJobCounts();
  console.log('Jobs:', jobCounts);
}

jobCounts();

export { workflowQueue, worker };