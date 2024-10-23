import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { Paper } from "@mui/material";

interface MainMenuProps {
  value: string;
  handleChangeContent: (newValue: string) => void;
}

export const MainMenu = ({ value = 'recordings', handleChangeContent }: MainMenuProps) => {

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    handleChangeContent(newValue);
  };

  return (
    <Paper
      sx={{
        height: 'auto',
        width: '250px',
        backgroundColor: 'white',
        paddingTop: '2rem',
      }}
      variant="outlined"
      square
    >
      <Box sx={{
        width: '100%',
        paddingBottom: '22rem',
      }}>
        <Tabs
          value={value}
          onChange={handleChange}
          textColor="primary"
          indicatorColor="primary"
          orientation="vertical"
        >
          <Tab sx={{
            alignItems: 'baseline',
            fontSize: 'medium',
          }} value="recordings" label="Robots" />
          <Tab sx={{
            alignItems: 'baseline',
            fontSize: 'medium',
          }} value="runs" label="Runs" />
          <Tab sx={{
            alignItems: 'baseline',
            fontSize: 'medium',
          }} value="proxy" label="Proxy" />
          <Tab sx={{
            alignItems: 'baseline',
            fontSize: 'medium',
          }} value="apikey" label="API Key" />
        </Tabs>
      </Box>
    </Paper>
  );
}
