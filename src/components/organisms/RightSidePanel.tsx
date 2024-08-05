import React, { useState, useEffect, useCallback } from 'react';
import { Button, MenuItem, Paper, Box, TextField } from "@mui/material";
import { Dropdown as MuiDropdown } from '../atoms/DropdownMui';
import styled from "styled-components";
import { SimpleBox } from "../atoms/Box";
import Typography from "@mui/material/Typography";
import { useGlobalInfoStore } from "../../context/globalInfo";
import { PairForEdit } from "../../pages/RecordingPage";
import { useActionContext } from '../../context/browserActions';
import { useBrowserSteps } from '../../context/browserSteps';
import { useSocketStore } from '../../context/socket';
import { ScreenshotSettings } from '../../shared/types';

interface RightSidePanelProps {
  pairForEdit: PairForEdit;
}

export const RightSidePanel = ({ pairForEdit }: RightSidePanelProps) => {
  const [labels, setLabels] = useState<{ [id: number]: string }>({});
  const [errors, setErrors] = useState<{ [id: number]: string }>({});
  const [confirmedSteps, setConfirmedSteps] = useState<{ [id: number]: boolean }>({});

  const { lastAction } = useGlobalInfoStore();
  const { getText, getScreenshot, startGetText, stopGetText, startGetScreenshot, stopGetScreenshot } = useActionContext();
  const { browserSteps, updateBrowserStepLabel, deleteBrowserStep } = useBrowserSteps();
  const { socket } = useSocketStore();

  const handleLabelChange = (id: number, label: string) => {
    setLabels(prevLabels => ({ ...prevLabels, [id]: label }));
    if (!label.trim()) {
      setErrors(prevErrors => ({ ...prevErrors, [id]: 'Label cannot be empty' }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, [id]: '' }));
    }
  };

  const handleConfirm = (id: number) => {
    const label = labels[id]?.trim();
    if (label) {
      updateBrowserStepLabel(id, label);
      setConfirmedSteps(prev => ({ ...prev, [id]: true }));
    } else {
      setErrors(prevErrors => ({ ...prevErrors, [id]: 'Label cannot be empty' }));
    }
  };

  const handleDiscard = (id: number) => {
    deleteBrowserStep(id);
    setLabels(prevLabels => {
      const { [id]: _, ...rest } = prevLabels;
      return rest;
    });
    setErrors(prevErrors => {
      const { [id]: _, ...rest } = prevErrors;
      return rest;
    });
  };

  const createSettingsObject = useCallback(() => {
    const settings: Record<string, { selector: string; tag?: string;[key: string]: any }> = {};
    browserSteps.forEach(step => {
      if (step.label && step.selectorObj && step.selectorObj.selector) {
        settings[step.label] = step.selectorObj;
      }
    });
    return settings;
  }, [browserSteps]);

  const stopCaptureAndEmitSettings = useCallback(() => {
    stopGetText();
    const settings = createSettingsObject();
    if (browserSteps.length > 0) {
      socket?.emit('action', { action: 'scrapeSchema', settings });
    }
  }, [stopGetText, createSettingsObject, socket]);

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
  };

  return (
    <Paper variant="outlined" sx={{ height: '100%', width: '100%', backgroundColor: 'white', alignItems: "center" }}>
      <SimpleBox height={60} width='100%' background='lightGray' radius='0%'>
        <Typography sx={{ padding: '10px' }}>Last action: {` ${lastAction}`}</Typography>
      </SimpleBox>

      <Box display="flex" flexDirection="column" gap={2} style={{ margin: '15px' }}>
        {!getText && !getScreenshot && <Button variant="contained" onClick={startGetText}>Capture Text</Button>}
        {getText && <Button variant="contained" onClick={stopCaptureAndEmitSettings}>Stop Capture Text</Button>}
        {!getText && !getScreenshot && <Button variant="contained" onClick={startGetScreenshot}>Capture Screenshot</Button>}
        {getScreenshot && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Button variant="contained" onClick={() => captureScreenshot(true)}>Capture Fullpage</Button>
            <Button variant="contained" onClick={() => captureScreenshot(false)}>Capture Visible Part</Button>
            <Button variant="contained" onClick={stopGetScreenshot}>Stop Capture Screenshot</Button>
          </Box>
        )}
      </Box>

      <Box>
        {browserSteps.map(step => (
          <Box key={step.id} sx={{ boxShadow: 5, padding: '10px', margin: '10px', borderRadius: '4px' }}>
            <TextField
              label="Label"
              value={labels[step.id] || step.label || ''}
              onChange={(e) => handleLabelChange(step.id, e.target.value)}
              fullWidth
              margin="normal"
              error={!!errors[step.id]}
              helperText={errors[step.id]}
              InputProps={{ readOnly: confirmedSteps[step.id] }}
            />
            <TextField
              label="Data"
              value={step.data}
              fullWidth
              margin="normal"
              InputProps={{ readOnly: confirmedSteps[step.id] }}
            />
            {!confirmedSteps[step.id] && (
              <Box display="flex" justifyContent="space-between" gap={2}>
                <Button variant="contained" onClick={() => handleConfirm(step.id)} disabled={!labels[step.id]?.trim()}>Confirm</Button>
                <Button variant="contained" onClick={() => handleDiscard(step.id)}>Discard</Button>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export const ActionDescription = styled.p`
  margin-left: 15px;
`;
