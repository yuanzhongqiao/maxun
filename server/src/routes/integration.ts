import { Router } from 'express';;
import { google, sheets_v4 } from "googleapis";

export const router = Router()


router.post('/upload-credentials', (req, res) => {
    const credentials = req.body.credentials;
  
    if (!credentials) {
      return res.status(400).json({ message: 'Credentials are required.' });
    }