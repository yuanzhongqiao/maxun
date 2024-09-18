import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import logger from "../logger";

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

    try {
        //fs.writeFileSync(storedCredentialsPath, JSON.stringify(credentials));
        logger.log('info', 'Service account credentials saved successfully.');
    } catch (error: any) {
        logger.log('error', `Error saving credentials: ${error.message}`);
        return res.status(500).json({ message: 'Failed to save credentials.', error: error.message });
    }
});
