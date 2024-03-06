import { Layout, Menu, Col, Row } from "antd";
import { Link } from "react-router-dom"; 

const { Sider } = Layout;

const Sidebar = () => {
  return (
    <Sider
      className="h-screen bg-gray-800 text-white fixed top-0 left-0 flex flex-col justify-between"
      width={250} 
    >
      <div className="flex items-center py-4 px-6">
        {/* Add logo image here */}
        <img src="your_logo.png" alt="Your company logo" className="h-8 w-auto mr-4" />
        <span className="text-xl font-bold">App Name</span>
      </div>
      <Menu mode="vertical" theme="dark">
        <Menu.Item key="1">
          <Link to="/dashboard">Dashboard</Link>
        </Menu.Item>
        <Menu.Item key="2">
          <Link to="/settings">Settings</Link>
        </Menu.Item>
        <Menu.Item key="3">
          <Link to="/users">Users</Link>
        </Menu.Item>
        <Menu.Item key="4">
          <Link to="/profile">Profile</Link>
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default Sidebar;
