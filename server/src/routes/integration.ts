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