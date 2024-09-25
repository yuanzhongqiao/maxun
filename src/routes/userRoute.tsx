import { useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useGlobalInfoStore } from "../context/globalInfo";

interface UserRouteProps {
    children: ReactNode;
}

const UserRoute: React.FC<UserRouteProps> = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [ok, setOk] = useState<boolean>(false);
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
        } finally {
            setLoading(false);  // Remove loading state regardless of success or failure
        }
    };

    const handleRedirect = (errorMessage?: string) => {
        setOk(false);
        if (errorMessage) {
            notify('error', errorMessage);
        } else {
            notify('error', 'Please login again to continue');
        }
        navigate('/login');
    };

    // Block rendering if loading the authentication status
    if (loading) return null;

    return <>{ok ? children : null}</>;
};

export default UserRoute;
