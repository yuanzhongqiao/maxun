import { Router } from 'express';
import logger from "../logger";
import { deleteFile, readFile, readFiles, saveFile } from "../workflow-management/storage";
import { createRemoteBrowserForRun, destroyRemoteBrowser } from "../browser-management/controller";
import { chromium } from "playwright";
import { browserPool } from "../server";
import fs from "fs";
import { uuid } from "uuidv4";
import moment from 'moment-timezone';
import cron from 'node-cron';
import { googleSheetUpdateTasks, processGoogleSheetUpdates } from '../workflow-management/integrations/gsheet';
import { getDecryptedProxyConfig } from './proxy';
import { requireSignIn } from '../middlewares/auth';
import Robot from '../models/Robot';
import Run from '../models/Run';
// import { workflowQueue } from '../worker';

// todo: move from here
export const getRecordingByFileName = async (fileName: string): Promise<any | null> => {
  try {
    const recording = await readFile(`./../storage/recordings/${fileName}.json`)
    const parsedRecording = JSON.parse(recording);
    return parsedRecording;
  } catch (error: any) {
    console.error(`Error while getting recording for fileName ${fileName}:`, error.message);
    return null;
  }
};

export const router = Router();

/**
 * Logs information about recordings API.
 */
router.all('/', requireSignIn, (req, res, next) => {
  logger.log('debug', `The recordings API was invoked: ${req.url}`)
  next() // pass control to the next handler
})

/**
 * GET endpoint for getting an array of all stored recordings.
 */
router.get('/recordings', requireSignIn, async (req, res) => {
  try {
    const data = await Robot.findAll();
    return res.send(data);
  } catch (e) {
    logger.log('info', 'Error while reading recordings');
    return res.send(null);
  }
});

/**
 * DELETE endpoint for deleting a recording from the storage.
 */
router.delete('/recordings/:id', requireSignIn, async (req, res) => {
  try {
    await Robot.destroy({
      where: { 'recording_meta.id': req.params.id }
    });
    return res.send(true);
  } catch (e) {
    const { message } = e as Error;
    logger.log('info', `Error while deleting a recording with name: ${req.params.fileName}.json`);
    return res.send(false);
  }
});

/**
 * GET endpoint for getting an array of runs from the storage.
 */
router.get('/runs', requireSignIn, async (req, res) => {
  try {
    const data = await Run.findAll();
    return res.send(data);
  } catch (e) {
    logger.log('info', 'Error while reading runs');
    return res.send(null);
  }
});

/**
 * DELETE endpoint for deleting a run from the storage.
 */
router.delete('/runs/:id', requireSignIn, async (req, res) => {
  try {
    await Run.destroy({ where: { id: req.params.id } });
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
router.put('/runs/:id', requireSignIn, async (req, res) => {
  try {
    console.log(`Params recieved:`, req.params)
    const recording = await Robot.findOne({
      where: {
        'recording_meta.id': req.params.id
      },
      raw: true
    });

    console.log(`Recording found:`, recording)

    if (!recording || !recording.recording_meta || !recording.recording_meta.id) {
      return res.status(404).send({ error: 'Recording not found' });
    }

    const proxyConfig = await getDecryptedProxyConfig(req.user.id);
    let proxyOptions: any = {};

    if (proxyConfig.proxy_url) {
      proxyOptions = {
        server: proxyConfig.proxy_url,
        ...(proxyConfig.proxy_username && proxyConfig.proxy_password && {
          username: proxyConfig.proxy_username,
          password: proxyConfig.proxy_password,
        }),
      };
    }

    const id = createRemoteBrowserForRun({
      browser: chromium,
      launchOptions: {
        headless: true,
        proxy: proxyOptions.server ? proxyOptions : undefined,
      }
    });

    const runId = uuid();

    const run = await Run.create({
      status: 'RUNNING',
      name: recording.recording_meta.name,
      robotId: recording.id,
      robotMetaId: recording.recording_meta.id,
      startedAt: new Date().toLocaleString(),
      finishedAt: '',
      browserId: id,
      interpreterSettings: req.body,
      log: '',
      runId,
      serializableOutput: {},
      binaryOutput: {},
    });

    const plainRun = run.toJSON();

console.log(`Created run (plain object):`, plainRun);

    // // we need to handle this via DB
    // fs.mkdirSync('../storage/runs', { recursive: true })
    // await saveFile(
    //   `../storage/runs/${req.params.fileName}_${runId}.json`,
    //   JSON.stringify({ ...run_meta }, null, 2)
    // );
    // logger.log('debug', `Created run with name: ${req.params.fileName}.json`);

    // console.log('Run meta:', run_meta);
    return res.send({
      browserId: id,
      runId: plainRun.runId,
    });
  } catch (e) {
    const { message } = e as Error;
    logger.log('info', `Error while creating a run with recording id: ${req.params.id} - ${message}`);
    return res.send('');
  }
});

/**
 * GET endpoint for getting a run from the storage.
 */
router.get('/runs/run/:id', requireSignIn, async (req, res) => {
  try {
    console.log(`Params for GET /runs/run/:id`, req.params.id)
    // read the run from storage
    const run = await Run.findOne({ where: { runId: req.params.runId }, raw: true });
    //const parsedRun = JSON.parse(run);
    if (!run) {
      return res.status(404).send(null);
    }
    return res.send(run);
  } catch (e) {
    const { message } = e as Error;
    logger.log('error', `Error ${message} while reading a run with id: ${req.params.id}.json`);
    return res.send(null);
  }
});

/**
 * PUT endpoint for finishing a run and saving it to the storage.
 */
router.post('/runs/run/:id', requireSignIn, async (req, res) => {
  try {
    // const recording = await readFile(`./../storage/recordings/${req.params.fileName}.json`)
    // const parsedRecording = JSON.parse(recording);

    // const run = await readFile(`./../storage/runs/${req.params.fileName}_${req.params.runId}.json`)
    // const parsedRun = JSON.parse(run);
    console.log(`Params for POST /runs/run/:id`, req.params.id)

    const run = await Run.findOne({ where: { runId: req.params.id }, raw: true });
    if (!run) {
      return res.status(404).send(false);
    }

    const recording = await Robot.findOne({ where: { 'recording_meta.id': run.robotMetaId }, raw: true });
    if (!recording) {
      return res.status(404).send(false);
    }

    // interpret the run in active browser
    const browser = browserPool.getRemoteBrowser(run.browserId);
    const currentPage = browser?.getCurrentPage();
    if (browser && currentPage) {
      const interpretationInfo = await browser.interpreter.InterpretRecording(
        recording.recording, currentPage, run.interpreterSettings);
      await destroyRemoteBrowser(run.browserId);
      await run.update({
        ...run,
        status: 'success',
        finishedAt: new Date().toLocaleString(),
        browserId: run.browserId,
        log: interpretationInfo.log.join('\n'),
        serializableOutput: interpretationInfo.serializableOutput,
        binaryOutput: interpretationInfo.binaryOutput,
      });
      googleSheetUpdateTasks[req.params.runId] = {
        name: run.name,
        runId: run.runId,
        status: 'pending',
        retries: 5,
      };
      processGoogleSheetUpdates();
      return res.send(true);
    } else {
      throw new Error('Could not destroy browser');
    }
  } catch (e) {
    const { message } = e as Error;
    logger.log('info', `Error while running a recording with name: ${req.params.fileName}_${req.params.runId}.json`);
    return res.send(false);
  }
});

router.put('/schedule/:fileName/', requireSignIn, async (req, res) => {
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

    // await workflowQueue.add(
    //   'run workflow',
    //   { fileName, runId },
    //   {
    //     repeat: {
    //       pattern: cronExpression,
    //       tz: timezone
    //     }
    //   }
    // );

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
router.post('/runs/abort/:id', requireSignIn, async (req, res) => {
  try {
    console.log(`Params for POST /runs/abort/:id`, req.params.id)
    const run = await Run.findOne({ where: { runId: req.params.id }, raw: true });
    if (!run) {
      return res.status(404).send(false);
    }
    //const parsedRun = JSON.parse(run);

    const browser = browserPool.getRemoteBrowser(run.browserId);
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
    await run.update({
      ...run,
      status: 'aborted',
      finishedAt: new Date().toLocaleString(),
      browserId: run.browserId,
      log: currentLog,
      serializableOutput,
      binaryOutput,
    });

    // fs.mkdirSync('../storage/runs', { recursive: true })
    // await saveFile(
    //   `../storage/runs/${run.name}_${req.params.runId}.json`,
    //   JSON.stringify({ ...run_meta, serializableOutput, binaryOutput }, null, 2)
    // );
    return res.send(true);
  } catch (e) {
    const { message } = e as Error;
    logger.log('info', `Error while running a recording with name: ${req.params.fileName}_${req.params.runId}.json`);
    return res.send(false);
  }
});