import React, { useState, useContext } from 'react';
import axios from 'axios';
import styled from "styled-components";
import { stopRecording } from "../../api/recording";
import { useGlobalInfoStore } from "../../context/globalInfo";
import { IconButton } from "@mui/material";
import { RecordingIcon } from "../atoms/RecorderIcon";
import { SaveRecording } from "./SaveRecording";
import { Logout, Clear } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth';

interface NavBarProps {
  recordingName: string;
  isRecording: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({ recordingName, isRecording }) => {

  const { notify, browserId, setBrowserId, recordingUrl } = useGlobalInfoStore();
  const { state, dispatch } = useContext(AuthContext);
  const { user } = state;

  console.log(`Recording URL: ${recordingUrl}`)

  const navigate = useNavigate();

  const logout = async () => {
    dispatch({ type: 'LOGOUT' });
    window.localStorage.removeItem('user');
    const { data } = await axios.get('http://localhost:8080/auth/logout');
    notify('success', data.message);
    navigate('/login');
  };

  // If recording is in progress, the resources and change page view by setting browserId to null
  // else it won't affect the page
  const goToMainMenu = async () => {
    if (browserId) {
      await stopRecording(browserId);
      notify('warning', 'Current Recording was terminated');
      setBrowserId(null);
    }
    navigate('/');
  };

  return (
    <NavBarWrapper>
      <div style={{
        display: 'flex',
        justifyContent: 'flex-start',
      }}>
        <img src="../../../public/img/maxunlogo.png" width={45} height={40} style={{ borderRadius: '5px', margin: '5px 0px 5px 5px' }} />
        <div style={{ padding: '11px' }}><ProjectName>Maxun</ProjectName></div>
      </div>
      {
        user !== null ? (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              {
                !isRecording ? (
                  <>
                    <IconButton sx={{
                      width: '140px',
                      border: '1px solid #ff00c3',
                      borderRadius: '5px',
                      padding: '8px',
                      background: 'white',
                      color: '#ff00c3',
                      marginRight: '10px',
                      fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                      fontWeight: '500',
                      fontSize: '0.875rem',
                      lineHeight: '1.75',
                      letterSpacing: '0.02857em',
                      '&:hover': { backgroundColor: 'white', color: '#ff00c3' }
                    }} onClick={logout}>
                      <Logout sx={{ marginRight: '5px' }} />
                      Logout</IconButton>
                  </>
                ) :
                  <>
                    <IconButton sx={{
                      width: '140px',
                      borderRadius: '5px',
                      padding: '8px',
                      background: 'red',
                      color: 'white',
                      marginRight: '10px',
                      fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                      fontWeight: '500',
                      fontSize: '0.875rem',
                      lineHeight: '1.75',
                      letterSpacing: '0.02857em',
                      '&:hover': { color: 'white', backgroundColor: 'red' }
                    }} onClick={goToMainMenu}>
                      <Clear sx={{ marginRight: '5px' }} />
                      Discard</IconButton>
                    <SaveRecording fileName={recordingName} />
                  </>
              }
            </div>
          </>
        ) : ""
      }

    </NavBarWrapper>
  );
};

const NavBarWrapper = styled.div`
  grid-area: navbar;
  background-color: white;
  padding:5px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #e0e0e0;
`;

const ProjectName = styled.b`
  color: #3f4853;
  font-size: 1.3em;
`;
