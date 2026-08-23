"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import apiClient, { STORAGE_KEYS, setupAxiosInterceptors } from '@/lib/api/client';
import { LoginCredentials } from '@/types';

interface AuthContextType {
    isAuthenticated: boolean;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
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

    const handleLogout = useCallback(() => {
        setIsAuthenticated(false);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            document.cookie = "accessToken=; path=/; max-age=0;";
            document.cookie = "id=; path=/; max-age=0;";
        }
        router.push('/login');
    }, [router]);

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

    const login = useCallback(async (credentials: any) => {
        const response = await apiClient.post('/shop-auth/login', credentials);
        if (response.data?.token) {
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
                // Also set it in a cookie for Server Actions
                document.cookie = `accessToken=${response.data.token}; path=/; max-age=604800; samesite=lax`;
                if (response.data.shopOwner?.shopOwnerId) {
                    document.cookie = `id=${response.data.shopOwner.shopOwnerId}; path=/; max-age=604800; samesite=lax`;
                }
            }
            setIsAuthenticated(true);
            router.push('/');
        } else {
            throw new Error('No token received');
        }
    }, [router]);

    // Memoize context value to prevent unnecessary re-renders of all consumers
    const value = useMemo(() => ({
        isAuthenticated,
        loading,
        login,
        logout: handleLogout
    }), [isAuthenticated, loading, login, handleLogout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
