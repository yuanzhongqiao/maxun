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