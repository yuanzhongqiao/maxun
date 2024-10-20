import * as React from 'react';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { Button, TextField, Grid } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Highlight from 'react-highlight';
import { useCallback, useEffect, useRef, useState } from "react";
import { useSocketStore } from "../../context/socket";
import { useBrowserDimensionsStore } from "../../context/browserDimensions";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import StorageIcon from '@mui/icons-material/Storage';
import { SidePanelHeader } from './SidePanelHeader';
import { useGlobalInfoStore } from '../../context/globalInfo';

interface InterpretationLogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const InterpretationLog: React.FC<InterpretationLogProps> = ({ isOpen, setIsOpen }) => {
  const [log, setLog] = useState<string>('');
  const [customValue, setCustomValue] = useState('');
  const [tableData, setTableData] = useState<any[]>([]);

  const logEndRef = useRef<HTMLDivElement | null>(null);

  const { width } = useBrowserDimensionsStore();
  const { socket } = useSocketStore();
  const { currentWorkflowActionsState } = useGlobalInfoStore();

  const toggleDrawer = (newOpen: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setIsOpen(newOpen);
  };

  const scrollLogToBottom = () => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLog = useCallback((msg: string, date: boolean = true) => {
    if (!date) {
      setLog((prevState) => prevState + '\n' + msg);
    } else {
      setLog((prevState) => prevState + '\n' + `[${new Date().toLocaleString()}] ` + msg);
    }
    scrollLogToBottom();
  }, [log, scrollLogToBottom]);

  const handleSerializableCallback = useCallback((data: any) => {
    setLog((prevState) =>
      prevState + '\n' + '---------- Serializable output data received ----------' + '\n'
      + JSON.stringify(data, null, 2) + '\n' + '--------------------------------------------------');

    // Set table data
    if (Array.isArray(data)) {
      setTableData(data);
    }

    scrollLogToBottom();
  }, [log, scrollLogToBottom]);

  const handleBinaryCallback = useCallback(({ data, mimetype }: any) => {
    setLog((prevState) =>
      prevState + '\n' + '---------- Binary output data received ----------' + '\n'
      + `mimetype: ${mimetype}` + '\n' + `data: ${JSON.stringify(data)}` + '\n'
      + '------------------------------------------------');
    scrollLogToBottom();
  }, [log, scrollLogToBottom]);

  const handleCustomValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(event.target.value);
  };

  useEffect(() => {
    socket?.on('log', handleLog);
    socket?.on('serializableCallback', handleSerializableCallback);
    socket?.on('binaryCallback', handleBinaryCallback);
    return () => {
      socket?.off('log', handleLog);
      socket?.off('serializableCallback', handleSerializableCallback);
      socket?.off('binaryCallback', handleBinaryCallback);
    };
  }, [socket, handleLog, handleSerializableCallback, handleBinaryCallback]);

  // Extract columns dynamically from the first item of tableData
  const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];

  const { hasScrapeListAction, hasScreenshotAction, hasScrapeSchemaAction } = currentWorkflowActionsState

  useEffect(() => {
    if (hasScrapeListAction || hasScrapeSchemaAction || hasScreenshotAction) {
      setIsOpen(true);
    }
  }, [hasScrapeListAction, hasScrapeSchemaAction, hasScreenshotAction, setIsOpen]);

  return (
      <Grid container>
        <Grid item xs={12} md={9} lg={9}>
          <Button
            onClick={toggleDrawer(true)}
            variant="contained"
            color="primary"
            sx={{
              color: 'white',
              position: 'absolute',
              background: '#ff00c3',
              border: 'none',
              padding: '10px 20px',
              width: 'calc(100% - 25%)',
              bottom: 0,
              overflow: 'hidden',
              textAlign: 'left',
              justifyContent: 'flex-start',
              '&:hover': {
                backgroundColor: '#ff00c3',
              },
            }}
          >
            Output Data Preview
          </Button>
          <SwipeableDrawer
            anchor="bottom"
            open={isOpen}
            onClose={toggleDrawer(false)}
            onOpen={toggleDrawer(true)}
            PaperProps={{
              sx: {
                background: 'white',
                color: 'black',
                padding: '10px',
                height: 500,
                width: width - 10,
                display: 'flex',
              },
            }}
          >
            <Typography variant="h6" gutterBottom>
              <StorageIcon /> Output Data Preview
            </Typography>
            <div
              style={{
                height: '50vh',
                overflow: 'none',
                padding: '10px',
              }}
            >
              {tableData.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} stickyHeader aria-label="output data table">
                    <TableHead>
                      <TableRow>
                        {columns.map((column) => (
                          <TableCell key={column}>{column}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tableData.map((row, index) => (
                        <TableRow key={index}>
                          {columns.map((column) => (
                            <TableCell key={column}>{row[column]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Grid container justifyContent="center" alignItems="center" style={{ height: '100%' }}>
                  <Grid item>
                    {hasScrapeListAction || hasScrapeSchemaAction || hasScreenshotAction ? (
                      <>
                        <Typography variant="h6" gutterBottom align="left">
                          You've successfully trained the robot to perform actions! Click on the button below to get a preview of the data your robot will extract.
                        </Typography>
                        <SidePanelHeader />
                      </>
                    ) : (
                      <Typography variant="h6" gutterBottom align="left">
                        It looks like you have not selected anything for extraction yet. Once you do, the robot will show a preview of your selections here.
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              )}
              <div style={{ float: 'left', clear: 'both' }} ref={logEndRef} />
            </div>
          </SwipeableDrawer>
        </Grid>
      </Grid>
    );
}