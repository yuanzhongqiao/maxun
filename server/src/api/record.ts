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
    if (!id) {
      id = uuid();
    }
  
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
  
    try {
      const browserId = createRemoteBrowserForRun({
        browser: chromium,
        launchOptions: {
          headless: true,
          proxy: proxyOptions.server ? proxyOptions : undefined,
        }
      });
  
      const run = await Run.create({
        status: 'Running',
        name: recording.recording_meta.name,
        robotId: recording.id,
        robotMetaId: recording.recording_meta.id,
        startedAt: new Date().toLocaleString(),
        finishedAt: '',
        browserId: id,
        interpreterSettings: { maxConcurrency: 1, maxRepeats: 1, debug: true },
        log: '',
        runId: id,
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


router.post("/robots/:id/runs", requireAPIKey, async (req: Request, res: Response) => {
    try {
        

        const response = {
            statusCode: 200,
            messageCode: "success",
            run: '',
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