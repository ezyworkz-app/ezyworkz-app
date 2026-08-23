"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import apiClient from '@/lib/api/client';
import { useAuth } from './AuthContext';
import { Shop, ShopUser } from '@/types';

interface ShopContextType {
    selectedShopId: string | null;
    selectedShop: (Shop & { role?: ShopUser['role'] }) | null;
    userRole: "owner" | "manager" | "staff" | "user" | null;
    isLoading: boolean;
    refreshShop: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType>({
    selectedShopId: null,
    selectedShop: null,
    userRole: null,
    isLoading: true,
    refreshShop: async () => {},
});

export const ShopProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, loading: isAuthLoading } = useAuth();
    const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
    const [selectedShop, setSelectedShop] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const userRole = (selectedShop?.role as "owner" | "manager" | "staff" | "user") || "owner";

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

    // Memoize context value to prevent unnecessary re-renders of all consumers
    const value = useMemo(() => ({
        selectedShopId,
        selectedShop,
        userRole,
        isLoading,
        refreshShop
    }), [selectedShopId, selectedShop, userRole, isLoading, refreshShop]);

    return (
        <ShopContext.Provider value={value}>
            {children}
        </ShopContext.Provider>
    );
};

export const useShop = () => useContext(ShopContext);
