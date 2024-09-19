import { google } from "googleapis";
import fs from 'fs';
import path from 'path';
import logger from "../../logger";

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
