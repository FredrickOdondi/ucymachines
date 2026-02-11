import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const { theme } = useTheme();

    if (loading) {
        return (
            <div className={'min-h-screen flex items-center justify-center ' + (theme === 'dark' ? 'bg-surface/DEFAULT' : 'bg-gray-100')}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
