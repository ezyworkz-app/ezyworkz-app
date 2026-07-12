"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import apiClient from '@/lib/api/client';
import { useAuth } from './AuthContext';

interface ShopContextType {
    selectedShopId: string | null;
    selectedShop: any | null;
    isLoading: boolean;
    refreshShop: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType>({
    selectedShopId: null,
    selectedShop: null,
    isLoading: true,
    refreshShop: async () => {},
});

export const ShopProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, loading: isAuthLoading } = useAuth();
    const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
    const [selectedShop, setSelectedShop] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadShops = useCallback(async () => {
        if (!isAuthenticated) {
            setSelectedShopId(null);
            setSelectedShop(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiClient.get('/shops/my-shops');
            if (response.data && response.data.length > 0) {
                setSelectedShopId(response.data[0].shopId);
                setSelectedShop(response.data[0]);
            }
        } catch (error) {
            console.error("Failed to load shops", error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthLoading) return; // Wait for auth init
        loadShops();
    }, [isAuthenticated, isAuthLoading, loadShops]);

    // Allow consumers to force a re-fetch (e.g. after saving shop details)
    const refreshShop = useCallback(async () => {
        await loadShops();
    }, [loadShops]);



    return (
        <ShopContext.Provider value={{ selectedShopId, selectedShop, isLoading, refreshShop }}>
            {children}
        </ShopContext.Provider>
    );
};

export const useShop = () => useContext(ShopContext);
