import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/auth';

const UserRoute = () => {
    const { state } = useContext(AuthContext);

    return state.user ? <Outlet /> : <Navigate to="/login" />;
};

export default UserRoute;
