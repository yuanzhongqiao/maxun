import React, { useState, useCallback } from 'react';
import { Button, Paper, Box, TextField } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import { SimpleBox } from "../atoms/Box";
import Typography from "@mui/material/Typography";
import { useGlobalInfoStore } from "../../context/globalInfo";
import { useActionContext } from '../../context/browserActions';
import { useBrowserSteps, ListStep, TextStep, SelectorObject } from '../../context/browserSteps';
import { useSocketStore } from '../../context/socket';
import { ScreenshotSettings } from '../../shared/types';
import InputAdornment from '@mui/material/InputAdornment';

// TODO: 
// 1. Handle field label update 
// 2. Handle field deletion | confirmation
// 3. Add description for each browser step
// 4. Handle non custom action steps

export const RightSidePanel = () => {
  const [textLabels, setTextLabels] = useState<{ [id: number]: string }>({});
  const [errors, setErrors] = useState<{ [id: number]: string }>({});
  const [confirmedTextSteps, setConfirmedTextSteps] = useState<{ [id: number]: boolean }>({});
  const [showPaginationOptions, setShowPaginationOptions] = useState(false);
  const [selectedPaginationSetting, setSelectedPaginationSetting] = useState<string | null>(null);

  const { lastAction, notify } = useGlobalInfoStore();
  const { getText, startGetText, stopGetText, getScreenshot, startGetScreenshot, stopGetScreenshot, getList, startGetList, stopGetList } = useActionContext();
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
    const settings: Record<string, { selector: string; tag?: string;[key: string]: any }> = {};
    browserSteps.forEach(step => {
      if (step.type === 'text' && step.label && step.selectorObj?.selector) {
        settings[step.label] = step.selectorObj;
      }
    });
    return settings;
  }, [browserSteps]);


  const stopCaptureAndEmitGetTextSettings = useCallback(() => {
    const hasUnconfirmedTextSteps = browserSteps.some(step => step.type === 'text' && !confirmedTextSteps[step.id]);
    if (hasUnconfirmedTextSteps) {
      notify('error', 'Please confirm no labels are empty');
      return;
    }
    stopGetText();
    const settings = getTextSettingsObject();
    const hasTextSteps = browserSteps.some(step => step.type === 'text');
    if (hasTextSteps) {
      socket?.emit('action', { action: 'scrapeSchema', settings });
    }
  }, [stopGetText, getTextSettingsObject, socket, browserSteps, confirmedTextSteps]);


  const getListSettingsObject = useCallback(() => {
    let settings: { listSelector?: string; fields?: Record<string, { selector: string; tag?: string;[key: string]: any }> } = {};

    browserSteps.forEach(step => {
      if (step.type === 'list' && step.listSelector && Object.keys(step.fields).length > 0) {
        const fields: Record<string, { selector: string; tag?: string;[key: string]: any }> = {};
        Object.entries(step.fields).forEach(([label, field]) => {
          if (field.selectorObj?.selector) {
            fields[label] = {
              selector: field.selectorObj.selector,
              tag: field.selectorObj.tag,
              attribute: field.selectorObj.attribute
            };
          }
        });

        settings = {
          listSelector: step.listSelector,
          fields: fields
        };

      }
    });

    return settings;
  }, [browserSteps]);


  const stopCaptureAndEmitGetListSettings = useCallback(() => {
    stopGetList();
    const settings = getListSettingsObject();
    if (settings) {
      socket?.emit('action', { action: 'scrapeList', settings });
    } else {
      notify('error', 'Unable to create list settings. Make sure you have defined a field for the list.');
    }
  }, [stopGetList, getListSettingsObject, socket, notify]);

  // const handleListFieldChange = (stepId: number, key: 'label' | 'data', value: string) => {
  //   updateListStepField(stepId, key, value);
  // };  

  const handleConfirmListCapture = useCallback(() => {
    if (!selectedPaginationSetting) {
      setShowListOptions(true);
      return;
    }
    // Proceed to stop capture and emit settings only after option is selected
    stopCaptureAndEmitGetListSettings();
    setShowListOptions(false); // Reset options display
    setSelectedOption(null);   // Reset selected option
  }, [selectedPaginationSetting, stopCaptureAndEmitGetListSettings]);


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
    stopGetScreenshot();
  };

  return (
    <Paper variant="outlined" sx={{ height: '100%', width: '100%', backgroundColor: 'white', alignItems: "center" }}>
      <SimpleBox height={60} width='100%' background='lightGray' radius='0%'>
        <Typography sx={{ padding: '10px' }}>Last action: {` ${lastAction}`}</Typography>
      </SimpleBox>

      <Box display="flex" flexDirection="column" gap={2} style={{ margin: '15px' }}>
        {!getText && !getScreenshot && !getList && <Button variant="contained" onClick={startGetList}>Capture List</Button>}
        {getList &&
          <>
            <Box display="flex" justifyContent="space-between" gap={2} style={{ margin: '15px' }}>
              <Button variant="outlined" onClick={stopCaptureAndEmitGetListSettings}>Confirm</Button>
              <Button variant="outlined" color="error" onClick={stopGetList}>Discard</Button>
            </Box>
          </>
        }

        {!getText && !getScreenshot && !getList && <Button variant="contained" onClick={startGetText}>Capture Text</Button>}
        {getText &&
          <>
            <Box display="flex" justifyContent="space-between" gap={2} style={{ margin: '15px' }}>
              <Button variant="outlined" onClick={stopCaptureAndEmitGetTextSettings}>Confirm</Button>
              <Button variant="outlined" color="error" onClick={stopGetText}>Discard</Button>
            </Box>
          </>
        }

        {!getText && !getScreenshot && !getList && <Button variant="contained" onClick={startGetScreenshot}>Capture Screenshot</Button>}
        {getScreenshot && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Button variant="contained" onClick={() => captureScreenshot(true)}>Capture Fullpage</Button>
            <Button variant="contained" onClick={() => captureScreenshot(false)}>Capture Visible Part</Button>
            <Button variant="outlined" color="error" onClick={stopGetScreenshot}>Discard</Button>
          </Box>
        )}
      </Box>

      <Box>
        {browserSteps.map(step => (
          <Box key={step.id} sx={{ boxShadow: 5, padding: '10px', margin: '10px', borderRadius: '4px' }}>
            {
              step.type === 'text' && (
                <>
                  <TextField
                    label="Label"
                    value={textLabels[step.id] || step.label || ''}
                    onChange={(e) => handleTextLabelChange(step.id, e.target.value)}
                    fullWidth
                    margin="normal"
                    error={!!errors[step.id]}
                    helperText={errors[step.id]}
                    InputProps={{
                      readOnly: confirmedTextSteps[step.id],
                      startAdornment: (
                        <InputAdornment position="start">
                          <EditIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                  <TextField
                    label="Data"
                    value={step.data}
                    fullWidth
                    margin="normal"
                    InputProps={{
                      readOnly: confirmedTextSteps[step.id],
                      startAdornment: (
                        <InputAdornment position="start">
                          <TextFieldsIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                  {!confirmedTextSteps[step.id] && (
                    <Box display="flex" justifyContent="space-between" gap={2}>
                      <Button variant="contained" onClick={() => handleTextStepConfirm(step.id)} disabled={!textLabels[step.id]?.trim()}>Confirm</Button>
                      <Button variant="contained" onClick={() => handleTextStepDiscard(step.id)}>Discard</Button>
                    </Box>
                  )}
                </>
              )}
            {step.type === 'screenshot' && (
              <Box display="flex" alignItems="center">
                <DocumentScannerIcon sx={{ mr: 1 }} />
                <Typography>
                  {`Take ${step.fullPage ? 'Fullpage' : 'Visible Part'} Screenshot`}
                </Typography>
              </Box>
            )}
            {step.type === 'list' && (
              <>
                <Typography>List Selected Successfully</Typography>
                {Object.entries(step.fields).map(([key, field]) => (
                  <Box key={key}>
                    <TextField
                      label="Field Label"
                      value={field.label || ''}
                      onChange={() => { }}
                      fullWidth
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EditIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                    <TextField
                      label="Field Data"
                      value={field.data || ''}
                      fullWidth
                      margin="normal"
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <TextFieldsIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Box>
                ))}
              </>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};