"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '@/lib/api/client';
import { useAuth } from './AuthContext';

interface ShopContextType {
    selectedShopId: string | null;
    isLoading: boolean;
}

const ShopContext = createContext<ShopContextType>({
    selectedShopId: null,
    isLoading: true,
});

export const ShopProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadShops = async () => {
            if (isAuthenticated) {
                try {
                    const response = await apiClient.get('/shops/my-shops');
                    if (response.data && response.data.length > 0) {
                        setSelectedShopId(response.data[0].shopId);
                    }
                } catch (error) {
                    console.error("Failed to load shops", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSelectedShopId(null);
                setIsLoading(false);
            }
        };

        loadShops();
    }, [isAuthenticated]);

    return (
        <ShopContext.Provider value={{ selectedShopId, isLoading }}>
            {children}
        </ShopContext.Provider>
    );
};

export const useShop = () => useContext(ShopContext);
