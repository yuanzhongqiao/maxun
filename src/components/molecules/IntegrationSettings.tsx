import React, { useState } from 'react';
import { GenericModal } from "../atoms/GenericModal";
import { MenuItem, TextField, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { modalStyle } from "./AddWhereCondModal";

interface GoogleSheetsIntegrationProps {
  isOpen: boolean;
  handleSubmit: (data: GoogleSheetsSettings) => void;
  handleClose: () => void;
}

export interface GoogleSheetsSettings {
  credentials: string;
  spreadsheetId: string;
  range: string;
  data: string;
}

export const GoogleSheetsIntegrationModal = ({ isOpen, handleSubmit, handleClose }: GoogleSheetsIntegrationProps) => {

  const [settings, setSettings] = useState<GoogleSheetsSettings>({
    credentials: '',
    spreadsheetId: '',
    range: '',
    data: '',
  });

  const handleChange = (field: keyof GoogleSheetsSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [field]: e.target.value });
  };

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={handleClose}
      modalStyle={modalStyle}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginLeft: '65px',
      }}>
        <Typography sx={{ margin: '20px 0px' }}>Google Sheets Integration</Typography>

        <TextField
          sx={{ marginBottom: '15px' }}
          label="Service Account JSON"
          multiline
          rows={10}
          required
          value={settings.credentials}
          onChange={handleChange('credentials')}
          fullWidth
        />

        <TextField
          sx={{ marginBottom: '15px' }}
          label="Google Spreadsheet ID"
          required
          value={settings.spreadsheetId}
          onChange={handleChange('spreadsheetId')}
          fullWidth
        />

        <TextField
          sx={{ marginBottom: '15px' }}
          label="Range (e.g., Sheet1!A1:B2)"
          required
          value={settings.range}
          onChange={handleChange('range')}
          fullWidth
        />

        <TextField
          sx={{ marginBottom: '15px' }}
          label="Data (comma-separated, newline for rows)"
          multiline
          rows={4}
          value={settings.data}
          onChange={handleChange('data')}
          fullWidth
        />

        <Button variant="contained" color="primary" onClick={() => handleSubmit(settings)} style={{ marginTop: '10px' }}>
          Submit
        </Button>
      </div>
    </GenericModal>
  );
};
