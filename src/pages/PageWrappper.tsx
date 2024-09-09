import React, { useEffect, useState } from 'react';
import { NavBar } from "../components/molecules/NavBar";
import { SocketProvider } from "../context/socket";
import { BrowserDimensionsProvider } from "../context/browserDimensions";
import { RecordingPage } from "./RecordingPage";
import { MainPage } from "./MainPage";
import { useGlobalInfoStore } from "../context/globalInfo";
import { getActiveBrowserId } from "../api/recording";
import { AlertSnackbar } from "../components/atoms/AlertSnackbar";
import { Routes, Route, useNavigate } from 'react-router-dom';

export const PageWrapper = () => {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  const { browserId, setBrowserId, notification, recordingName, setRecordingName } = useGlobalInfoStore();

  const handleNewRecording = () => {
    setBrowserId('new-recording');
    setRecordingName('');
    navigate('/recording');

  }

  const handleEditRecording = (fileName: string) => {
    setRecordingName(fileName);
    setBrowserId('new-recording');
    navigate('/recording');

  }

  const isNotification = (): boolean => {
    if (notification.isOpen && !open) {
      setOpen(true);
    }
    return notification.isOpen;
  }

  useEffect(() => {
    const isRecordingInProgress = async () => {
      const id = await getActiveBrowserId();
      if (id) {
        setBrowserId(id);
        navigate('/recording');
      }
    }
    isRecordingInProgress();
  }, []);

  return (
    <div>
      <SocketProvider>
        <React.Fragment>
          <NavBar newRecording={handleNewRecording} recordingName={recordingName} isRecording={!!browserId} />
          <Routes>
            <Route
              path="/"
              element={<MainPage handleEditRecording={handleEditRecording} />}
            />
            <Route
              path="/recording"
              element={
                <BrowserDimensionsProvider>
                  <RecordingPage recordingName={recordingName} />
                </BrowserDimensionsProvider>
              }
            />
          </Routes>
        </React.Fragment>
      </SocketProvider>
      {isNotification() ?
        <AlertSnackbar severity={notification.severity}
          message={notification.message}
          isOpen={notification.isOpen} />
        : null
      }
    </div>
  );
}
