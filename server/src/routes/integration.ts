import { Router } from 'express';;
import { google, sheets_v4 } from "googleapis";
import fs from 'fs';
import path from 'path';

export const router = Router()

router.post('/upload-credentials', (req, res) => {
    const credentials = req.body.credentials;

    if (!credentials) {
        return res.status(400).json({ message: 'Credentials are required.' });
    }
    // Todo: Store the credentials in a secure place (for test, we store them locally)
    const storedCredentialsPath = path.join(__dirname, 'service_account_credentials.json');
    fs.writeFileSync(storedCredentialsPath, JSON.stringify(credentials));

    res.status(200).json({ message: 'Service Account credentials saved successfully.' });
});

router.post('/write-to-sheet', async (req, res) => {
    try {
        const { spreadsheetId, range, values } = req.body;

        // Load the stored credentials
        const credentialsPath = path.join(__dirname, 'service_account_credentials.json');
        if (!fs.existsSync(credentialsPath)) {
            return res.status(400).json({ message: 'No credentials found. Please provide credentials first.' });
        }

        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

        // Authenticate with Google using the service account credentials
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Write data to the provided Google Sheet and range
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: values, // Expecting an array of arrays, like [['data1', 'data2'], ['data3', 'data4']]
            },
        });

        res.status(200).json({ message: 'Data written to Google Sheet successfully.' });
    } catch (error) {
        console.error('Error writing to sheet:', error);
        res.status(500).json({ message: 'Failed to write to Google Sheet.', error });
    }
});
