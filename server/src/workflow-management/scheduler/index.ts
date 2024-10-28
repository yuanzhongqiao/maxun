import { uuid } from "uuidv4";
import { chromium } from "playwright";
import { io, Socket } from "socket.io-client";
import { createRemoteBrowserForRun, destroyRemoteBrowser } from '../../browser-management/controller';
import logger from '../../logger';
import { browserPool } from "../../server";
import { googleSheetUpdateTasks, processGoogleSheetUpdates } from "../integrations/gsheet";
import Robot from "../../models/Robot";
import Run from "../../models/Run";
import { getDecryptedProxyConfig } from "../../routes/proxy";
import { BinaryOutputService } from "../../storage/mino";
import { capture } from "../../utils/analytics";

async function createWorkflowAndStoreMetadata(id: string, userId: string) {
  try {
    const recording = await Robot.findOne({
      where: {
        'recording_meta.id': id
      },
      raw: true
    });

    if (!recording || !recording.recording_meta || !recording.recording_meta.id) {
      return {
        success: false,
        error: 'Recording not found'
      };
    }

    const proxyConfig = await getDecryptedProxyConfig(userId);
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

    const browserId = createRemoteBrowserForRun({
      browser: chromium,
      launchOptions: {
        headless: true,
        proxy: proxyOptions.server ? proxyOptions : undefined,
      }
    }, userId);
    const runId = uuid();

    const run = await Run.create({
      status: 'scheduled',
      name: recording.recording_meta.name,
      robotId: recording.id,
      robotMetaId: recording.recording_meta.id,
      startedAt: new Date().toLocaleString(),
      finishedAt: '',
      browserId,
      interpreterSettings: { maxConcurrency: 1, maxRepeats: 1, debug: true },
      log: '',
      runId,
      runByScheduleId: uuid(),
      serializableOutput: {},
      binaryOutput: {},
    });

    const plainRun = run.toJSON();

    return {
      browserId,
      runId: plainRun.runId,
    }

  } catch (e) {
    const { message } = e as Error;
    logger.log('info', `Error while scheduling a run with id: ${id}`);
    console.log(message);
    return {
      success: false,
      error: message,
    };
  }
}

async function executeRun(id: string) {
  try {
    const run = await Run.findOne({ where: { runId: id } });
    if (!run) {
      return {
        success: false,
        error: 'Run not found'
      }
    }

    const plainRun = run.toJSON();

    const recording = await Robot.findOne({ where: { 'recording_meta.id': plainRun.robotMetaId }, raw: true });
    if (!recording) {
      return {
        success: false,
        error: 'Recording not found'
      }
    }

    plainRun.status = 'running';

    const browser = browserPool.getRemoteBrowser(plainRun.browserId);
    if (!browser) {
      throw new Error('Could not access browser');
    }

    const currentPage = await browser.getCurrentPage();
    if (!currentPage) {
      throw new Error('Could not create a new page');
    }

    const interpretationInfo = await browser.interpreter.InterpretRecording(
      recording.recording, currentPage, plainRun.interpreterSettings);

    const binaryOutputService = new BinaryOutputService('maxun-run-screenshots');
    const uploadedBinaryOutput = await binaryOutputService.uploadAndStoreBinaryOutput(run, interpretationInfo.binaryOutput);

    await destroyRemoteBrowser(plainRun.browserId);

    await run.update({
      ...run,
      status: 'success',
      finishedAt: new Date().toLocaleString(),
      browserId: plainRun.browserId,
      log: interpretationInfo.log.join('\n'),
      serializableOutput: interpretationInfo.serializableOutput,
      binaryOutput: uploadedBinaryOutput,
    });

    let totalRowsExtracted = 0;
    run.dataValues.serializableOutput['item-0'].forEach((item: any) => {
      totalRowsExtracted += Object.keys(item).length;
    }
    );

    capture(
      'maxun-oss-run-created-scheduled',
      {
        runId: id,
        created_at: new Date().toISOString(),
        status: 'success',
        extractedItemsCount: run.dataValues.serializableOutput['item-0'].length,
        extractedRowsCount: totalRowsExtracted,
        extractedScreenshotsCount: run.dataValues.binaryOutput['item-0'].length,
      }
    );

    googleSheetUpdateTasks[id] = {
      robotId: plainRun.robotMetaId,
      runId: id,
      status: 'pending',
      retries: 5,
    };
    processGoogleSheetUpdates();
    return true;
  } catch (error: any) {
    logger.log('info', `Error while running a recording with id: ${id} - ${error.message}`);
    console.log(error.message);
    const run = await Run.findOne({ where: { runId: id } });
    if (run) {
      await run.update({
        status: 'failed',
        finishedAt: new Date().toLocaleString(),
      });
    }
    capture(
      'maxun-oss-run-created-scheduled',
      {
        runId: id,
        created_at: new Date().toISOString(),
        status: 'failed',
      }
    );
    return false;
  }
}

async function readyForRunHandler(browserId: string, id: string) {
  try {
    const interpretation = await executeRun(id);

    if (interpretation) {
      logger.log('info', `Interpretation of ${id} succeeded`);
    } else {
      logger.log('error', `Interpretation of ${id} failed`);
      await destroyRemoteBrowser(browserId);
    }

    resetRecordingState(browserId, id);

  } catch (error: any) {
    logger.error(`Error during readyForRunHandler: ${error.message}`);
    await destroyRemoteBrowser(browserId);
  }
}

function resetRecordingState(browserId: string, id: string) {
  browserId = '';
  id = '';
}

export async function handleRunRecording(id: string, userId: string) {
  try {
    const result = await createWorkflowAndStoreMetadata(id, userId);
    const { browserId, runId: newRunId } = result;

    if (!browserId || !newRunId || !userId) {
      throw new Error('browserId or runId or userId is undefined');
    }

    const socket = io(`http://localhost:8080/${browserId}`, {
      transports: ['websocket'],
      rejectUnauthorized: false
    });

    socket.on('ready-for-run', () => readyForRunHandler(browserId, newRunId));

    logger.log('info', `Running recording: ${id}`);

    socket.on('disconnect', () => {
      cleanupSocketListeners(socket, browserId, newRunId);
    });

  } catch (error: any) {
    logger.error('Error running recording:', error);
  }
}

function cleanupSocketListeners(socket: Socket, browserId: string, id: string) {
  socket.off('ready-for-run', () => readyForRunHandler(browserId, id));
  logger.log('info', `Cleaned up listeners for browserId: ${browserId}, runId: ${id}`);
}

export { createWorkflowAndStoreMetadata };