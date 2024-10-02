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
import { Visibility, VisibilityOff, ContentCopy } from '@mui/icons-material';
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

const ApiKey = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const { notify } = useGlobalInfoStore();

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data } = await axios.get('http://localhost:8080/auth/api-key');
        setApiKey(data.api_key);
        notify('info', `Fetc API Key: ${data.api_key}`);
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
      notify('info', `Genrate API Key: ${data.api_key}`);
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

  const toggleShowKey = () => {
    setShowKey(!showKey);
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
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={toggleShowKey} edge="end">
                    {showKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button onClick={copyToClipboard} variant="contained" color="primary">
            Copy to Clipboard
          </Button>

          {copySuccess && (
            <Tooltip title="Copied!" open={copySuccess}>
              <span></span>
            </Tooltip>
          )}
        </>
      ) : (
        <>
          <HiddenText>You haven't generated an API key yet.</HiddenText>
          <Button onClick={generateApiKey} variant="contained" color="primary">
            Generate API Key
          </Button>
        </>
      )}
    </Container>
  );
};

export default ApiKey;
