import * as React from 'react';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { Button } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Highlight from 'react-highlight';
import { useCallback, useEffect, useRef, useState } from "react";
import { useSocketStore } from "../../context/socket";
import { useBrowserDimensionsStore } from "../../context/browserDimensions";
import { useActionContext } from '../../context/browserActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import StorageIcon from '@mui/icons-material/Storage';

function createData(
  name: string,
  calories: number,
  fat: number,
  carbs: number,
  protein: number,
) {
  return { name, calories, fat, carbs, protein };
}

const rows = [
  createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
  createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
  createData('Eclair', 262, 16.0, 24, 6.0),
  createData('Cupcake', 305, 3.7, 67, 4.3),
  createData('Gingerbread', 356, 16.0, 49, 3.9),
];

export const InterpretationLog = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [log, setLog] = useState<string>('');

  const logEndRef = useRef<HTMLDivElement | null>(null);

  const { width } = useBrowserDimensionsStore();
  const { getList } = useActionContext();

  const toggleDrawer = (newOpen: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setOpen(newOpen);
  };

  const { socket } = useSocketStore();

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

  const handleSerializableCallback = useCallback((data: string) => {
    setLog((prevState) =>
      prevState + '\n' + '---------- Serializable output data received ----------' + '\n'
      + JSON.stringify(data, null, 2) + '\n' + '--------------------------------------------------');
    scrollLogToBottom();
  }, [log, scrollLogToBottom]);

  const handleBinaryCallback = useCallback(({ data, mimetype }: any) => {
    setLog((prevState) =>
      prevState + '\n' + '---------- Binary output data received ----------' + '\n'
      + `mimetype: ${mimetype}` + '\n' + `data: ${JSON.stringify(data)}` + '\n'
      + '------------------------------------------------');
    scrollLogToBottom();
  }, [log, scrollLogToBottom]);

  useEffect(() => {
    socket?.on('log', handleLog);
    socket?.on('serializableCallback', handleSerializableCallback);
    socket?.on('binaryCallback', handleBinaryCallback);
    return () => {
      socket?.off('log', handleLog);
      socket?.off('serializableCallback', handleSerializableCallback);
      socket?.off('binaryCallback', handleBinaryCallback);
    };
  }, [socket, handleLog]);

  return (
    <div>
      <button
        onClick={toggleDrawer(true)}
        style={{
          color: 'white',
          background: '#3f4853',
          border: 'none',
          padding: '10px 20px',
          width: 1280,
          textAlign: 'left'
        }}>
        Interpretation Log
      </button>
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        PaperProps={{
          sx: { background: '#19171c', color: 'white', padding: '10px', height: 720, width: width - 10, display: 'flex' }
        }}
      >
        <Typography variant="h6" gutterBottom>
          <StorageIcon /> Output Data Preview
        </Typography>
        <div style={{
          height: '50vh',
          overflow: 'none',
          padding: '10px',
          background: '#19171c',
        }}>
          <Highlight className="javascript">
            {log}
          </Highlight>
          {
            getList ? (
              <>
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} stickyHeader aria-label="simple table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Dessert (100g serving)</TableCell>
                        <TableCell align="right">Calories</TableCell>
                        <TableCell align="right">Fat&nbsp;(g)</TableCell>
                        <TableCell align="right">Carbs&nbsp;(g)</TableCell>
                        <TableCell align="right">Protein&nbsp;(g)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow
                          key={row.name}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row">
                            {row.name}
                          </TableCell>
                          <TableCell align="right">{row.calories}</TableCell>
                          <TableCell align="right">{row.fat}</TableCell>
                          <TableCell align="right">{row.carbs}</TableCell>
                          <TableCell align="right">{row.protein}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '200px' }}>
                  <FormControl>
                    <FormLabel>
                      <h4>What is the maximum number of rows you want to extract?</h4>
                    </FormLabel>
                    <RadioGroup row>
                      <FormControlLabel value="10" control={<Radio />} label="10" />
                      <FormControlLabel value="100" control={<Radio />} label="100" />
                      <FormControlLabel value="custom" control={<Radio />} label="Custom" />
                    </RadioGroup>
                  </FormControl>

                  <div>
                    <h4>How can we find the next item?</h4>
                    <p>Select and review the pagination setting this webpage is using</p>
                    <Button variant="outlined">
                      Select Pagination Setting
                    </Button>
                  </div>
                </div>
              </>
            ) : null
          }
          <div style={{ float: "left", clear: "both" }}
            ref={logEndRef} />
        </div>
      </SwipeableDrawer>
    </div>
  );
}
