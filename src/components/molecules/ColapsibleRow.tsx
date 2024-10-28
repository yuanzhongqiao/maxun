import { useEffect, useRef, useState } from "react";
import * as React from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import { Box, Collapse, IconButton, Typography, Chip } from "@mui/material";
import { DeleteForever, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { deleteRunFromStorage } from "../../api/storage";
import { columns, Data } from "./RunsTable";
import { RunContent } from "./RunContent";

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
              case 'robotStatus': 
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
              case 'runBy':
                return (
                  <TableCell key={column.id} align={column.align}>
                    {
                      row.runByUserId ? `User: ${row.runByUserId}` : row.runByScheduleId ? `Schedule ID: ${row.runByScheduleId}` : row.runByAPI ? 'API' : 'Unknown'
                    }
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
