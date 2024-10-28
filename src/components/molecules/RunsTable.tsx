import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { useEffect, useState } from "react";
import { useGlobalInfoStore } from "../../context/globalInfo";
import { getStoredRuns } from "../../api/storage";
import { RunSettings } from "./RunSettings";
import { CollapsibleRow } from "./ColapsibleRow";
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface Column {
  id: 'runStatus' | 'name' | 'startedAt' | 'finishedAt' | 'runId' | 'delete' | 'runBy' | 'settings';
  label: string;
  minWidth?: number;
  align?: 'right';
  format?: (value: string) => string;
}

export const columns: readonly Column[] = [
  { id: 'runStatus', label: 'Status', minWidth: 80 },
  { id: 'name', label: 'Robot Name', minWidth: 80 },
  { id: 'startedAt', label: 'Started at', minWidth: 80 },
  { id: 'finishedAt', label: 'Finished at', minWidth: 80 },
  { id: 'runBy', label: 'Run By', minWidth: 80,},
  { id: 'runId', label: 'Run ID', minWidth: 80 },
  // { id: 'task', label: 'Task', minWidth: 80 },
  { id: 'settings', label: 'Settings', minWidth: 80 },
  { id: 'delete', label: 'Delete', minWidth: 80 },
];

export interface Data {
  id: number;
  status: string;
  name: string;
  startedAt: string;
  finishedAt: string;
  runByUserId?: string;
  runByScheduleId?: string;
  runByAPI?: boolean;
  // task: string;
  log: string;
  runId: string;
  interpreterSettings: RunSettings;
  serializableOutput: any;
  binaryOutput: any;
}

interface RunsTableProps {
  currentInterpretationLog: string;
  abortRunHandler: () => void;
  runId: string;
  runningRecordingName: string;
}

export const RunsTable = (
  { currentInterpretationLog, abortRunHandler, runId, runningRecordingName }: RunsTableProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState<Data[]>([]);

  console.log(`rows runs: ${JSON.stringify(rows)}`);

  const { notify, rerenderRuns, setRerenderRuns } = useGlobalInfoStore();

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const fetchRuns = async () => {
    const runs = await getStoredRuns();
    if (runs) {
      const parsedRows: Data[] = [];
      runs.map((run: any, index) => {
        parsedRows.push({
          id: index,
          ...run,
        });
      });
      setRows(parsedRows);
    } else {
      notify('error', 'No runs found. Please try again.')
    }
  };

  useEffect(() => {
    if (rows.length === 0 || rerenderRuns) {
      fetchRuns();
      setRerenderRuns(false);
    }
  }, [rerenderRuns]);

  const handleDelete = () => {
    setRows([]);
    notify('success', 'Run deleted successfully');
    fetchRuns();
  };

  // Group runs by recording name
  const groupedRows = rows.reduce((acc, row) => {
    if (!acc[row.name]) {
      acc[row.name] = [];
    }
    acc[row.name].push(row);
    return acc;
  }, {} as Record<string, Data[]>);

  return (
    <React.Fragment>
      <Typography variant="h6" gutterBottom>
        All Runs
      </Typography>
      <TableContainer component={Paper} sx={{ width: '100%', overflow: 'hidden' }}>
        {Object.entries(groupedRows).map(([name, group]) => (
          <Accordion key={name}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{name}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell />
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
                  {group.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                    <CollapsibleRow
                      row={row}
                      handleDelete={handleDelete}
                      key={`row-${row.id}`}
                      isOpen={runId === row.runId && runningRecordingName === row.name}
                      currentLog={currentInterpretationLog}
                      abortRunHandler={abortRunHandler}
                      runningRecordingName={runningRecordingName}
                    />
                  ))}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        ))}
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </React.Fragment>
  );
};
