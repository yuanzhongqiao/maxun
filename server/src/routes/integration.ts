import { Router } from 'express';
import { google } from "googleapis";
import fs from 'fs';
import path from 'path';
import logger from "../logger";

export const router = Router();

router.post('/upload-credentials', async (req, res) => {
    const { credentials, spreadsheetId, range } = req.body;

    if (!credentials || !spreadsheetId || !range) {
        return res.status(400).json({ message: 'Credentials, Spreadsheet ID, and Range are required.' });
    }

    // Store the credentials in a secure place (for test, we store them locally)
    const storedCredentialsPath = path.join(__dirname, 'service_account_credentials.json');

    try {
        fs.writeFileSync(storedCredentialsPath, JSON.stringify(credentials));
        logger.log('info', 'Service account credentials saved successfully.');
    } catch (error: any) {
        logger.log('error', `Error saving credentials: ${error.message}`);
        return res.status(500).json({ message: 'Failed to save credentials.', error: error.message });
    }
});
