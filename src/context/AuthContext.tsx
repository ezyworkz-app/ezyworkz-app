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
            document.cookie = "accessToken=; path=/; max-age=0;";
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
                    // Ensure cookie is set for server actions even on reload
                    if (!document.cookie.includes('accessToken=')) {
                        document.cookie = `accessToken=${token}; path=/; max-age=604800; samesite=lax`;
                    }
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
                // Also set it in a cookie for Server Actions
                document.cookie = `accessToken=${response.data.token}; path=/; max-age=604800; samesite=lax`;
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
