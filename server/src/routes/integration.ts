import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import logger from "../logger";
import { writeDataToSheet } from "../workflow-management/integrations/gsheet"
import { readFile } from "../workflow-management/storage";


export const router = Router();

// Temproary Path to the JSON file that will store the integration details
const integrationsFilePath = path.join(__dirname, 'integrations.json');

export function loadIntegrations() {
  if (fs.existsSync(integrationsFilePath)) {
    const data = fs.readFileSync(integrationsFilePath, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

function saveIntegrations(integrations: any) {
  fs.writeFileSync(integrationsFilePath, JSON.stringify(integrations, null, 2));
}

router.post('/upload-credentials', async (req, res) => {
  try {
    const { fileName, credentials, spreadsheetId, range } = req.body;
    if (!fileName || !credentials || !spreadsheetId || !range) {
      return res.status(400).json({ message: 'Credentials, Spreadsheet ID, and Range are required.' });
    }
    // Store the credentials in a secure place (for test, we store them locally)
    // Load existing integrations from the JSON file
    const integrations = loadIntegrations();
    integrations[fileName] = { fileName, spreadsheetId, range, credentials };
    saveIntegrations(integrations);
    logger.log('info', 'Service account credentials saved successfully.');
    return res.send(true);
  } catch (error: any) {
    logger.log('error', `Error saving credentials: ${error.message}`);
    return res.status(500).json({ message: 'Failed to save credentials.', error: error.message });
  }
});

router.post('/update-google-sheet/:fileName/:runId', async (req, res) => {
  try {
    const run = await readFile(`./../storage/runs/${req.params.fileName}_${req.params.runId}.json`);
    const parsedRun = JSON.parse(run);

    if (parsedRun.status === 'success' && parsedRun.serializableOutput) {
      const data = parsedRun.serializableOutput['item-0'] as { [key: string]: any }[];
      const integrationConfig = await loadIntegrations();

      logger.log(`info`, `integration config ${JSON.stringify(integrationConfig)}`)

      if (integrationConfig) {
        const { spreadsheetId, range, credentials } = integrationConfig;

        logger.log(`info`, `data from routeeeeeeeeeeeeeeeee: ${JSON.stringify(data)}`)

        if (spreadsheetId && range && credentials) {
          // Convert data to Google Sheets format (headers and rows)
          const headers = Object.keys(data[0]);
          const rows = data.map((row: { [key: string]: any }) => Object.values(row));
          const outputData = [headers, ...rows]; // Include headers

          await writeDataToSheet(spreadsheetId, range, outputData);
          logger.log('info', `Data written to Google Sheet successfully for ${req.params.fileName}_${req.params.runId}`);
          return res.send({ success: true, message: 'Data updated in Google Sheet' });
        }
      }
      return res.status(400).send({ success: false, message: 'Google Sheet integration not configured' });
    }
    return res.status(400).send({ success: false, message: 'Run not successful or no data to update' });
  } catch (error: any) {
    logger.log('error', `Failed to write data to Google Sheet for ${req.params.fileName}_${req.params.runId}: ${error.message}`);
    return res.status(500).send({ success: false, message: 'Failed to update Google Sheet', error: error.message });
  }
});

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