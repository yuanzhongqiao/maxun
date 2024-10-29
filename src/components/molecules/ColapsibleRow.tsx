import { useEffect, useRef, useState } from "react";
import * as React from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import { Box, Collapse, IconButton, Typography, Chip, TextField } from "@mui/material";
import { DeleteForever, KeyboardArrowDown, KeyboardArrowUp, Settings } from "@mui/icons-material";
import { deleteRunFromStorage } from "../../api/storage";
import { columns, Data } from "./RunsTable";
import { RunContent } from "./RunContent";
import { GenericModal } from "../atoms/GenericModal";
import { modalStyle } from "./AddWhereCondModal";
import { getUserById } from "../../api/auth";

interface RunTypeChipProps {
  runByUserId?: string;
  runByScheduledId?: string;
  runByAPI: boolean;
}

const RunTypeChip: React.FC<RunTypeChipProps> = ({ runByUserId, runByScheduledId, runByAPI }) => {
  if (runByUserId) return <Chip label="Manual Run" color="primary" variant="outlined" />;
  if (runByScheduledId) return <Chip label="Scheduled Run" color="primary" variant="outlined" />;
  if (runByAPI) return <Chip label="API" color="primary" variant="outlined" />;
  return <Chip label="Unknown Run Type" color="primary" variant="outlined" />;
};

interface CollapsibleRowProps {
  row: Data;
  handleDelete: () => void;
  isOpen: boolean;
  currentLog: string;
  abortRunHandler: () => void;
  runningRecordingName: string;
}
export const CollapsibleRow = ({ row, handleDelete, isOpen, currentLog, abortRunHandler, runningRecordingName }: CollapsibleRowProps) => {
  const [open, setOpen] = useState(isOpen);
  const [openSettingsModal, setOpenSettingsModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const runByLabel = row.runByUserId
    ? `${userEmail}`
    : row.runByScheduleId
      ? `${row.runByScheduleId}`
      : row.runByAPI
        ? 'API'
        : 'Unknown';

  const logEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToLogBottom = () => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }

  const handleAbort = () => {
    abortRunHandler();
  }

  useEffect(() => {
    scrollToLogBottom();
  }, [currentLog])

  useEffect(() => {
    const fetchUserEmail = async () => {
      if (row.runByUserId) {
        const userData = await getUserById(row.runByUserId);
        if (userData && userData.user) {
          setUserEmail(userData.user.email);
        }
      }
    };
    fetchUserEmail();
  }, [row.runByUserId]);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }} hover role="checkbox" tabIndex={-1} key={row.id}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => {
              setOpen(!open);
              scrollToLogBottom();
            }}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        {columns.map((column) => {
          // @ts-ignore
          const value: any = row[column.id];
          if (value !== undefined) {
            return (
              <TableCell key={column.id} align={column.align}>
                {value}
              </TableCell>
            );
          } else {
            switch (column.id) {
              case 'runStatus':
                return (
                  <TableCell key={column.id} align={column.align}>
                    {row.status === 'success' && <Chip label="Success" color="success" variant="outlined" />}
                    {row.status === 'running' && <Chip label="Running" color="warning" variant="outlined" />}
                    {row.status === 'scheduled' && <Chip label="Scheduled" variant="outlined" />}
                    {row.status === 'failed' && <Chip label="Failed" color="error" variant="outlined" />}
                  </TableCell>
                )
              case 'delete':
                return (
                  <TableCell key={column.id} align={column.align}>
                    <IconButton aria-label="add" size="small" onClick={() => {
                      deleteRunFromStorage(`${row.runId}`).then((result: boolean) => {
                        if (result) {
                          handleDelete();
                        }
                      })
                    }}>
                      <DeleteForever />
                    </IconButton>
                  </TableCell>
                );
              case 'settings':
                return (
                  <TableCell key={column.id} align={column.align}>
                    <IconButton aria-label="settings" size="small" onClick={() => setOpenSettingsModal(true)}>
                      <Settings />
                    </IconButton>
                    <GenericModal
                      isOpen={openSettingsModal}
                      onClose={() => setOpenSettingsModal(false)}
                      modalStyle={modalStyle}
                    >
                      <>
                        <Typography variant="h5" style={{ marginBottom: '20px' }}>Run Settings</Typography>
                        <Box style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          <TextField
                            label="Run ID"
                            value={row.runId}
                            InputProps={{ readOnly: true }}
                          />
                          <TextField
                            label={row.runByUserId ? "Run by User" : row.runByScheduleId ? "Run by Schedule ID" : "Run by API"}
                            value={runByLabel}
                            InputProps={{ readOnly: true }}
                          />
                          <Box style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Typography variant="body1">Run Type:</Typography>
                            <RunTypeChip runByUserId={row.runByUserId} runByScheduledId={row.runByScheduleId} runByAPI={row.runByAPI ?? false} />
                          </Box>
                        </Box>
                      </>
                    </GenericModal>
                  </TableCell>
                )
              default:
                return null;
            }
          }
        })}
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <RunContent row={row} abortRunHandler={handleAbort} currentLog={currentLog}
              logEndRef={logEndRef} interpretationInProgress={runningRecordingName === row.name} />
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}
