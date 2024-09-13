import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { GlobalInfoProvider } from "./context/globalInfo";
import { PageWrapper } from "./pages/PageWrappper";

function App() {
  return (
    <GlobalInfoProvider>
      <Routes>
        <Route path="/*" element={<PageWrapper />} />
      </Routes>
    </GlobalInfoProvider>
  );
}

export default App;
