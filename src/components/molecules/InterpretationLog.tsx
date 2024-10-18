import * as React from 'react';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { Button, TextField } from '@mui/material';
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

interface InterpretationLogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const InterpretationLog: React.FC<InterpretationLogProps> = ({ isOpen, setIsOpen }) => {
  const [log, setLog] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string>('10');
  const [customValue, setCustomValue] = useState('');
  const [tableData, setTableData] = useState<any[]>([]);

  const logEndRef = useRef<HTMLDivElement | null>(null);

  const { width } = useBrowserDimensionsStore();
  const { socket } = useSocketStore();

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

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };

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

  return (
    <div>
      <button
        onClick={toggleDrawer(true)}
        style={{
          color: 'white',
          position: 'fixed',
          background: '#870468',
          border: 'none',
          padding: '30px 20px',
          width: '100%',
          textAlign: 'left',
          bottom: 0,
        }}>
        Interpretation Log
      </button>
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
            display: 'flex'
          }
        }}
      >
        <Typography variant="h6" gutterBottom>
          <StorageIcon /> Output Data Preview
        </Typography>
        <div style={{
          height: '50vh',
          overflow: 'none',
          padding: '10px',
        }}>
          {/* <Highlight className="javascript">
            {log}
          </Highlight> */}
          {tableData.length > 0 && (
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
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '200px' }}>
            <FormControl>
              <FormLabel>
                <h4>What is the maximum number of rows you want to extract?</h4>
              </FormLabel>
              <RadioGroup row value={selectedOption} onChange={handleRadioChange} sx={{ width: '500px' }}>
                <FormControlLabel value="10" control={<Radio />} label="10" />
                <FormControlLabel value="100" control={<Radio />} label="100" />
                <FormControlLabel value="custom" control={<Radio />} label="Custom" />
                {selectedOption === 'custom' && (
                  <TextField
                    type="number"
                    value={customValue}
                    onChange={handleCustomValueChange}
                    placeholder="Enter number"
                    sx={{
                      marginLeft: '10px',
                      marginTop: '-3px',
                      '& input': {
                        padding: '10px',
                      },
                    }}
                  />
                )}
              </RadioGroup>
            </FormControl>
            <div style={{ paddingBottom: '40px' }}>
              <h4>How can we find the next item?</h4>
              <p>Select and review the pagination setting this webpage is using</p>
              <Button variant="outlined">
                Select Pagination Setting
              </Button>
            </div>
          </div>
          <div style={{ float: "left", clear: "both" }}
            ref={logEndRef} />
        </div>
      </SwipeableDrawer>
    </div>
  );
}