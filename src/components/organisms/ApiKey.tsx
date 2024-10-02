import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import styled from 'styled-components';
import axios from 'axios';
import { useGlobalInfoStore } from '../../context/globalInfo';

const Container = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
`;

const ApiKeyField = styled(TextField)`
  width: 400px;
  margin: 20px 0;
`;

const HiddenText = styled(Typography)`
  color: #888;
  font-style: italic;
`;

const CenteredContent = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
`;

const ApiKeyManager = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const { notify } = useGlobalInfoStore();

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data } = await axios.get('http://localhost:8080/auth/api-key');
        setApiKey(data.api_key);
      } catch (error) {
        console.error('Error fetching API key', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  const generateApiKey = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:8080/auth/generate-api-key');
      setApiKey(data.api_key);
      notify('info', `Generated API Key: ${data.api_key}`);
    } catch (error) {
      console.error('Error generating API key', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Container>
      <Typography variant="h5">Manage Your API Key</Typography>

      {apiKey ? (
        <>
          <ApiKeyField
            label="Your API Key"
            variant="outlined"
            value="**** **** **** ****"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={copyToClipboard} edge="end">
                    <ContentCopy />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {copySuccess && (
            <Tooltip title="Copied!" open={copySuccess} placement="right">
              <Typography variant="caption" color="primary">
                Copied to Clipboard
              </Typography>
            </Tooltip>
          )}
        </>
      ) : (
        <CenteredContent>
          <Typography>You haven't generated an API key yet.</Typography>
          <Button
            onClick={generateApiKey}
            variant="contained"
            color="primary"
            style={{ marginTop: '20px' }}
          >
            Generate API Key
          </Button>
        </CenteredContent>
      )}
    </Container>
  );
};

export default ApiKeyManager;

