import { Layout, Menu } from "antd";
import { Link } from "react-router-dom";

const { Sider } = Layout;

const Sidebar = () => {
    return (
        <Sider
            className="h-screen bg-white text-gray-800 fixed top-16 left-0 flex flex-col justify-between shadow-xl"
            width={250}
        >
            <div className="flex flex-col justify-between h-full mt-32">
                <Menu mode="vertical">
                    <Menu.Item key="1">
                        <Link to="/bots">Bots</Link>
                    </Menu.Item>
                    <Menu.Item key="2">
                        <Link to="/workflow">Workflow</Link>
                    </Menu.Item>
                    <Menu.Item key="3">
                        <Link to="/analytics">Analytics</Link>
                    </Menu.Item>
                    <Menu.Item key="4">
                        <Link to="/api">API</Link>
                    </Menu.Item>
                </Menu>
            </div>
        </Sider>
    );
};

export default Sidebar;