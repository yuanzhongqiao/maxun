import { Layout, Menu } from "antd";
import { Link } from "react-router-dom";

const { Sider } = Layout;

const Sidebar = () => {
    return (
        <Sider
            className="h-screen bg-white text-gray-800 fixed top-16 left-0 flex flex-col justify-between"
            width={250}
        >
            <div className="flex flex-col justify-between h-full">
                <Menu mode="vertical">
                    <Menu.Item key="1">
                        <Link to="/bots">Bots</Link>
                    </Menu.Item>
                    <Menu.Item key="2">
                        <Link to="/subscription">Subscription</Link>
                    </Menu.Item>
                    <Menu.Item key="3">
                        <Link to="/api">API</Link>
                    </Menu.Item>
                    <Menu.Item key="4">
                        <Link to="/workflow">Workflow</Link>
                    </Menu.Item>
                </Menu>
                <div className="flex items-center py-4 px-6">
                    <img src="your_logo.png" alt="Maxun logo" className="h-8 w-auto mr-4" />
                    <span className="text-xl font-bold">Maxun</span>
                </div>
            </div>
        </Sider>
    );
};

export default Sidebar;