import { Router } from 'express';;
import { google } from "googleapis";
import { OAuth2Client } from 'google-auth-library'

export const router = Router()

const oauth2Client = new OAuth2Client(
    '_CLIENT_ID',
    '_CLIENT_SECRET',
    '_REDIRECT_URI'
);

// initialize Google OAuth 2.0 flow
router.get('/auth/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/spreadsheets'
        ]
    });
    res.redirect(url);
});

// Callback route for Google OAuth 2.0
router.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        // Store tokens securely (e.g., in a database)
        res.send('Authentication successful');
    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).send('Authentication failed');
    }
});

router.get('/sheets', async (req, res) => {
    try {
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        const response = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.spreadsheet'",
            fields: 'files(id, name)'
        });
        res.json(response.data.files);
    } catch (error) {
        console.error('Error listing sheets:', error);
        res.status(500).send('Failed to list sheets');
    }
});

router.get('/sheets/:sheetId', async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: req.params.sheetId,
            range: 'Sheet1', // Adjust range as needed
        });
        res.json(response.data.values);
    } catch (error) {
        console.error('Error reading sheet:', error);
        res.status(500).send('Failed to read sheet');
    }
});

router.post('/sheets/:sheetId', async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: req.params.sheetId,
            range: 'Sheet1', // Adjust range as needed
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [req.body.values], // Expect an array of values in the request body
            },
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error writing to sheet:', error);
        res.status(500).send('Failed to write to sheet');
    }
});