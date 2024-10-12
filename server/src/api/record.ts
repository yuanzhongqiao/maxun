import { readFile, readFiles } from "../workflow-management/storage";
import { Router, Request, Response } from 'express';
import { chromium } from "playwright";
import { requireAPIKey } from "../middlewares/api";
import Robot from "../models/Robot";
import Run from "../models/Run";
const router = Router();
import { getDecryptedProxyConfig } from "../routes/proxy";
import { uuid } from "uuidv4";
import { createRemoteBrowserForRun, destroyRemoteBrowser } from "../browser-management/controller";
import logger from "../logger";
import { browserPool } from "../server";
import { io, Socket } from "socket.io-client";

const formatRecording = (recordingData: any) => {
    const recordingMeta = recordingData.recording_meta;
    const workflow = recordingData.recording.workflow || [];
    const firstWorkflowStep = workflow[0]?.where?.url || '';

    const inputParameters = [
        {
            type: "string",
            name: "originUrl",
            label: "Origin URL",
            required: true,
            defaultValue: firstWorkflowStep,
        },
    ];

    return {
        id: recordingMeta.id,
        name: recordingMeta.name,
        createdAt: new Date(recordingMeta.createdAt).getTime(),
        inputParameters,
    };
};


router.get("/robots", requireAPIKey, async (req: Request, res: Response) => {
    try {
        const robots = await Robot.findAll({ raw: true });
        const formattedRecordings = robots.map(formatRecording);

        const response = {
            statusCode: 200,
            messageCode: "success",
            robots: {
                totalCount: formattedRecordings.length,
                items: formattedRecordings,
            },
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching recordings:", error);
        res.status(500).json({
            statusCode: 500,
            messageCode: "error",
            message: "Failed to retrieve recordings",
        });
    }
});


const formatRecordingById = (recordingData: any) => {
    const recordingMeta = recordingData.recording_meta;
    const workflow = recordingData.recording.workflow || [];
    const firstWorkflowStep = workflow[0]?.where?.url || '';

    const inputParameters = [
        {
            type: "string",
            name: "originUrl",
            label: "Origin URL",
            required: true,
            defaultValue: firstWorkflowStep,
        },
    ];

    return {
        id: recordingMeta.id,
        name: recordingMeta.name,
        createdAt: new Date(recordingMeta.createdAt).getTime(),
        inputParameters,
    };
};

router.get("/robots/:id", requireAPIKey, async (req: Request, res: Response) => {
    try {
        const robot = await Robot.findOne({
            where: {
                'recording_meta.id': req.params.id
            },
            raw: true
        });

        const formattedRecording = formatRecordingById(robot);

        const response = {
            statusCode: 200,
            messageCode: "success",
            robot: formattedRecording,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching recording:", error);
        res.status(404).json({
            statusCode: 404,
            messageCode: "not_found",
            message: `Recording with name "${req.params.fileName}" not found.`,
        });
    }
});

// TODO: Format runs to send more data formatted
router.get("/robots/:id/runs", requireAPIKey, async (req: Request, res: Response) => {
    try {
        const runs = await Run.findAll({
            where: {
                robotMetaId: req.params.id
            },
            raw: true
        });

        const response = {
            statusCode: 200,
            messageCode: "success",
            runs: {
                totalCount: runs.length,
                items: runs,
            },
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching runs:", error);
        res.status(500).json({
            statusCode: 500,
            messageCode: "error",
            message: "Failed to retrieve runs",
        });
    }
}
);

router.get("/robots/:id/runs/:runId", requireAPIKey, async (req: Request, res: Response) => {
    try {
        const run = await Run.findOne({
            where: {
                runId: req.params.runId,
                robotMetaId: req.params.id,
            },
            raw: true
        });

        const response = {
            statusCode: 200,
            messageCode: "success",
            run: run,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching run:", error);
        res.status(404).json({
            statusCode: 404,
            messageCode: "not_found",
            message: `Run with id "${req.params.runId}" for robot with id "${req.params.id}" not found.`,
        });
    }
});

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
        });

        const runId = uuid();

        const run = await Run.create({
            status: 'Running',
            name: recording.recording_meta.name,
            robotId: recording.id,
            robotMetaId: recording.recording_meta.id,
            startedAt: new Date().toLocaleString(),
            finishedAt: '',
            browserId,
            interpreterSettings: { maxConcurrency: 1, maxRepeats: 1, debug: true },
            log: '',
            runId,
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

        await destroyRemoteBrowser(plainRun.browserId);

        await run.update({
            ...run,
            status: 'success',
            finishedAt: new Date().toLocaleString(),
            browserId: plainRun.browserId,
            log: interpretationInfo.log.join('\n'),
            serializableOutput: interpretationInfo.serializableOutput,
            binaryOutput: interpretationInfo.binaryOutput,
        });
        return true;
    } catch (error: any) {
        logger.log('info', `Error while running a recording with id: ${id} - ${error.message}`);
        console.log(error.message);
        return false;
    }
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


router.post("/robots/:id/runs", requireAPIKey, async (req: Request, res: Response) => {
    try {
    const result = await handleRunRecording(req.params.id, req.user.dataValues.id);
    console.log(`Result`, result);

        const response = {
            statusCode: 200,
            messageCode: "success",
            run: result,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error running robot:", error);
        res.status(500).json({
            statusCode: 500,
            messageCode: "error",
            message: "Failed to run robot",
        });
    }
});

export default router;