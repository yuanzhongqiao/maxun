import { google } from "googleapis";
import fs from 'fs';
import path from 'path';

export async function writeDataToSheet(spreadsheetId: string, range: string, data: any[]) {
  try {
    const credentialsPath = path.join(__dirname, 'service_account_credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
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

    console.log(`Data written to Google Sheet: ${spreadsheetId}, Range: ${range}`);
  } catch (error) {
    console.error(`Error writing data to Google Sheet: ${error.message}`);
    throw error;
  }
}
