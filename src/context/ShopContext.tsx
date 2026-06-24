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

    // Dynamically update document favicon when shop loads
    useEffect(() => {
        if (selectedShop?.faviconUrl) {
            let faviconUrl = selectedShop.faviconUrl;

            // S3 URLs are already absolute — use as-is
            // Legacy: relative /uploads/ paths need the API base prepended
            if (!faviconUrl.startsWith("http://") && !faviconUrl.startsWith("https://")) {
                if (faviconUrl.includes("/uploads/")) {
                    const relativePath = "/uploads/" + faviconUrl.split("/uploads/")[1];
                    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
                    faviconUrl = `${apiBase}${relativePath}`;
                }
            }

            // Remove ALL existing favicon/icon link elements to prevent conflicts
            const existingIcons = document.querySelectorAll("link[rel*='icon']");
            existingIcons.forEach(el => el.remove());

            // Create a fresh link element for the favicon
            const link = document.createElement('link');
            link.rel = 'icon';

            // Set the type based on the URL extension
            if (faviconUrl.includes('.ico')) {
                link.type = 'image/x-icon';
            } else if (faviconUrl.includes('.png')) {
                link.type = 'image/png';
            } else if (faviconUrl.includes('.svg')) {
                link.type = 'image/svg+xml';
            }

            // Add cache-busting to ensure browser loads the latest favicon
            const separator = faviconUrl.includes('?') ? '&' : '?';
            link.href = `${faviconUrl}${separator}v=${Date.now()}`;
            document.head.appendChild(link);
        }
    }, [selectedShop]);

    return (
        <ShopContext.Provider value={{ selectedShopId, selectedShop, isLoading, refreshShop }}>
            {children}
        </ShopContext.Provider>
    );
};

export const useShop = () => useContext(ShopContext);
