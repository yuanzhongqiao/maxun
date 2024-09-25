import { useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useGlobalInfoStore } from "../context/globalInfo";

interface UserRouteProps {
    children: ReactNode;
}

const UserRoute: React.FC<UserRouteProps> = ({ children }) => {
    const [ok, setOk] = useState<boolean>(true); // Default to true to allow rendering while fetching
    const navigate = useNavigate();
    const { notify } = useGlobalInfoStore();

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const { data } = await axios.get('http://localhost:8080/auth/current-user');
            if (data.ok) {
                setOk(true);
            } else {
                handleRedirect();
            }
        } catch (err: any) {
            handleRedirect(err.response?.data?.error || 'An error occurred. Please login again.');
        }
    };

    const handleRedirect = (errorMessage?: string) => {
        setOk(false);
        if (errorMessage) {
            notify('error', errorMessage);
        }
        navigate('/login');
    };

    // If ok is true, render the children (protected route)
    return <>{ok ? children : null}</>;
};

export default UserRoute;

