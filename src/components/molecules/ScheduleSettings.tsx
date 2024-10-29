import React, { useState, useEffect } from 'react';
import { GenericModal } from "../atoms/GenericModal";
import { MenuItem, TextField, Typography, Box } from "@mui/material";
import { Dropdown } from "../atoms/DropdownMui";
import Button from "@mui/material/Button";
import { validMomentTimezones } from '../../constants/const';
import { useGlobalInfoStore } from '../../context/globalInfo';
import { getSchedule, deleteSchedule } from '../../api/storage';

interface ScheduleSettingsProps {
  isOpen: boolean;
  handleStart: (settings: ScheduleSettings) => void;
  handleClose: () => void;
  initialSettings?: ScheduleSettings | null;
}

export interface ScheduleSettings {
  runEvery: number;
  runEveryUnit: string;
  startFrom: string;
  dayOfMonth?: string;
  atTimeStart?: string;
  atTimeEnd?: string;
  timezone: string;
}

export const ScheduleSettingsModal = ({ isOpen, handleStart, handleClose, initialSettings }: ScheduleSettingsProps) => {
  const [schedule, setSchedule] = useState<ScheduleSettings | null>(null);
  const [settings, setSettings] = useState<ScheduleSettings>({
    runEvery: 1,
    runEveryUnit: 'HOURS',
    startFrom: 'MONDAY',
    dayOfMonth: '1',
    atTimeStart: '00:00',
    atTimeEnd: '01:00',
    timezone: 'UTC'
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleChange = (field: keyof ScheduleSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const textStyle = {
    width: '150px',
    height: '52px',
    marginRight: '10px',
  };

  const dropDownStyle = {
    marginTop: '2px',
    width: '150px',
    height: '59px',
    marginRight: '10px',
  };

  const units = [
    'MINUTES',
    'HOURS',
    'DAYS',
    'WEEKS',
    'MONTHS'
  ];

  const days = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
  ];

  const { recordingId } = useGlobalInfoStore();

  const deleteRobotSchedule = () => {
    if (recordingId) {
      deleteSchedule(recordingId);
      setSchedule(null);
    } else {
      console.error('No recording id provided');
    }

    setSettings({
      runEvery: 1,
      runEveryUnit: 'HOURS',
      startFrom: 'MONDAY',
      dayOfMonth: '',
      atTimeStart: '00:00',
      atTimeEnd: '01:00',
      timezone: 'UTC'
    });
  };

  const getRobotSchedule = async () => {
    if (recordingId) {
      const scheduleData = await getSchedule(recordingId);
      setSchedule(scheduleData);
    } else {
      console.error('No recording id provided');
    }
  }

  useEffect(() => {
    if (isOpen) {
      const fetchSchedule = async () => {
        await getRobotSchedule();
      };
      fetchSchedule();
    }
  }, [isOpen]);

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={handleClose}
      modalStyle={modalStyle}
    >
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '20px',
        '& > *': { marginBottom: '20px' },
      }}>
        <Typography variant="h6" sx={{ marginBottom: '20px' }}>Schedule Settings</Typography>
        <>
          {schedule !== null ? (
            <>
              <Typography>Run every: {schedule.runEvery} {schedule.runEveryUnit.toLowerCase()}</Typography>
              <Typography>{['MONTHS', 'WEEKS'].includes(settings.runEveryUnit) ? "Start From" : "On"} {schedule.startFrom.charAt(0).toUpperCase() + schedule.startFrom.slice(1).toLowerCase()}</Typography>
              {schedule.runEveryUnit === 'MONTHS' && (
                <Typography>On day: {schedule.dayOfMonth}{['1', '21', '31'].includes(schedule.dayOfMonth || '') ? 'st' : ['2', '22'].includes(schedule.dayOfMonth || '') ? 'nd' : ['3', '23'].includes(schedule.dayOfMonth || '') ? 'rd' : 'th'} of the month</Typography>
              )}
              <Typography>At around: {schedule.atTimeStart}, {schedule.timezone} Timezone</Typography>
              <Box mt={2} display="flex" justifyContent="space-between">
                <Button
                  onClick={deleteRobotSchedule}
                  variant="outlined"
                  color="error"
                >
                  Delete Schedule
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography sx={{ marginRight: '10px' }}>Run once every</Typography>
                <TextField
                  type="number"
                  value={settings.runEvery}
                  onChange={(e) => handleChange('runEvery', parseInt(e.target.value))}
                  sx={textStyle}
                  inputProps={{ min: 1 }}
                />
                <Dropdown
                  label=""
                  id="runEveryUnit"
                  value={settings.runEveryUnit}
                  handleSelect={(e) => handleChange('runEveryUnit', e.target.value)}
                  sx={dropDownStyle}
                >
                  {units.map((unit) => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </Dropdown>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography sx={{ marginBottom: '5px', marginRight: '25px' }}>{['MONTHS', 'WEEKS'].includes(settings.runEveryUnit) ? "Start From" : "On"}</Typography>
                <Dropdown
                  label=""
                  id="startFrom"
                  value={settings.startFrom}
                  handleSelect={(e) => handleChange('startFrom', e.target.value)}
                  sx={dropDownStyle}
                >
                  {days.map((day) => (
                    <MenuItem key={day} value={day}>{day}</MenuItem>
                  ))}
                </Dropdown>
              </Box>

              {settings.runEveryUnit === 'MONTHS' && (
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography sx={{ marginBottom: '5px', marginRight: '25px' }}>On Day of the Month</Typography>
                  <TextField
                    type="number"
                    value={settings.dayOfMonth}
                    onChange={(e) => handleChange('dayOfMonth', e.target.value)}
                    sx={textStyle}
                    inputProps={{ min: 1, max: 31 }}
                  />
                </Box>
              )}

              {['MINUTES', 'HOURS'].includes(settings.runEveryUnit) ? (
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ marginRight: '20px' }}>
                    <Typography sx={{ marginBottom: '5px' }}>In Between</Typography>
                    <TextField
                      type="time"
                      value={settings.atTimeStart}
                      onChange={(e) => handleChange('atTimeStart', e.target.value)}
                      sx={textStyle}
                    />
                    <TextField
                      type="time"
                      value={settings.atTimeEnd}
                      onChange={(e) => handleChange('atTimeEnd', e.target.value)}
                      sx={textStyle}
                    />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography sx={{ marginBottom: '5px', marginRight: '10px' }}>At Around</Typography>
                  <TextField
                    type="time"
                    value={settings.atTimeStart}
                    onChange={(e) => handleChange('atTimeStart', e.target.value)}
                    sx={textStyle}
                  />
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography sx={{ marginRight: '10px' }}>Timezone</Typography>
                <Dropdown
                  label=""
                  id="timezone"
                  value={settings.timezone}
                  handleSelect={(e) => handleChange('timezone', e.target.value)}
                  sx={dropDownStyle}
                >
                  {validMomentTimezones.map((tz) => (
                    <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                  ))}
                </Dropdown>
              </Box>
              <Box mt={2} display="flex" justifyContent="flex-end">
                <Button onClick={() => handleStart(settings)} variant="contained" color="primary">
                  Save Schedule
                </Button>
                <Button onClick={handleClose} color="primary" variant="outlined" style={{ marginLeft: '10px' }}>
                  Cancel
                </Button>
              </Box>
            </>
          )}
        </>
      </Box>
    </GenericModal>
  );
};

const modalStyle = {
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '40%',
  backgroundColor: 'background.paper',
  p: 4,
  height: 'fit-content',
  display: 'block',
  padding: '20px',
};
