import React, { useState } from 'react';
import { GenericModal } from "../atoms/GenericModal";
import { MenuItem, TextField, Typography, Box } from "@mui/material";
import { Dropdown } from "../atoms/DropdownMui";
import Button from "@mui/material/Button";
import { modalStyle } from "./AddWhereCondModal";

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
    runEveryUnit: 'hours',
    startFrom: 'Monday',
    atTime: '00:00',
    timezone: 'UTC'
  });

  const handleChange = (field: keyof ScheduleSettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const textStyle = {
    width: '150px',
    height: '50px',
    marginRight: '10px',
  };

  const dropDownStyle = {
    marginTop: '2px',
    width: '150px',
    height: '59px',
    marginRight: '10px',
  };

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
        <Typography variant="h6">Schedule Settings</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography sx={{ marginRight: '10px' }}>Run once every</Typography>
          <TextField
            type="number"
            value={settings.runEvery}
            onChange={(e) => handleChange('runEvery', parseInt(e.target.value))}
            sx={textStyle}
          />
          <Dropdown
            label=""
            id="runEveryUnit"
            value={settings.runEveryUnit}
            handleSelect={(e) => handleChange('runEveryUnit', e.target.value)}
            sx={dropDownStyle}
          >
            <MenuItem value="minutes">minutes</MenuItem>
            <MenuItem value="hours">hours</MenuItem>
            <MenuItem value="days">days</MenuItem>
            <MenuItem value="weeks">weeks</MenuItem>
            <MenuItem value="months">months</MenuItem>
          </Dropdown>
        </Box>

        <Box sx={{ width: '100%' }}>
          <Typography sx={{ marginBottom: '5px' }}>Start from</Typography>
          <Dropdown
            label=""
            id="startFrom"
            value={settings.startFrom}
            handleSelect={(e) => handleChange('startFrom', e.target.value)}
            sx={dropDownStyle}
          >
            <MenuItem value="Monday">Monday</MenuItem>
            <MenuItem value="Tuesday">Tuesday</MenuItem>
            <MenuItem value="Wednesday">Wednesday</MenuItem>
            <MenuItem value="Thursday">Thursday</MenuItem>
            <MenuItem value="Friday">Friday</MenuItem>
            <MenuItem value="Saturday">Saturday</MenuItem>
            <MenuItem value="Sunday">Sunday</MenuItem>
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
              <MenuItem value="UTC">UTC</MenuItem>
              <MenuItem value="America/New_York">America/New_York</MenuItem>
              <MenuItem value="Europe/London">Europe/London</MenuItem>
              <MenuItem value="Asia/Tokyo">Asia/Tokyo</MenuItem>
              <MenuItem value="Asia/Kolkata">Asia/Kolkata</MenuItem>
            </Dropdown>
          </Box>
        </Box>

        <Button
          variant="contained"
          onClick={() => handleStart(settings)}
          sx={{ ...textStyle, width: '100%' }}
        >
          Start
        </Button>
      </Box>
    </GenericModal>
  );
}

export default ScheduleSettingsModal;