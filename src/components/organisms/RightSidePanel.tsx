import React, { useState, useCallback } from 'react';
import { Button, Paper, Box, TextField } from "@mui/material";
import styled from "styled-components";
import { SimpleBox } from "../atoms/Box";
import Typography from "@mui/material/Typography";
import { useGlobalInfoStore } from "../../context/globalInfo";
import { useActionContext } from '../../context/browserActions';
import { useBrowserSteps } from '../../context/browserSteps';
import { useSocketStore } from '../../context/socket';
import { ScreenshotSettings } from '../../shared/types';

export const RightSidePanel = () => {
  const [textLabels, setTextLabels] = useState<{ [id: number]: string }>({});
  const [errors, setErrors] = useState<{ [id: number]: string }>({});
  const [confirmedTextSteps, setConfirmedTextSteps] = useState<{ [id: number]: boolean }>({});

  const { lastAction } = useGlobalInfoStore();
  const { getText, getScreenshot, startGetText, stopGetText, startGetScreenshot, stopGetScreenshot } = useActionContext();
  const { browserSteps, updateBrowserTextStepLabel, deleteBrowserStep, addScreenshotStep } = useBrowserSteps();
  const { socket } = useSocketStore();

  const handleTextLabelChange = (id: number, label: string) => {
    setTextLabels(prevLabels => ({ ...prevLabels, [id]: label }));
    if (!label.trim()) {
      setErrors(prevErrors => ({ ...prevErrors, [id]: 'Label cannot be empty' }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, [id]: '' }));
    }
  };

  const handleTextStepConfirm = (id: number) => {
    const label = textLabels[id]?.trim();
    if (label) {
      updateBrowserTextStepLabel(id, label);
      setConfirmedTextSteps(prev => ({ ...prev, [id]: true }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, [id]: 'Label cannot be empty' }));
    }
  };

  const handleTextStepDiscard = (id: number) => {
    deleteBrowserStep(id);
    setTextLabels(prevLabels => {
      const { [id]: _, ...rest } = prevLabels;
      return rest;
    });
    setErrors(prevErrors => {
      const { [id]: _, ...rest } = prevErrors;
      return rest;
    });
  };

  const getTextSettingsObject = useCallback(() => {
    const settings: Record<string, { selector: string; tag?: string; [key: string]: any }> = {};
    browserSteps.forEach(step => {
        if (step.type === 'text' && step.label && step.selectorObj?.selector) {
            settings[step.label] = step.selectorObj;
        }
    });
    return settings;
}, [browserSteps]);


const stopCaptureAndEmitGetTextSettings = useCallback(() => {
  stopGetText();
  const settings = getTextSettingsObject();
  const hasTextSteps = browserSteps.some(step => step.type === 'text');
  if (hasTextSteps) {
      socket?.emit('action', { action: 'scrapeSchema', settings });
  }
}, [stopGetText, getTextSettingsObject, socket, browserSteps]);


  const captureScreenshot = (fullPage: boolean) => {
    const screenshotSettings: ScreenshotSettings = {
      fullPage,
      type: 'png',
      timeout: 30000,
      animations: 'allow',
      caret: 'hide',
      scale: 'device',
    };
    socket?.emit('action', { action: 'screenshot', settings: screenshotSettings });
    addScreenshotStep(fullPage);
  };

  return (
    <Paper variant="outlined" sx={{ height: '100%', width: '100%', backgroundColor: 'white', alignItems: "center" }}>
      <SimpleBox height={60} width='100%' background='lightGray' radius='0%'>
        <Typography sx={{ padding: '10px' }}>Last action: {` ${lastAction}`}</Typography>
      </SimpleBox>

      <Box display="flex" flexDirection="column" gap={2} style={{ margin: '15px' }}>
        {!getText && !getScreenshot && <Button variant="contained" onClick={startGetText}>Capture Text</Button>}
        {getText && <Button variant="outlined" color="error" onClick={stopCaptureAndEmitGetTextSettings}>Discard</Button>}
        {!getText && !getScreenshot && <Button variant="contained" onClick={startGetScreenshot}>Capture Screenshot</Button>}
        {getScreenshot && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Button variant="contained" onClick={() => captureScreenshot(true)}>Capture Fullpage</Button>
            <Button variant="contained" onClick={() => captureScreenshot(false)}>Capture Visible Part</Button>
            <Button variant="outlined" color="error" onClick={stopGetScreenshot}>Discard</Button>
          </Box>
        )}
      </Box>

      {
        getText ? (
          <Box>
            {browserSteps.map(step => (
              <Box key={step.id} sx={{ boxShadow: 5, padding: '10px', margin: '10px', borderRadius: '4px' }}>
               {
                step.type === 'text' ? (
                  <>
                   <TextField
                  label="Label"
                  value={textLabels[step.id] || step.label || ''}
                  onChange={(e) => handleTextLabelChange(step.id, e.target.value)}
                  fullWidth
                  margin="normal"
                  error={!!errors[step.id]}
                  helperText={errors[step.id]}
                  InputProps={{ readOnly: confirmedTextSteps[step.id] }}
                />
                <TextField
                  label="Data"
                  value={step.data}
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: confirmedTextSteps[step.id] }}
                />
                {!confirmedTextSteps[step.id] && (
                  <Box display="flex" justifyContent="space-between" gap={2}>
                    <Button variant="contained" onClick={() => handleTextStepConfirm(step.id)} disabled={!textLabels[step.id]?.trim()}>Confirm</Button>
                    <Button variant="contained" onClick={() => handleTextStepDiscard(step.id)}>Discard</Button>
                  </Box>
                )}
                  </>
                ) : null
               }
              </Box>
            ))}
          </Box>
        ) : null
      }
    </Paper>
  );
};

export const ActionDescription = styled.p`
  margin-left: 15px;
`;
