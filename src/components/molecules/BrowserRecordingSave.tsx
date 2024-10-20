import React from 'react'
import { Paper, Grid, IconButton, Button, Box } from '@mui/material';
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
                     marginTop: '10px',
                    //  marginLeft: '10px',
                     color: 'white',
                     position: 'absolute',
                     background: '#ff00c3',
                     border: 'none',
                     borderRadius: '5px',
                     padding: '7.5px',
                     width: 'calc(100% - 20px)',  // Ensure it takes full width but with padding
                     overflow: 'hidden',
                     display: 'flex',
                     justifyContent: 'space-between',
                }}>
                    <Button onClick={goToMainMenu} variant="outlined" sx={{ marginLeft: "25px" }} size="small" color="error">
                      Discard
                    </Button>
                    <SaveRecording fileName={recordingName} />
                </div>
            </Grid>
        </Grid>
    );
}

export default BrowserRecordingSave