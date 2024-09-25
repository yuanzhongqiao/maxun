import { useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useGlobalInfoStore } from "../context/globalInfo";

interface UserRouteProps {
    children: ReactNode;
}

const UserRoute: React.FC<UserRouteProps> = ({ children }) => {
    const [ok, setOk] = useState<boolean | null>(null);  // Use null to indicate loading state
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
                setOk(false);
                notify('error', data.error || 'Please login again to continue');
                navigate('/login');
            }
        } catch (err: any) {
            setOk(false);
            notify('error', err.response?.data?.error || 'An error occurred. Please login again.');
            navigate('/login');
        }
    };

    // Loading state
    if (ok === null) {
        return <p>Loading...</p>;
    }

    // Render children if authenticated
    return <>{ok ? children : null}</>;
};

export default UserRoute;
