import { useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useGlobalInfoStore } from "../context/globalInfo";

interface UserRouteProps {
    children: ReactNode;
}

const UserRoute: React.FC<UserRouteProps> = ({ children }) => {
    const [ok, setOk] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();
    const { notify } = useGlobalInfoStore();

    useEffect(() => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const fetchUser = async () => {
            try {
                const { data } = await axios.get('http://localhost:8080/auth/current-user', {
                    signal: controller.signal
                });
                if (data.ok) {
                    setOk(true);
                } else {
                    handleRedirect('User session expired. Please login again.');
                }
            } catch (err: any) {
                if (axios.isCancel(err)) {
                    console.log('Request canceled:', err.message);
                    handleRedirect('Request timed out. Please try again.');
                } else {
                    handleRedirect(err.response?.data?.error || 'An error occurred. Please login again.');
                }
            } finally {
                setLoading(false);
                clearTimeout(timeoutId);
            }
        };

        fetchUser();

        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, []);

    const handleRedirect = (errorMessage: string) => {
        setOk(false);
        setLoading(false);
        notify('error', errorMessage);
        navigate('/login');
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return ok ? <>{children}</> : null;
};

export default UserRoute;

