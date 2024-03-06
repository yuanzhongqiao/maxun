import { useState } from "react";
import { Layout, Menu, Col, Drawer } from "antd";
import { Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";

const { Header } = Layout;

const Topbar = () => {
  const [visible, setVisible] = useState(false);

  const showDrawer = () => setVisible(true);
  const hideDrawer = () => setVisible(false);

  return (
    <Header className="flex justify-between items-center h-16 bg-white shadow-xl">
      <Col span={4} className="flex items-center">
        <Link to="/">
          <img src="maxun_logo.png" alt="Maxun" className="h-8 w-auto" />
        </Link>
      </Col>
      <Col span={16} className="hidden lg:flex justify-end">
        <Menu mode="horizontal">
          <Menu.Item key="1">
            <Link to="/dashboard">Dashboard</Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to="/credits">Credits</Link>
          </Menu.Item>
          <Menu.Item key="3">
            <Link to="/profile">Profile</Link>
          </Menu.Item>
        </Menu>
      </Col>
      <Col span={4} className="lg:hidden flex justify-end">
        <FaBars className="text-2xl text-gray-600" />
        <button className="text-gray-600 focus:outline-none" onClick={showDrawer}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
          </svg>
        </button>
      </Col>
      <Drawer
        title="Navigation"
        placement="right"
        closable={false}
        onClose={hideDrawer}
        open={visible}
        getContainer={() => document.body} // Ensure the drawer covers viewport on mobile
      >
        <Menu mode="vertical">
          <Menu.Item key="1">
            <Link to="/dashboard" onClick={hideDrawer}>
              Dashboard
            </Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to="/credits" onClick={hideDrawer}>Credits</Link>
          </Menu.Item>
          <Menu.Item key="3">
            <Link to="/profile" onClick={hideDrawer}>Profile</Link>
          </Menu.Item>
        </Menu>
      </Drawer>
    </Header>
  );
};

export default Topbar;