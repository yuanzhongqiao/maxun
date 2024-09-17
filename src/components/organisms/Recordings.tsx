import React, { useState } from 'react';
import { RecordingsTable } from "../molecules/RecordingsTable";
import { Grid } from "@mui/material";
import { RunSettings, RunSettingsModal } from "../molecules/RunSettings";
import { ScheduleSettings, ScheduleSettingsModal } from "../molecules/ScheduleSettings";
import { IntegrationSettings, IntegrationSettingsModal } from "../molecules/IntegrationSettings";

interface RecordingsProps {
  handleEditRecording: (fileName: string) => void;
  handleRunRecording: (settings: RunSettings) => void;
  handleScheduleRecording: (settings: ScheduleSettings) => void;
  handleIntegrateRecording: (settings: ScheduleSettings) => void;
  setFileName: (fileName: string) => void;
}

export const Recordings = ({ handleEditRecording, handleRunRecording, setFileName, handleScheduleRecording, handleIntegrateRecording }: RecordingsProps) => {
  const [runSettingsAreOpen, setRunSettingsAreOpen] = useState(false);
  const [scheduleSettingsAreOpen, setScheduleSettingsAreOpen] = useState(false);
  const [integrateSettingsAreOpen, setIntegrateSettingsAreOpen] = useState(false);
  const [params, setParams] = useState<string[]>([]);

  const handleSettingsAndIntegrate = (fileName: string, params: string[]) => {
    if (params.length === 0) {
      setIntegrateSettingsAreOpen(true);
      setFileName(fileName);
    } else {
      setParams(params);
      setIntegrateSettingsAreOpen(true);
      setFileName(fileName);
    }
  }

  const handleSettingsAndRun = (fileName: string, params: string[]) => {
    if (params.length === 0) {
      setRunSettingsAreOpen(true);
      setFileName(fileName);
    } else {
      setParams(params);
      setRunSettingsAreOpen(true);
      setFileName(fileName);
    }
  }

  const handleSettingsAndSchedule = (fileName: string, params: string[]) => {
    if (params.length === 0) {
      setScheduleSettingsAreOpen(true);
      setFileName(fileName);
    } else {
      setParams(params);
      setScheduleSettingsAreOpen(true);
      setFileName(fileName);
    }
  }

  const handleClose = () => {
    setParams([]);
    setRunSettingsAreOpen(false);
    setFileName('');
  }

  const handleIntegrateClose = () => {
    setParams([]);
    setIntegrateSettingsAreOpen(false);
    setFileName('');
  }

  const handleScheduleClose = () => {
    setParams([]);
    setScheduleSettingsAreOpen(false);
    setFileName('');
  }

  return (
    <React.Fragment>
      <RunSettingsModal isOpen={runSettingsAreOpen}
        handleClose={handleClose}
        handleStart={(settings) => handleRunRecording(settings)}
        isTask={params.length !== 0}
        params={params}
      />
      <ScheduleSettingsModal isOpen={scheduleSettingsAreOpen}
        handleClose={handleScheduleClose}
        handleStart={(settings) => handleScheduleRecording(settings)}
      />
      <IntegrationSettingsModal isOpen={integrateSettingsAreOpen}
        handleClose={handleIntegrateClose}
        isTask={params.length !== 0}
        params={params}
        handleStart={(settings) => handleIntegrateRecording(settings)}
      />
      <Grid container direction="column" sx={{ padding: '30px' }}>
        <Grid item xs>
          <RecordingsTable
            handleEditRecording={handleEditRecording}
            handleRunRecording={handleSettingsAndRun}
            handleScheduleRecording={handleSettingsAndSchedule}
            handleIntegrateRecording={handleSettingsAndIntegrate}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
