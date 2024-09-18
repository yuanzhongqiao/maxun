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

    // Todo: Store the credentials in a secure place (for test, we store them locally)
    const storedCredentialsPath = path.join(__dirname, 'service_account_credentials.json');

    try {
        fs.writeFileSync(storedCredentialsPath, JSON.stringify(credentials));
        logger.log('info', 'Service account credentials saved successfully.');
    } catch (error: any) {
        logger.log('error', `Error saving credentials: ${error.message}`);
        return res.status(500).json({ message: 'Failed to save credentials.', error: error.message });
    }

    let storedCredentials;
    try {
        storedCredentials = JSON.parse(fs.readFileSync(storedCredentialsPath, 'utf-8'));
    } catch (error: any) {
        logger.log('error', `Error reading credentials: ${error.message}`);
        return res.status(500).json({ message: 'Failed to read credentials.', error: error.message });
    }

    let authToken;
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: storedCredentials.client_email,
                private_key: storedCredentials.private_key,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        authToken = await auth.getClient();
        logger.log('info', 'Authenticated with Google Sheets API successfully.');
    } catch (error: any) {
        logger.log('error', `Google Sheets API Authentication failed: ${error.message}`);
        return res.status(500).json({ message: 'Authentication with Google failed.', error: error.message });
    }

    const sheets = google.sheets({ version: 'v4', auth: authToken });

    const values = [
        ['Scraped Data 1', 'More Data', 'IDKKKKKKKKK'],
    ];

    const resource = {
        values,
    };

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: resource,
        });
        logger.log('info', `Data written to Google Sheet: ${spreadsheetId}, Range: ${range}`);
        return res.status(200).json({ message: 'Data written to Google Sheet successfully.' });
    } catch (error: any ) {
        logger.log('error', `Failed to write to Google Sheet: ${error.message}`);
        return res.status(500).json({ message: 'Failed to write to Google Sheet.', error: error.message });
    }
});

