import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing token on mount
        const token = localStorage.getItem('auth_token');
        console.log('AuthContext: Token found:', !!token);
        if (token) {
            // Verify token with backend
            fetch('http://127.0.0.1:8000/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    console.log('AuthContext: /auth/me response status:', res.status);
                    if (res.ok) {
                        return res.json();
                    } else {
                        throw new Error('Invalid token');
                    }
                })
                .then(data => {
                    console.log('AuthContext: User data:', data);
                    setUser(data);
                })
                .catch((err) => {
                    console.error('AuthContext: Token verification failed:', err);
                    localStorage.removeItem('auth_token');
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            console.log('AuthContext: No token found, setting loading to false');
            setLoading(false);
        }
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('auth_token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setUser(null);
    };

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
