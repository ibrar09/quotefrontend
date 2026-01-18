import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ requiredPermission }) => {
    const { user, loading, hasPermission } = useAuth();

    if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Auth...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold bg-white dark:bg-gray-900">Access Denied: Insufficient Permissions</div>;
    }

    return <Outlet />;
};

export default ProtectedRoute;
