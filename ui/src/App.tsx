import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import { Button, ConfigProvider, Space } from 'antd';
import { BrowserRouter } from 'react-router-dom'

const App = () => (
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: '#ff00c3',
        borderRadius: 2,
      },
    }}
  >
   
      <Button type="primary">Primary</Button>
      <Button>Default</Button>
    
  <BrowserRouter>
    <Topbar />
    <Sidebar />
  </BrowserRouter>
  </ConfigProvider>
);

export default App;