import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { GlobalInfoProvider } from "./context/globalInfo";
import { PageWrapper } from "./pages/PageWrappper";

const theme = createTheme({
  palette: {
    primary: {
      main: "#ff00c3",
      contrastText: "#ffffff",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: "#ff66d9",
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          '&:hover': {
            color: "#ff00c3",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            color: "#ff66d9",
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalInfoProvider>
        <Routes>
          <Route path="/*" element={<PageWrapper />} />
        </Routes>
      </GlobalInfoProvider>
    </ThemeProvider>
  );
}

export default App;
