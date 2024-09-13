import React, { useState } from 'react';
import { RecordingsTable } from "../molecules/RecordingsTable";
import { Grid } from "@mui/material";
import { RunSettings, RunSettingsModal } from "../molecules/RunSettings";
import { ScheduleSettings, ScheduleSettingsModal } from "../molecules/ScheduleSettings";

interface RecordingsProps {
  handleEditRecording: (fileName: string) => void;
  handleRunRecording: (settings: RunSettings) => void;
  handleScheduleRecording: (settings: ScheduleSettings) => void;
  setFileName: (fileName: string) => void;
}

export const Recordings = ({ handleEditRecording, handleRunRecording, setFileName, handleScheduleRecording }: RecordingsProps) => {
  const [runSettingsAreOpen, setRunSettingsAreOpen] = useState(false);
  const [scheduleSettingsAreOpen, setScheduleSettingsAreOpen] = useState(false);
  const [params, setParams] = useState<string[]>([]);

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
      <Grid container direction="column" sx={{ padding: '30px' }}>
        <Grid item xs>
          <RecordingsTable
            handleEditRecording={handleEditRecording}
            handleRunRecording={handleSettingsAndRun}
            handleScheduleRecording={handleSettingsAndSchedule}
          />
        </Grid>
      </Grid>
    </React.Fragment>
  );
}
