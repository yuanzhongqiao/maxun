import React, { useState } from 'react';
import { GenericModal } from "../atoms/GenericModal";
import { MenuItem, TextField, Typography } from "@mui/material";
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

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={handleClose}
      modalStyle={modalStyle}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginLeft: '65px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <Typography>Run once every</Typography>
          <TextField
            type="number"
            value={settings.runEvery}
            onChange={(e) => handleChange('runEvery', parseInt(e.target.value))}
            style={{ width: '60px', margin: '0 10px' }}
          />
          <Dropdown
            label="unit"
            id="runEveryUnit"
            value={settings.runEveryUnit}
            handleSelect={(e) => handleChange('runEveryUnit', e.target.value)}
          >
            <MenuItem value="minutes">minutes</MenuItem>
            <MenuItem value="hours">hours</MenuItem>
            <MenuItem value="days">days</MenuItem>
            <MenuItem value="weeks">weeks</MenuItem>
            <MenuItem value="months">months</MenuItem>
          </Dropdown>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <Typography>Start from</Typography>
          <Dropdown
            label="start from"
            id="startFrom"
            value={settings.startFrom}
            handleSelect={(e) => handleChange('startFrom', e.target.value)}
          >
            <MenuItem value="Monday">Monday</MenuItem>
            <MenuItem value="Tuesday">Tuesday</MenuItem>
            <MenuItem value="Wednesday">Wednesday</MenuItem>
            <MenuItem value="Thursday">Thursday</MenuItem>
            <MenuItem value="Friday">Friday</MenuItem>
            <MenuItem value="Saturday">Saturday</MenuItem>
            <MenuItem value="Sunday">Sunday</MenuItem>
          </Dropdown>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <Typography>At around</Typography>
          <TextField
            type="time"
            value={settings.atTime}
            onChange={(e) => handleChange('atTime', e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <Typography>Timezone</Typography>
          <Dropdown
            label="timezone"
            id="timezone"
            value={settings.timezone}
            handleSelect={(e) => handleChange('timezone', e.target.value)}
          >
            <MenuItem value="UTC">UTC</MenuItem>
            <MenuItem value="America/New_York">America/New_York</MenuItem>
            <MenuItem value="Europe/London">Europe/London</MenuItem>
            <MenuItem value="Asia/Tokyo">Asia/Tokyo</MenuItem>
            <MenuItem value="Asia/Kolkata">Asia/Kolkata</MenuItem>
            {/* Add more timezone options as needed */}
          </Dropdown>
        </div>

        <Button onClick={() => handleStart(settings)}>Start</Button>
      </div>
    </GenericModal>
  );
}

export default ScheduleSettingsModal;