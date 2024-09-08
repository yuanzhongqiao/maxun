import React, { useState, useCallback } from 'react';
import { Button, Paper, Box, TextField } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import { SimpleBox } from "../atoms/Box";
import Typography from "@mui/material/Typography";
import { useGlobalInfoStore } from "../../context/globalInfo";
import { PaginationType, useActionContext, LimitType } from '../../context/browserActions';
import { useBrowserSteps } from '../../context/browserSteps';
import { useSocketStore } from '../../context/socket';
import { ScreenshotSettings } from '../../shared/types';
import InputAdornment from '@mui/material/InputAdornment';
import { SidePanelHeader } from '../molecules/SidePanelHeader';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';

// TODO: 
// 1. Handle field label update 
// 2. Handle field deletion | confirmation
// 3. Add description for each browser step
// 4. Handle non custom action steps

interface RightSidePanelProps {
  onFinishCapture: () => void;
}

export const RightSidePanel: React.FC<RightSidePanelProps> = ({ onFinishCapture }) => {
  const [textLabels, setTextLabels] = useState<{ [id: number]: string }>({});
  const [errors, setErrors] = useState<{ [id: number]: string }>({});
  const [confirmedTextSteps, setConfirmedTextSteps] = useState<{ [id: number]: boolean }>({});
  const [showPaginationOptions, setShowPaginationOptions] = useState(false);
  const [showLimitOptions, setShowLimitOptions] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState<string>('10');
  const [captureStage, setCaptureStage] = useState<'initial' | 'pagination' | 'limit' | 'complete'>('initial');


  const { lastAction, notify } = useGlobalInfoStore();
  const { getText, startGetText, stopGetText, getScreenshot, startGetScreenshot, stopGetScreenshot, paginationMode, getList, startGetList, stopGetList, startPaginationMode, stopPaginationMode, paginationType, updatePaginationType, limitMode, limitType, customLimit, updateLimitType, updateCustomLimit, stopLimitMode, startLimitMode } = useActionContext();
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

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedLimit(event.target.value);
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
    onFinishCapture();
  }, [stopGetText, getTextSettingsObject, socket, browserSteps, confirmedTextSteps]);


  const getListSettingsObject = useCallback(() => {
    let settings: {
      listSelector?: string;
      fields?: Record<string, { selector: string; tag?: string;[key: string]: any }>;
      pagination?: { type: string; selector?: string };
      limit?: number;
    } = {};

    browserSteps.forEach(step => {
      if (step.type === 'list' && step.listSelector && Object.keys(step.fields).length > 0) {
        const fields: Record<string, { selector: string; tag?: string;[key: string]: any }> = {};
        Object.entries(step.fields).forEach(([label, field]) => {
          if (field.selectorObj?.selector) {
            fields[label] = {
              selector: field.selectorObj.selector,
              tag: field.selectorObj.tag,
              attribute: field.selectorObj.attribute,
            };
          }
        });

        settings = {
          listSelector: step.listSelector,
          fields: fields,
          pagination: { type: paginationType, selector: step.pagination?.selector },
          limit: parseInt(selectedLimit === 'custom' ? customLimit : selectedLimit),
        };

      }
    });

    return settings;
  }, [browserSteps, paginationType, selectedLimit, customLimit]);

  const resetListState = useCallback(() => {
    setShowPaginationOptions(false);
    updatePaginationType(''); // Reset pagination type
    setShowLimitOptions(false); // Reset limit options
    setSelectedLimit('10'); // Reset limit value to default
    updateLimitType(''); // Reset limit type
    updateCustomLimit(''); // Reset custom limit value
  }, [updatePaginationType, updateLimitType, updateCustomLimit]);
  

  const handleStopGetList = useCallback(() => {
    stopGetList();
    resetListState();
  }, [stopGetList, resetListState]);

  const stopCaptureAndEmitGetListSettings = useCallback(() => {
    const settings = getListSettingsObject();
    if (settings) {
      socket?.emit('action', { action: 'scrapeList', settings });
    } else {
      notify('error', 'Unable to create list settings. Make sure you have defined a field for the list.');
    }
    handleStopGetList();
    onFinishCapture();
  }, [stopGetList, getListSettingsObject, socket, notify, handleStopGetList]);

  const handleConfirmListCapture = useCallback(() => {
    switch (captureStage) {
      case 'initial':
        // Start pagination mode
        startPaginationMode();
        setShowPaginationOptions(true);
        setCaptureStage('pagination');
        break;

      case 'pagination':
        if (!paginationType) {
          notify('error', 'Please select a pagination type.');
          return;
        }

        const settings = getListSettingsObject();
        const paginationSelector = settings.pagination?.selector;

        if (['clickNext', 'clickLoadMore'].includes(paginationType) && !paginationSelector) {
          notify('error', 'Please select the pagination element first.');
          return;
        }

        // Close pagination mode and start limit mode
        stopPaginationMode();
        setShowPaginationOptions(false);
        startLimitMode();
        setShowLimitOptions(true);
        setCaptureStage('limit');
        break;

      case 'limit':
        if (!limitType || (limitType === 'custom' && !customLimit)) {
          notify('error', 'Please select a limit or enter a custom limit.');
          return;
        }

        const limit = limitType === 'custom' ? parseInt(customLimit) : parseInt(limitType);
        if (isNaN(limit) || limit <= 0) {
          notify('error', 'Please enter a valid limit.');
          return;
        }

        // Close limit mode and emit settings
        stopLimitMode();
        setShowLimitOptions(false);
        stopCaptureAndEmitGetListSettings();
        setCaptureStage('complete');
        break;

      case 'complete':
        // Reset the capture process
        setCaptureStage('initial');
        break;
    }
  }, [captureStage, paginationType, limitType, customLimit, startPaginationMode, stopPaginationMode, startLimitMode, stopLimitMode, notify, stopCaptureAndEmitGetListSettings, getListSettingsObject]);
  


  const handlePaginationSettingSelect = (option: PaginationType) => {
    updatePaginationType(option);
    if (['clickNext', 'clickLoadMore'].includes(option)) {
    }
  };

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

      <SidePanelHeader />

      <Box display="flex" flexDirection="column" gap={2} style={{ margin: '15px' }}>
        {!getText && !getScreenshot && !getList && <Button variant="contained" onClick={startGetList}>Capture List</Button>}
        {getList && (
          <>
            <Box display="flex" justifyContent="space-between" gap={2} style={{ margin: '15px' }}>
              <Button variant="outlined" onClick={handleConfirmListCapture}>
                {captureStage === 'initial' ? 'Start Capture' :
                 captureStage === 'pagination' ? 'Confirm Pagination' :
                 captureStage === 'limit' ? 'Confirm Limit' : 'Finish Capture'}
              </Button>
              <Button variant="outlined" color="error" onClick={handleStopGetList}>Discard</Button>
            </Box>
          </>
        )}

        {showPaginationOptions && (
          <Box display="flex" flexDirection="column" gap={2} style={{ margin: '15px' }}>
            <Typography>How can we find the next list item on the page?</Typography>
            <Button variant={paginationType === 'clickNext' ? "contained" : "outlined"} onClick={() => handlePaginationSettingSelect('clickNext')}>Click on next to navigate to the next page</Button>
            <Button variant={paginationType === 'clickLoadMore' ? "contained" : "outlined"} onClick={() => handlePaginationSettingSelect('clickLoadMore')}>Click on load more to load more items</Button>
            <Button variant={paginationType === 'scrollDown' ? "contained" : "outlined"} onClick={() => handlePaginationSettingSelect('scrollDown')}>Scroll down to load more items</Button>
            <Button variant={paginationType === 'scrollUp' ? "contained" : "outlined"} onClick={() => handlePaginationSettingSelect('scrollUp')}>Scroll up to load more items</Button>
            <Button variant={paginationType === 'none' ? "contained" : "outlined"} onClick={() => handlePaginationSettingSelect('none')}>No more items to load</Button>
          </Box>
        )}

        {showLimitOptions && (
          <FormControl>
            <FormLabel>
              <h4>What is the maximum number of rows you want to extract?</h4>
            </FormLabel>
            <RadioGroup row value={limitType} onChange={(e) => updateLimitType(e.target.value as LimitType)} sx={{ width: '500px' }}>
              <FormControlLabel value="10" control={<Radio />} label="10" />
              <FormControlLabel value="100" control={<Radio />} label="100" />
              <FormControlLabel value="custom" control={<Radio />} label="Custom" />
              {limitType === 'custom' && (
                <TextField
                  type="number"
                  value={customLimit}
                  onChange={(e) => updateCustomLimit(e.target.value)}
                  placeholder="Enter number"
                  sx={{
                    marginLeft: '10px',
                    marginTop: '-3px',
                    '& input': {
                      padding: '10px',
                    },
                  }}
                />
              )}
            </RadioGroup>
          </FormControl>

        )}

        {!getText && !getScreenshot && !getList && <Button variant="contained" onClick={startGetText}>Capture Text</Button>}
        {getText &&
          <>
            <Box display="flex" justifyContent="space-between" gap={2} style={{ margin: '15px' }}>
              <Button variant="outlined" onClick={stopCaptureAndEmitGetTextSettings} >Confirm</Button>
              <Button variant="outlined" color="error" onClick={stopGetText} >Discard</Button>
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