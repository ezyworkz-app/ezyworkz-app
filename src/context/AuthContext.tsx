"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient, { STORAGE_KEYS, setupAxiosInterceptors } from '@/lib/api/client';

interface AuthContextType {
    isAuthenticated: boolean;
    loading: boolean;
    login: (credentials: any) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    loading: true,
    login: async () => {},
    logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const handleLogout = () => {
        setIsAuthenticated(false);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
        }
        router.push('/login');
    };

    useEffect(() => {
        setupAxiosInterceptors(handleLogout);
        
        const initAuth = async () => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
                if (token) {
                    setIsAuthenticated(true);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (credentials: any) => {
        const response = await apiClient.post('/shop-auth/login', credentials);
        if (response.data?.token) {
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
            }
            setIsAuthenticated(true);
            router.push('/');
        } else {
            throw new Error('No token received');
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, loading, login, logout: handleLogout }}>
            {children}
        </AuthContext.Provider>
    );
};
