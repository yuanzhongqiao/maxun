import { useState } from 'react';
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import WebPreview from "./components/WebPreview";
import { ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom'

const App = () => (
  const [html, setHtml] = useState(null);
  const [elements, setElements] = useState([])

  <ConfigProvider
    theme={{
      token: {
        colorPrimary: '#ff00c3',
        borderRadius: 2,
      },
    }}
  >
    <BrowserRouter>
      <Topbar />
      {/* <Sidebar />  */}
      <WebPreview />
    </BrowserRouter>
  </ConfigProvider>
);

export default App;