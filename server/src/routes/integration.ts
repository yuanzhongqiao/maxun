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

    console.log(`fileName: ${fileName}, credentials: ${credentials}, spreadsheetId: ${spreadsheetId}, range: ${range}`);

    if (!fileName || !credentials || !spreadsheetId || !range) {
        return res.status(400).json({ message: 'Credentials, Spreadsheet ID, and Range are required.' });
    }

    // Store the credentials in a secure place (for test, we store them locally)
    // Load existing integrations from the JSON file
    const integrations = loadIntegrations();

    // Add or update the integration for the specific task (fileName)
    integrations[fileName] = { spreadsheetId, range };

    // Save the updated integrations back to the file
    saveIntegrations(integrations);
    logger.log('info', 'Service account credentials saved successfully.');

    return res.send(true);

    //fs.writeFileSync(storedCredentialsPath, JSON.stringify(credentials));
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
        const data = parsedRun.serializableOutput as { [key: string]: any }[];
        const integrationConfig = await loadIntegrations();
        
        if (integrationConfig) {
          const { spreadsheetId, sheetName, credentials } = integrationConfig;
  
          if (spreadsheetId && sheetName && credentials) {
            // Convert data to Google Sheets format (headers and rows)
            const headers = Object.keys(data[0]);
            const rows = data.map((row: { [key: string]: any }) => Object.values(row));
            const outputData = [headers, ...rows]; // Include headers
  
            await writeDataToSheet(spreadsheetId, sheetName, outputData);
            logger.log('info', `Data written to Google Sheet successfully for ${req.params.fileName}_${req.params.runId}`);
            return res.send({ success: true, message: 'Data updated in Google Sheet' });
          }
        }
        return res.status(400).send({ success: false, message: 'Google Sheet integration not configured' });
      }
      return res.status(400).send({ success: false, message: 'Run not successful or no data to update' });
    } catch (error) {
      logger.log('error', `Failed to write data to Google Sheet for ${req.params.fileName}_${req.params.runId}: ${error.message}`);
      return res.status(500).send({ success: false, message: 'Failed to update Google Sheet', error: error.message });
    }
  });
