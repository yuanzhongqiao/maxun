import { useState } from 'react';
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import WebPreview from "./components/WebPreview";
import { ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom'

export default function App() {
  const [html, setHtml] = useState(null);
  const [elements, setElements] = useState([])

  return (
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
      <WebPreview html={html} setHtml={setHtml} elements={elements} />
    </BrowserRouter>
  </ConfigProvider>
  )

}