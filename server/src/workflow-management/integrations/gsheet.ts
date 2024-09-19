import { google } from "googleapis";
import fs from 'fs';
import path from 'path';
import logger from "../../logger";
import { readFile } from "../storage";


interface GoogleSheetUpdateTask {
  name: string;
  runId: string;
  status: 'pending' | 'completed' | 'failed';
  retries: number;
}

const MAX_RETRIES = 5;

export let googleSheetUpdateTasks: { [runId: string]: GoogleSheetUpdateTask } = {};


// *** Temporary Path to the JSON file that will store the integration details ***
const integrationsFilePath = path.join(__dirname, 'integrations.json');

export function loadIntegrations() {
  if (fs.existsSync(integrationsFilePath)) {
    const data = fs.readFileSync(integrationsFilePath, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

export function saveIntegrations(integrations: any) {
  fs.writeFileSync(integrationsFilePath, JSON.stringify(integrations, null, 2));
}

export async function updateGoogleSheet(fileName: string, runId: string) {
  try {
    const run = await readFile(`./../storage/runs/${fileName}_${runId}.json`);
    const parsedRun = JSON.parse(run);

    if (parsedRun.status === 'success' && parsedRun.serializableOutput) {
      const data = parsedRun.serializableOutput['item-0'] as { [key: string]: any }[];
      const integrationConfig = await loadIntegrations();

      if (integrationConfig) {
        const { spreadsheetId, range, credentials } = integrationConfig;

        if (spreadsheetId && range && credentials) {
          // Convert data to Google Sheets format (headers and rows)
          const headers = Object.keys(data[0]);
          const rows = data.map((row: { [key: string]: any }) => Object.values(row));
          const outputData = [headers, ...rows];

          await writeDataToSheet(spreadsheetId, range, outputData);
          logger.log('info', `Data written to Google Sheet successfully for ${fileName}_${runId}`);
        }
      }
      logger.log('error', `Google Sheet integration not configured for ${fileName}_${runId}`);
    }
    logger.log('error', `Run not successful or no data to update for ${fileName}_${runId}`);
  } catch (error: any) {
    logger.log('error', `Failed to write data to Google Sheet for ${fileName}_${runId}: ${error.message}`);
  }
};

export async function writeDataToSheet(spreadsheetId: string, range: string, data: any[]) {
  try {
    const integrationCredentialsPath = path.join(__dirname, 'integrations.json');
    const integrationCredentials = JSON.parse(fs.readFileSync(integrationCredentialsPath, 'utf-8'));

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: integrationCredentials.credentials.client_email,
        private_key: integrationCredentials.credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authToken = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authToken as any });

    const resource = { values: data };

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: resource,
    });

    logger.log(`info`, `Data written to Google Sheet: ${spreadsheetId}, Range: ${range}`);
  } catch (error: any) {
    logger.log(`error`, `Error writing data to Google Sheet: ${error.message}`);
    throw error;
  }
}

const processGoogleSheetUpdates = async () => {
  while (true) {
    let hasPendingTasks = false;
    for (const runId in googleSheetUpdateTasks) {
      const task = googleSheetUpdateTasks[runId];
      if (task.status === 'pending') {
        hasPendingTasks = true;
        try {
          await updateGoogleSheet(task.name, task.runId);
          console.log(`Successfully updated Google Sheets for run ${task.runId}`);
          delete googleSheetUpdateTasks[runId];
        } catch (error: any) {
          if (task.retries < MAX_RETRIES) {
            googleSheetUpdateTasks[runId].retries += 1;
          } else {
            // Mark as failed after maximum retries
            googleSheetUpdateTasks[runId].status = 'failed';
          }
          console.error(`Failed to update Google Sheets for run ${task.runId}:`, error);
        }
      }
    }
    if (!hasPendingTasks) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
};

export const startProcessGoogleSheetUpdates = () => {
  if (Object.keys(googleSheetUpdateTasks).length > 0) {
    processGoogleSheetUpdates();
  }
};