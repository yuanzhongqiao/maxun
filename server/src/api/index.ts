import { deleteFile, readFile, readFiles, saveFile } from "../workflow-management/storage";
import { Router, Request, Response } from 'express';
export const router = Router();

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
        createdAt: new Date(recordingMeta.create_date).getTime(),
        inputParameters,
    };
};


router.get("/api/recordings", async (req: Request, res: Response) => {
    try {
        const fileContents = await readFiles('./../storage/recordings/');

        const formattedRecordings = fileContents.map((fileContent: string) => {
            const recordingData = JSON.parse(fileContent);
            return formatRecording(recordingData);
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
