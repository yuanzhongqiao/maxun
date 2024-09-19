/**
 * RESTful API endpoints handling the recording storage.
*/

import { Router } from 'express';
import logger from "../logger";
import { deleteFile, readFile, readFiles, saveFile } from "../workflow-management/storage";
import { createRemoteBrowserForRun, destroyRemoteBrowser } from "../browser-management/controller";
import { chromium } from "playwright";
import { browserPool } from "../server";
import fs from "fs";
import { uuid } from "uuidv4";
import { workflowQueue } from '../workflow-management/scheduler';
import moment from 'moment-timezone';
import cron from 'node-cron';
import { googleSheetUpdateTasks } from '../workflow-management/integrations/gsheet';

export const router = Router();

/**
 * Logs information about recordings API.
 */
router.all('/', (req, res, next) => {
  logger.log('debug', `The recordings API was invoked: ${req.url}`)
  next() // pass control to the next handler
})

/**
 * GET endpoint for getting an array of all stored recordings.
 */
router.get('/recordings', async (req, res) => {
  try {
    const data = await readFiles('./../storage/recordings/');
    return res.send(data);
  } catch (e) {
    logger.log('info', 'Error while reading recordings');
    return res.send(null);
  }
});

/**
 * DELETE endpoint for deleting a recording from the storage.
 */
router.delete('/recordings/:fileName', async (req, res) => {
  try {
    await deleteFile(`./../storage/recordings/${req.params.fileName}.waw.json`);
    return res.send(true);
  } catch (e) {
    const { message } = e as Error;
    logger.log('info', `Error while deleting a recording with name: ${req.params.fileName}.waw.json`);
    return res.send(false);
  }
});

/**
 * GET endpoint for getting an array of runs from the storage.
 */
router.get('/runs', async (req, res) => {
  try {
    const data = await readFiles('./../storage/runs/');
    return res.send(data);
  } catch (e) {
    logger.log('info', 'Error while reading runs');
    return res.send(null);
  }
});

/**
 * DELETE endpoint for deleting a run from the storage.
 */
router.delete('/runs/:fileName', async (req, res) => {
  try {
    await deleteFile(`./../storage/runs/${req.params.fileName}.json`);
    return res.send(true);
  } catch (e) {
    const { message } = e as Error;
    logger.log('info', `Error while deleting a run with name: ${req.params.fileName}.json`);
    return res.send(false);
  }
});

/**
 * PUT endpoint for starting a remote browser instance and saving run metadata to the storage.
 * Making it ready for interpretation and returning a runId.
 */
router.put('/runs/:fileName', async (req, res) => {
  try {
    const id = createRemoteBrowserForRun({
      browser: chromium,
      launchOptions: { headless: true }
    });

    const runId = uuid();

    const run_meta = {
      status: 'RUNNING',
      name: req.params.fileName,
      startedAt: new Date().toLocaleString(),
      finishedAt: '',
      duration: '',
      task: req.body.params ? 'task' : '',
      browserId: id,
      interpreterSettings: req.body,
      log: '',
      runId,
    };
    fs.mkdirSync('../storage/runs', { recursive: true })
    await saveFile(
      `../storage/runs/${req.params.fileName}_${runId}.json`,
      JSON.stringify({ ...run_meta }, null, 2)
    );
    logger.log('debug', `Created run with name: ${req.params.fileName}.json`);

    console.log('Run meta:', run_meta);

    return res.send({
      browserId: id,
      runId: runId,
    });
  } catch (e) {
    const { message } = e as Error;
    logger.log('info', `Error while creating a run with name: ${req.params.fileName}.json`);
    return res.send('');
  }
});

/**
 * GET endpoint for getting a run from the storage.
 */
router.get('/runs/run/:fileName/:runId', async (req, res) => {
  try {
    // read the run from storage
    const run = await readFile(`./../storage/runs/${req.params.fileName}_${req.params.runId}.json`)
    const parsedRun = JSON.parse(run);
    return res.send(parsedRun);
  } catch (e) {
    const { message } = e as Error;
    logger.log('error', `Error ${message} while reading a run with name: ${req.params.fileName}_${req.params.runId}.json`);
    return res.send(null);
  }
});

/**
 * PUT endpoint for finishing a run and saving it to the storage.
 */
router.post('/runs/run/:fileName/:runId', async (req, res) => {
  try {
    const recording = await readFile(`./../storage/recordings/${req.params.fileName}.waw.json`)
    const parsedRecording = JSON.parse(recording);

    const run = await readFile(`./../storage/runs/${req.params.fileName}_${req.params.runId}.json`)
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
        status: 'success',
        finishedAt: new Date().toLocaleString(),
        duration: durString,
        browserId: parsedRun.browserId,
        log: interpretationInfo.log.join('\n'),
        serializableOutput: interpretationInfo.serializableOutput,
        binaryOutput: interpretationInfo.binaryOutput,
      };
      fs.mkdirSync('../storage/runs', { recursive: true })
      await saveFile(
        `../storage/runs/${parsedRun.name}_${req.params.runId}.json`,
        JSON.stringify(run_meta, null, 2)
      );

      res.send(true);

      googleSheetUpdateTasks[req.params.runId] = {
        name: parsedRun.name,
        runId: req.params.runId,
        status: 'pending',
        retries: 5,
      };

      return;
    } else {
      throw new Error('Could not destroy browser');
    }
  } catch (e) {
    const { message } = e as Error;
    logger.log('info', `Error while running a recording with name: ${req.params.fileName}_${req.params.runId}.json`);
    return res.send(false);
  }
});

router.put('/schedule/:fileName/', async (req, res) => {
  console.log(req.body);
  try {
    const { fileName } = req.params;
    const {
      runEvery,
      runEveryUnit,
      startFrom,
      atTime,
      timezone
    } = req.body;

    if (!fileName || !runEvery || !runEveryUnit || !startFrom || !atTime || !timezone) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!['HOURS', 'DAYS', 'WEEKS', 'MONTHS'].includes(runEveryUnit)) {
      return res.status(400).json({ error: 'Invalid runEvery unit' });
    }

    if (!moment.tz.zone(timezone)) {
      return res.status(400).json({ error: 'Invalid timezone' });
    }

    const [hours, minutes] = atTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return res.status(400).json({ error: 'Invalid time format' });
    }

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    if (!days.includes(startFrom)) {
      return res.status(400).json({ error: 'Invalid start day' });
    }

    let cronExpression;
    switch (runEveryUnit) {
      case 'HOURS':
        cronExpression = `${minutes} */${runEvery} * * *`;
        break;
      case 'DAYS':
        cronExpression = `${minutes} ${hours} */${runEvery} * *`;
        break;
      case 'WEEKS':
        const dayIndex = days.indexOf(startFrom);
        cronExpression = `${minutes} ${hours} * * ${dayIndex}/${7 * runEvery}`;
        break;
      case 'MONTHS':
        cronExpression = `${minutes} ${hours} 1-7 */${runEvery} *`;
        if (startFrom !== 'SUNDAY') {
          const dayIndex = days.indexOf(startFrom);
          cronExpression += ` ${dayIndex}`;
        }
        break;
    }

    if (!cronExpression || !cron.validate(cronExpression)) {
      return res.status(400).json({ error: 'Invalid cron expression generated' });
    }

    const runId = uuid();

    await workflowQueue.add(
      'run workflow',
      { fileName, runId },
      {
        repeat: {
          pattern: cronExpression,
          tz: timezone
        }
      }
    );

    res.status(200).json({
      message: 'success',
      runId,
      // cronExpression,
      // nextRunTime: getNextRunTime(cronExpression, timezone)
    });

  } catch (error) {
    console.error('Error scheduling workflow:', error);
    res.status(500).json({ error: 'Failed to schedule workflow' });
  }
});

// function getNextRunTime(cronExpression, timezone) {
//   const schedule = cron.schedule(cronExpression, () => {}, { timezone });
//   const nextDate = schedule.nextDate();
//   schedule.stop();
//   return nextDate.toDate();
// }

/**
 * POST endpoint for aborting a current interpretation of the run.
 */
router.post('/runs/abort/:fileName/:runId', async (req, res) => {
  try {
    const run = await readFile(`./../storage/runs/${req.params.fileName}_${req.params.runId}.json`)
    const parsedRun = JSON.parse(run);

    const browser = browserPool.getRemoteBrowser(parsedRun.browserId);
    const currentLog = browser?.interpreter.debugMessages.join('/n');
    const serializableOutput = browser?.interpreter.serializableData.reduce((reducedObject, item, index) => {
      return {
        [`item-${index}`]: item,
        ...reducedObject,
      }
    }, {});
    const binaryOutput = browser?.interpreter.binaryData.reduce((reducedObject, item, index) => {
      return {
        [`item-${index}`]: item,
        ...reducedObject,
      }
    }, {});
    const run_meta = {
      ...parsedRun,
      status: 'ABORTED',
      finishedAt: null,
      duration: '',
      browserId: null,
      log: currentLog,
    };

    fs.mkdirSync('../storage/runs', { recursive: true })
    await saveFile(
      `../storage/runs/${parsedRun.name}_${req.params.runId}.json`,
      JSON.stringify({ ...run_meta, serializableOutput, binaryOutput }, null, 2)
    );
    return res.send(true);
  } catch (e) {
    const { message } = e as Error;
    logger.log('info', `Error while running a recording with name: ${req.params.fileName}_${req.params.runId}.json`);
    return res.send(false);
  }
});