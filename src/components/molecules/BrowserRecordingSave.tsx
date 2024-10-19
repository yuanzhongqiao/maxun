import React from 'react'
import { Paper, Grid, IconButton, Button } from '@mui/material';
import { SaveRecording } from "./SaveRecording";
import { Circle, Add, Logout, Clear } from "@mui/icons-material";
import { useGlobalInfoStore } from '../../context/globalInfo';
import { stopRecording } from "../../api/recording";
import { Link, useLocation, useNavigate } from 'react-router-dom';


const BrowserRecordingSave = () => {
    const { recordingName, browserId, setBrowserId, notify } = useGlobalInfoStore();
    const navigate = useNavigate();

    const goToMainMenu = async () => {
        if (browserId) {
          await stopRecording(browserId);
          notify('warning', 'Current Recording was terminated');
          setBrowserId(null);
        }
        navigate('/');
      };

  return (
    <Grid container>
        <Grid item xs={12} md={3} lg={3}>
            <div style={{
                 marginLeft: '10px',
                 color: 'white',
                 position: 'fixed',
                 background: '#ff00c3',
                 border: 'none',
                 padding: '7.5px',
                 width: '100%',
                 bottom: 0,
                 overflow: 'hidden',
                 display: 'flex',
                 justifyContent: 'space-between',
            }}>
                <Button onClick={goToMainMenu} variant="outlined" sx={{ marginLeft: "20px" }} size="small">
                  Discard
                </Button>
                <SaveRecording fileName={recordingName} />
            </div>
    </Grid>
    </Grid>
  )
}

export default BrowserRecordingSave