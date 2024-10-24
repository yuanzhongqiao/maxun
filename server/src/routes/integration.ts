import { Router } from 'express';
import logger from "../logger";
// import { loadIntegrations, saveIntegrations } from '../workflow-management/integrations/gsheet';
import { requireSignIn } from '../middlewares/auth';

export const router = Router();

router.post('/upload-credentials', requireSignIn, async (req, res) => {
  try {
    const { fileName, credentials, spreadsheetId, range } = req.body;
    if (!fileName || !credentials || !spreadsheetId || !range) {
      return res.status(400).json({ message: 'Credentials, Spreadsheet ID, and Range are required.' });
    }
    // *** TEMPORARILY WE STORE CREDENTIALS HERE ***
  } catch (error: any) {
    logger.log('error', `Error saving credentials: ${error.message}`);
    return res.status(500).json({ message: 'Failed to save credentials.', error: error.message });
  }
});