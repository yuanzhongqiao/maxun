import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GlobalInfoProvider } from "./context/globalInfo";
import { PageWrapper } from "./pages/PageWrappper";

function App() {

  return (
    <BrowserRouter>
      <GlobalInfoProvider>
        <PageWrapper />
      </GlobalInfoProvider>
    </BrowserRouter>
  );
}

export default App;
