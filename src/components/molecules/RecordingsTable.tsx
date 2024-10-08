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
import { IconButton } from "@mui/material";
import { Schedule, DeleteForever, Edit, PlayCircle } from "@mui/icons-material";
import LinkIcon from '@mui/icons-material/Link';
import { useGlobalInfoStore } from "../../context/globalInfo";
import { deleteRecordingFromStorage, getStoredRecordings } from "../../api/storage";

interface Column {
  id: 'interpret' | 'name' | 'createdAt' | 'edit' | 'update_date' | 'delete' | 'schedule' | 'integrate';
  label: string;
  minWidth?: number;
  align?: 'right';
  format?: (value: string) => string;
}

const columns: readonly Column[] = [
  { id: 'interpret', label: 'Run', minWidth: 80 },
  { id: 'name', label: 'Name', minWidth: 80 },
  {
    id: 'createdAt',
    label: 'Created at',
    minWidth: 80,
    //format: (value: string) => value.toLocaleString('en-US'),
  },
  {
    id: 'edit',
    label: 'Edit',
    minWidth: 80,
  },
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
  {
    id: 'update_date',
    label: 'Updated at',
    minWidth: 80,
    //format: (value: string) => value.toLocaleString('en-US'),
  },
  {
    id: 'delete',
    label: 'Delete',
    minWidth: 80,
  },
];

interface Data {
  id: number;
  name: string;
  createdAt: string;
  update_date: string;
  content: WorkflowFile;
  params: string[];
}

interface RecordingsTableProps {
  handleEditRecording: (fileName: string) => void;
  handleRunRecording: (fileName: string, params: string[]) => void;
  handleScheduleRecording: (fileName: string, params: string[]) => void;
  handleIntegrateRecording: (fileName: string, params: string[]) => void;
}

export const RecordingsTable = ({ handleEditRecording, handleRunRecording, handleScheduleRecording, handleIntegrateRecording }: RecordingsTableProps) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [rows, setRows] = React.useState<Data[]>([]);

  const { notify, setRecordings } = useGlobalInfoStore();

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
      recordings.map((recording, index) => {
        const parsedRecording = JSON.parse(recording);
        if (parsedRecording.recording_meta) {
          parsedRows.push({
            id: index,
            ...parsedRecording.recording_meta,
            content: parsedRecording.recording
          });
        }
      });
      setRecordings(parsedRows.map((recording) => recording.name));
      setRows(parsedRows);
    } else {
      console.log('No recordings found.');
    }
  }

  useEffect(() => {
    if (rows.length === 0) {
      fetchRecordings();
    }
  }, []);

  return (
    <React.Fragment>
      <TableContainer component={Paper} sx={{ width: '100%', overflow: 'hidden' }}>
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
                                <InterpretButton handleInterpret={() => handleRunRecording(row.name, row.params || [])} />
                              </TableCell>
                            );
                          case 'edit':
                            return (
                              <TableCell key={column.id} align={column.align}>
                                <IconButton aria-label="add" size="small" onClick={() => {
                                  handleEditRecording(row.name);
                                }} sx={{ '&:hover': { color: '#1976d2', backgroundColor: 'transparent' } }}>
                                  <Edit />
                                </IconButton>
                              </TableCell>
                            );
                          case 'schedule':
                            return (
                              <TableCell key={column.id} align={column.align}>
                                <ScheduleButton handleSchedule={() => handleScheduleRecording(row.name, row.params || [])} />
                              </TableCell>
                            );
                          case 'integrate':
                            return (
                              <TableCell key={column.id} align={column.align}>
                                <IntegrateButton handleIntegrate={() => handleIntegrateRecording(row.name, row.params || [])} />
                              </TableCell>
                            );
                          case 'delete':
                            return (
                              <TableCell key={column.id} align={column.align}>
                                <IconButton aria-label="add" size="small" onClick={() => {
                                  deleteRecordingFromStorage(row.name).then((result: boolean) => {
                                    if (result) {
                                      setRows([]);
                                      notify('success', 'Recording deleted successfully');
                                      fetchRecordings();
                                    }
                                  })
                                }} sx={{ '&:hover': { color: '#1976d2', backgroundColor: 'transparent' } }}>
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
      sx={{ '&:hover': { color: '#1976d2', backgroundColor: 'transparent' } }}>
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
      sx={{ '&:hover': { color: '#1976d2', backgroundColor: 'transparent' } }}>
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
      sx={{ '&:hover': { color: '#1976d2', backgroundColor: 'transparent' } }}>
      <LinkIcon />
    </IconButton>
  )
}
