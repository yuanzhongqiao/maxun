import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import { Button, ConfigProvider, Space } from 'antd';
import { BrowserRouter } from 'react-router-dom'

const App = () => (
  <BrowserRouter>
    <Topbar />
    <Sidebar />
  </BrowserRouter>
);

export default App;