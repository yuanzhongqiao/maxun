import React, { useState } from 'react';
import { GenericModal } from "../atoms/GenericModal";
import { MenuItem, TextField, Typography, Box } from "@mui/material";
import { Dropdown } from "../atoms/DropdownMui";
import Button from "@mui/material/Button";
import { modalStyle } from "./AddWhereCondModal";
import { validMomentTimezones } from '../../constants/const';

interface ScheduleSettingsProps {
  isOpen: boolean;
  handleStart: (settings: ScheduleSettings) => void;
  handleClose: () => void;
}

export interface ScheduleSettings {
  runEvery: number;
  runEveryUnit: string;
  startFrom: string;
  atTime: string;
  timezone: string;
}

export const ScheduleSettingsModal = ({ isOpen, handleStart, handleClose }: ScheduleSettingsProps) => {
  const [settings, setSettings] = useState<ScheduleSettings>({
    runEvery: 1,
    runEveryUnit: 'HOURS',
    startFrom: 'MONDAY',
    atTime: '00:00',
    timezone: 'UTC'
  });

  const handleChange = (field: keyof ScheduleSettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  console.log(`Settings:`, settings);

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
    'HOURS',
    'DAYS',
    'WEEKS',
    'MONTHS'
  ]

  const days = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
  ]

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
          <Typography sx={{ marginBottom: '5px', marginRight: '25px' }}>Start from / On</Typography>
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

        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Box sx={{ marginRight: '20px' }}>
            <Typography sx={{ marginBottom: '5px' }}>At around</Typography>
            <TextField
              type="time"
              value={settings.atTime}
              onChange={(e) => handleChange('atTime', e.target.value)}
              sx={textStyle}
            />
          </Box>
          <Box>
            <Typography sx={{ marginBottom: '5px' }}>Timezone</Typography>
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
        </Box>

        <Button
          variant="contained"
          onClick={() => handleStart(settings)}
        >
          Save
        </Button>
      </Box>
    </GenericModal>
  );
}

export default ScheduleSettingsModal;