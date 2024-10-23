import React, { useState, useEffect } from 'react';
import { GenericModal } from "../atoms/GenericModal";
import { MenuItem, TextField, Typography, Box, Switch, FormControlLabel } from "@mui/material";
import { Dropdown } from "../atoms/DropdownMui";
import Button from "@mui/material/Button";
import { modalStyle } from "./AddWhereCondModal";
import { validMomentTimezones } from '../../constants/const';
import { useGlobalInfoStore } from '../../context/globalInfo';
import { getSchedule, deleteSchedule, getStoredRecording } from '../../api/storage';
import { WorkflowFile, Where, What, WhereWhatPair } from 'maxun-core';

interface RobotMeta {
    name: string;
    id: string;
    createdAt: string;
    pairs: number;
    updatedAt: string;
    params: any[];
}

interface RobotWorkflow {
    workflow: WhereWhatPair[];
}

interface ScheduleConfig {
    runEvery: number;
    runEveryUnit: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
    startFrom: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
    atTimeStart?: string;
    atTimeEnd?: string;
    timezone: string;
    lastRunAt?: Date;
    nextRunAt?: Date;
    cronExpression?: string;
}

export interface RobotSettings {
    id: string;
    userId?: number;
    recording_meta: RobotMeta;
    recording: RobotWorkflow;
    google_sheet_email?: string | null;
    google_sheet_name?: string | null;
    google_sheet_id?: string | null;
    google_access_token?: string | null;
    google_refresh_token?: string | null;
    schedule?: ScheduleConfig | null;
}

interface RobotSettingsProps {
    isOpen: boolean;
    handleStart: (settings: RobotSettings) => void;
    handleClose: () => void;
    initialSettings?: RobotSettings | null;

}

export const RobotSettingsModal = ({ isOpen, handleStart, handleClose, initialSettings }: RobotSettingsProps) => {
    const [robot, setRobot] = useState<RobotSettings | null>(null);
    const { recordingId, notify } = useGlobalInfoStore();

    useEffect(() => {
        if (isOpen) {
            getRobot();
        }
    }, [isOpen]);

    const getRobot = async () => {
        if (recordingId) {
            const robot = await getStoredRecording(recordingId);
            setRobot(robot);
        } else {
            notify('error', 'Could not find robot details. Please try again.');
        }
    }

    return (
        <GenericModal
            isOpen={isOpen}
            onClose={handleClose}
            modalStyle={modalStyle}
        >
            <>
                <Typography variant="h5" style={{ marginBottom: '20px' }}>Robot Settings</Typography>
                <Box style={{ display: 'flex', flexDirection: 'column' }}>
                    {
                        robot && (
                            <>
                                <TextField
                                    label="Robot Target URL"
                                    value={robot.recording.workflow[0].where.url}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                    style={{ marginBottom: '20px' }}
                                />
                                <TextField
                                    label="Robot ID"
                                    value={robot.recording_meta.id}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                    style={{ marginBottom: '20px' }}
                                />
                                <TextField
                                    label="Robot Created At"
                                    value={robot.recording_meta.createdAt}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                    style={{ marginBottom: '20px' }}
                                />
                            </>
                        )
                    }
                </Box>
            </>
        </GenericModal>
    );
};
