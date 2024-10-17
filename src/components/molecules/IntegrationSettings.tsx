import React, { useState, useEffect } from 'react';
import { GenericModal } from "../atoms/GenericModal";
import { MenuItem, Typography, CircularProgress } from "@mui/material";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import axios from 'axios';
import { useGlobalInfoStore } from '../../context/globalInfo';
import { getStoredRecording } from '../../api/storage';

interface IntegrationProps {
    isOpen: boolean;
    handleStart: (data: IntegrationSettings) => void;
    handleClose: () => void;
}

export interface IntegrationSettings {
    spreadsheetId: string;
    spreadsheetName: string;
    data: string;
}

export const IntegrationSettingsModal = ({ isOpen, handleStart, handleClose }: IntegrationProps) => {
    const [settings, setSettings] = useState<IntegrationSettings>({
        spreadsheetId: '',
        spreadsheetName: '',
        data: '',
    });

    const [spreadsheets, setSpreadsheets] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { recordingId } = useGlobalInfoStore();
    const [recording, setRecording] = useState<any>(null);

    const authenticateWithGoogle = () => {
        window.location.href = `http://localhost:8080/auth/google?robotId=${recordingId}`;
    };

    const handleOAuthCallback = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/auth/google/callback`);
            const { google_sheet_email, files } = response.data;
        } catch (error) {
            setError('Error authenticating with Google');
        }
    };

    const fetchSpreadsheetFiles = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/auth/gsheets/files?robotId=${recordingId}`, {
                withCredentials: true,
            });
            setSpreadsheets(response.data);
        } catch (error: any) {
            console.error('Error fetching spreadsheet files:', error.response?.data?.message || error.message);
        }
    };

    const handleSpreadsheetSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedSheet = spreadsheets.find(sheet => sheet.id === e.target.value);
        if (selectedSheet) {
            setSettings({ ...settings, spreadsheetId: selectedSheet.id, spreadsheetName: selectedSheet.name });
        }
    };

    const updateGoogleSheetId = async () => {
        try {
            const response = await axios.post(
                `http://localhost:8080/auth/gsheets/update`,
                { spreadsheetId: settings.spreadsheetId, spreadsheetName: settings.spreadsheetName, robotId: recordingId },
                { withCredentials: true }
            );
            console.log('Google Sheet ID updated:', response.data);
        } catch (error: any) {
            console.error('Error updating Google Sheet ID:', error.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        // Check if we're on the callback URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            handleOAuthCallback();
        }

        const fetchRecordingInfo = async () => {
            if (!recordingId) return;
            const recording = await getStoredRecording(recordingId);
            if (recording) {
                setRecording(recording);
            }
        };

        fetchRecordingInfo();
    }, [recordingId]);

    return (
        <GenericModal isOpen={isOpen} onClose={handleClose}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: '65px' }}>
                <Typography sx={{ margin: '20px 0px' }}>Google Sheets Integration</Typography>

                {recording && recording.google_sheet_id ? (
                    <Typography sx={{ marginBottom: '10px' }}>
                        Google Sheet Integrated Successfully!
                        <br />
                        Sheet Name: {recording.google_sheet_name}
                        <br />
                        Sheet ID: {recording.google_sheet_id}
                    </Typography>
                ) : (
                    <>
                        {!recording?.google_sheet_email ? (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={authenticateWithGoogle}
                                style={{ marginBottom: '15px' }}
                            >
                                Authenticate with Google
                            </Button>
                        ) : (
                            <>
                                {recording.google_sheet_email && (
                                    <Typography sx={{ marginBottom: '10px' }}>
                                        Logged in as: {recording.google_sheet_email}
                                    </Typography>
                                )}

                                {loading ? (
                                    <CircularProgress sx={{ marginBottom: '15px' }} />
                                ) : error ? (
                                    <Typography color="error">{error}</Typography>
                                ) : spreadsheets.length === 0 ? (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={fetchSpreadsheetFiles}
                                        style={{ marginBottom: '15px' }}
                                    >
                                        Fetch Google Spreadsheets
                                    </Button>
                                ) : (
                                    <>
                                        <TextField
                                            sx={{ marginBottom: '15px' }}
                                            select
                                            label="Select Google Spreadsheet"
                                            required
                                            value={settings.spreadsheetId}
                                            onChange={handleSpreadsheetSelect}
                                            fullWidth
                                        >
                                            {spreadsheets.map(sheet => (
                                                <MenuItem key={sheet.id} value={sheet.id}>
                                                    {sheet.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        {settings.spreadsheetId && (
                                            <Typography sx={{ marginBottom: '10px' }}>
                                                Selected Sheet: {spreadsheets.find(s => s.id === settings.spreadsheetId)?.name} (ID: {settings.spreadsheetId})
                                            </Typography>
                                        )}

                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => {
                                                updateGoogleSheetId();
                                                handleStart(settings);
                                            }}
                                            style={{ marginTop: '10px' }}
                                            disabled={!settings.spreadsheetId || loading}
                                        >
                                            Submit
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </GenericModal>
    );
};
