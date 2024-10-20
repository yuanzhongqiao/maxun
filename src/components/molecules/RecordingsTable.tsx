import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { useEffect } from "react";
import { WorkflowFile } from "maxun-core";
import { IconButton, Button, Box, Typography, TextField } from "@mui/material";
import { Schedule, DeleteForever, Edit, PlayCircle } from "@mui/icons-material";
import LinkIcon from '@mui/icons-material/Link';
import { useGlobalInfoStore } from "../../context/globalInfo";
import { deleteRecordingFromStorage, getStoredRecordings } from "../../api/storage";
import { Circle, Add, Logout, Clear } from "@mui/icons-material";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { stopRecording } from "../../api/recording";
import { GenericModal } from '../atoms/GenericModal';


/** TODO:
 *  1. allow editing existing robot after persisting browser steps
 *  2. show robot settings: id, url, etc. 
*/

interface Column {
  id: 'interpret' | 'name' | 'delete' | 'schedule' | 'integrate';
  label: string;
  minWidth?: number;
  align?: 'right';
  format?: (value: string) => string;
}

const columns: readonly Column[] = [
  { id: 'interpret', label: 'Run', minWidth: 80 },
  { id: 'name', label: 'Name', minWidth: 80 },
  // {
  //   id: 'createdAt',
  //   label: 'Created at',
  //   minWidth: 80,
  //   //format: (value: string) => value.toLocaleString('en-US'),
  // },
  // {
  //   id: 'edit',
  //   label: 'Edit',
  //   minWidth: 80,
  // },
  {
    id: 'schedule',
    label: 'Schedule',
    minWidth: 80,
  },
  {
    id: 'integrate',
    label: 'Integrate',
    minWidth: 80,
  },
  // {
  //   id: 'updatedAt',
  //   label: 'Updated at',
  //   minWidth: 80,
  //   //format: (value: string) => value.toLocaleString('en-US'),
  // },
  {
    id: 'delete',
    label: 'Delete',
    minWidth: 80,
  },
];

interface Data {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  content: WorkflowFile;
  params: string[];
}

interface RecordingsTableProps {
  handleEditRecording: (id: string, fileName: string) => void;
  handleRunRecording: (id: string, fileName: string, params: string[]) => void;
  handleScheduleRecording: (id: string, fileName: string, params: string[]) => void;
  handleIntegrateRecording: (id: string, fileName: string, params: string[]) => void;
}

export const RecordingsTable = ({ handleEditRecording, handleRunRecording, handleScheduleRecording, handleIntegrateRecording }: RecordingsTableProps) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [rows, setRows] = React.useState<Data[]>([]);
  const [isModalOpen, setModalOpen] = React.useState(false);

  const { notify, setRecordings, browserId, setBrowserId, recordingUrl, setRecordingUrl, recordingName, setRecordingName, recordingId, setRecordingId } = useGlobalInfoStore();
  const navigate = useNavigate();

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const fetchRecordings = async () => {
    const recordings = await getStoredRecordings();
    if (recordings) {
      const parsedRows: Data[] = [];
      recordings.map((recording: any, index: number) => {
        if (recording && recording.recording_meta) {
          parsedRows.push({
            id: index,
            ...recording.recording_meta,
            content: recording.recording
          });
        }
      });
      setRecordings(parsedRows.map((recording) => recording.name));
      setRows(parsedRows);
    } else {
      console.log('No recordings found.');
    }
  }

  const handleNewRecording = async () => {
    if (browserId) {
      setBrowserId(null);
      await stopRecording(browserId);
    }
    setModalOpen(true);
  };

  const handleStartRecording = () => {
    setBrowserId('new-recording');
    setRecordingName('');
    setRecordingId('');
    navigate('/recording');
  }

  const startRecording = () => {
    setModalOpen(false);
    handleStartRecording();
    notify('info', 'New Recording started for ' + recordingUrl);
  };

  useEffect(() => {
    if (rows.length === 0) {
      fetchRecordings();
    }
  }, []);

  return (
    <React.Fragment>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" gutterBottom>
          My Robots
        </Typography>
        <IconButton
          aria-label="new"
          size={"small"}
          onClick={handleNewRecording}
          sx={{
            width: '140px',
            borderRadius: '5px',
            padding: '8px',
            background: '#ff00c3',
            color: 'white',
            marginRight: '10px',
            fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
            fontWeight: '500',
            fontSize: '0.875rem',
            lineHeight: '1.75',
            letterSpacing: '0.02857em',
            '&:hover': { color: 'white', backgroundColor: '#ff00c3' }
          }
          }
        >
          <Add sx={{ marginRight: '5px' }} /> Create Robot
        </IconButton>
      </Box>
      <TableContainer component={Paper} sx={{ width: '100%', overflow: 'hidden', marginTop: '15px' }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length !== 0 ? rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
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
                          case 'interpret':
                            return (
                              <TableCell key={column.id} align={column.align}>
                                <InterpretButton handleInterpret={() => handleRunRecording(row.id, row.name, row.params || [])} />
                              </TableCell>
                            );
                          // case 'edit':
                          //   return (
                          //     <TableCell key={column.id} align={column.align}>
                          //       <IconButton aria-label="add" size="small" onClick={() => {
                          //         handleEditRecording(row.id, row.name);
                          //       }} sx={{ '&:hover': { color: '#1976d2', backgroundColor: 'transparent' } }}>
                          //         <Edit />
                          //       </IconButton>
                          //     </TableCell>
                          //   );
                          case 'schedule':
                            return (
                              <TableCell key={column.id} align={column.align}>
                                <ScheduleButton handleSchedule={() => handleScheduleRecording(row.id, row.name, row.params || [])} />
                              </TableCell>
                            );
                          case 'integrate':
                            return (
                              <TableCell key={column.id} align={column.align}>
                                <IntegrateButton handleIntegrate={() => handleIntegrateRecording(row.id, row.name, row.params || [])} />
                              </TableCell>
                            );
                          case 'delete':
                            return (
                              <TableCell key={column.id} align={column.align}>
                                <IconButton aria-label="add" size="small" onClick={() => {
                                  deleteRecordingFromStorage(row.id).then((result: boolean) => {
                                    if (result) {
                                      setRows([]);
                                      notify('success', 'Recording deleted successfully');
                                      fetchRecordings();
                                    }
                                  })
                                }}>
                                  <DeleteForever />
                                </IconButton>
                              </TableCell>
                            );
                          default:
                            return null;
                        }
                      }
                    })}
                  </TableRow>
                );
              })
              : null}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={rows ? rows.length : 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <GenericModal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <div style={{ padding: '20px' }}>
          <Typography variant="h6" gutterBottom>Enter URL To Extract Data</Typography>
          <TextField
            label="URL"
            variant="outlined"
            fullWidth
            value={recordingUrl}
            onChange={(e: any) => setRecordingUrl(e.target.value)}
            style={{ marginBottom: '20px', marginTop: '20px' }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={startRecording}
            disabled={!recordingUrl}
          >
            Start Training Robot
          </Button>
        </div>
      </GenericModal>
    </React.Fragment>
  );
}

interface InterpretButtonProps {
  handleInterpret: () => void;
}

const InterpretButton = ({ handleInterpret }: InterpretButtonProps) => {
  return (
    <IconButton aria-label="add" size="small" onClick={() => {
      handleInterpret();
    }}
    >
      <PlayCircle />
    </IconButton>
  )
}


interface ScheduleButtonProps {
  handleSchedule: () => void;
}

const ScheduleButton = ({ handleSchedule }: ScheduleButtonProps) => {
  return (
    <IconButton aria-label="add" size="small" onClick={() => {
      handleSchedule();
    }}
    >
      <Schedule />
    </IconButton>
  )
}

interface IntegrateButtonProps {
  handleIntegrate: () => void;
}

const IntegrateButton = ({ handleIntegrate }: IntegrateButtonProps) => {
  return (
    <IconButton aria-label="add" size="small" onClick={() => {
      handleIntegrate();
    }}
    >
      <LinkIcon />
    </IconButton>
  )
}
