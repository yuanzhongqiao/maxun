import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { deleteFile, readFile, readFiles, saveFile } from "../storage";
import { createRemoteBrowserForRun, destroyRemoteBrowser } from '../../browser-management/controller';
import logger from '../../logger';
import { browserPool } from "../../server";
import fs from "fs";

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

export const worker = new Worker('workflow', async job => {
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

async function runWorkflow(fileName: any, runId: any) {
  try {
    // read the recording from storage
    const recording = await readFile(`./../storage/recordings/${fileName}.waw.json`);
    const parsedRecording = JSON.parse(recording);
    // read the run from storage
    const run = await readFile(`./../storage/runs/${fileName}_${runId}.json`);
    const parsedRun = JSON.parse(run);

    // interpret the run in active browser
    const browser = browserPool.getRemoteBrowser(parsedRun.browserId);
    const currentPage = browser?.getCurrentPage();
    if (browser && currentPage) {
      const interpretationInfo = await browser.interpreter.InterpretRecording(
        parsedRecording.recording, currentPage, parsedRun.interpreterSettings);
      const duration = Math.round((new Date().getTime() - new Date(parsedRun.startedAt).getTime()) / 1000);
      const durString = (() => {
        if (duration < 60) {
          return `${duration} s`;
        }
        else {
          const minAndS = (duration / 60).toString().split('.');
          return `${minAndS[0]} m ${minAndS[1]} s`;
        }
      })();
      await destroyRemoteBrowser(parsedRun.browserId);
      const run_meta = {
        ...parsedRun,
        status: interpretationInfo.result,
        finishedAt: new Date().toLocaleString(),
        duration: durString,
        browserId: null,
        log: interpretationInfo.log.join('\n'),
        serializableOutput: interpretationInfo.serializableOutput,
        binaryOutput: interpretationInfo.binaryOutput,
      };
      fs.mkdirSync('../storage/runs', { recursive: true });
      await saveFile(
        `../storage/runs/${parsedRun.name}_${runId}.json`,
        JSON.stringify(run_meta, null, 2)
      );
      return true;
    } else {
      throw new Error('Could not destroy browser');
    }
  } catch (e) {
    const { message } = e as Error;
    logger.log('info', `Error while running a recording with name: ${fileName}_${runId}.json`);
    return false;
  }
}

export { workflowQueue, runWorkflow };