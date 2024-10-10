import { readFile, readFiles } from "../workflow-management/storage";
import { Router, Request, Response } from 'express';
import { requireAPIKey } from "../middlewares/api";
import Robot from "../models/Robot";
const router = Router();

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
        const recordings = await Robot.findAll();

        const formattedRecordings = recordings.map((recording: any) => {
            return formatRecording(recording);
        });

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

router.get("/robots/:fileName", requireAPIKey, async (req: Request, res: Response) => {
    try {
        const fileContent = await readFile(`./../storage/recordings/${req.params.fileName}.waw.json`);

        const recordingData = JSON.parse(fileContent);
        const formattedRecording = formatRecordingById(recordingData);

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

export default router;