import { Layout, Menu, Col } from "antd";
import { Link } from "react-router-dom"; 

const { Header } = Layout;

const Topbar = () => {
  return (
    <Header className="flex justify-between items-center h-16 bg-white shadow-md">
      <Col span={4} className="flex items-center">
        <Link to="/">
          <img src="maxun_logo.png" alt="Maxun" className="h-8 w-auto" />
        </Link>
      </Col>
      <Col span={16} className="hidden lg:flex justify-end">
        <Menu mode="horizontal">
          <Menu.Item key="1">
            <Link to="/link1">Link 1</Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to="/link2">Link 2</Link>
          </Menu.Item>
          <Menu.Item key="3">
            <Link to="/link3">Link 3</Link>
          </Menu.Item>
        </Menu>
      </Col>
      <Col span={4} className="lg:hidden flex justify-end">
        {/* Add a hamburger icon for mobile menu  */}
        <button className="text-gray-600 focus:outline-none">
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
    </Header>
  );
};

export default Topbar;