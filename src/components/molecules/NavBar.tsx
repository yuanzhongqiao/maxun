import React, { useState, useContext } from 'react';
import axios from 'axios';
import styled from "styled-components";
import { stopRecording } from "../../api/recording";
import { useGlobalInfoStore } from "../../context/globalInfo";
import { Button, IconButton } from "@mui/material";
import { RecordingIcon } from "../atoms/RecorderIcon";
import { SaveRecording } from "./SaveRecording";
import { Circle } from "@mui/icons-material";
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/auth';

interface NavBarProps {
  newRecording: () => void;
  recordingName: string;
  isRecording: boolean;
}

export const NavBar = ({ newRecording, recordingName, isRecording }: NavBarProps) => {

  const { notify, browserId, setBrowserId, recordingLength } = useGlobalInfoStore();
  const { state, dispatch } = useContext(AuthContext);
  const { user } = state;
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

  const handleNewRecording = async () => {
    if (browserId) {
      setBrowserId(null);
      await stopRecording(browserId);
    }
    newRecording();
    notify('info', 'New Recording started');
  }

  return (
    <NavBarWrapper>
      {
        user !== null ? (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
            }}>
              <RecordingIcon />
              <div style={{ padding: '11px' }}><ProjectName>Maxun</ProjectName></div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <IconButton
                aria-label="new"
                size={"small"}
                onClick={handleNewRecording}
                sx={{
                  width: isRecording ? '100px' : '130px',
                  borderRadius: '5px',
                  padding: '8px',
                  background: 'white',
                  color: 'rgba(255,0,0,0.7)',
                  marginRight: '10px',
                  fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  lineHeight: '1.75',
                  letterSpacing: '0.02857em',
                  '&:hover': { color: 'red', backgroundColor: 'white' }
                }
                }
              >
                <Circle sx={{ marginRight: '5px' }} /> {isRecording ? 'NEW' : 'RECORD'}
              </IconButton>
              {
                recordingLength > 0
                  ? <SaveRecording fileName={recordingName} />
                  : null
              }
              {isRecording ? <Button sx={{
                width: '100px',
                background: '#fff',
                color: 'rgba(25, 118, 210, 0.7)',
                padding: '9px',
                marginRight: '19px',
                '&:hover': {
                  background: 'white',
                  color: 'rgb(25, 118, 210)',
                }
              }} onClick={goToMainMenu}>
                <MeetingRoomIcon sx={{ marginRight: '5px' }} />
                exit</Button>
                : null}
              <Button sx={{
                width: '100px',
                background: '#fff',
                color: 'rgba(25, 118, 210, 0.7)',
                padding: '9px',
                marginRight: '19px',
                '&:hover': {
                  background: 'white',
                  color: 'rgb(25, 118, 210)',
                }
              }} onClick={logout}>
                <MeetingRoomIcon sx={{ marginRight: '5px' }} />
                logout</Button>
            </div>
          </>
        ) : ""
      }

    </NavBarWrapper>
  );
};

const NavBarWrapper = styled.div`
  grid-area: navbar;
  background-color: #3f4853;
  padding:5px;
  display: flex;
  justify-content: space-between;
`;

const ProjectName = styled.b`
  color: white;
  font-size: 1.3em;
`;
