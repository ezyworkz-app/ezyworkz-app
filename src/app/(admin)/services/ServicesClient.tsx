"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import apiClient from "@/lib/api/client";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import ShopServices from "@/components/services/ShopServices";

export default function ServicesClient({ 
    initialServices, 
    initialGlobalServices, 
    error: initialError 
}: { 
    initialServices: any[]; 
    initialGlobalServices: any[]; 
    error?: string;
}) {
    const { selectedShopId, isLoading: shopLoading } = useShop();
    
    // Default to the initial data if it matches the current shop
    const [services, setServices] = useState<any[]>(initialServices || []);
    const [globalServices, setGlobalServices] = useState<any[]>(initialGlobalServices || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(initialError || "");

    const fetchData = async () => {
        if (!selectedShopId) return;
        try {
            setLoading(true);
            setError("");
            const [shopSvcRes, globalSvcRes, globalCatRes] = await Promise.all([
                apiClient.get(`/public/shop/json/${selectedShopId}`),
                apiClient.get(`/global/services`),
                apiClient.get(`/global/categories`)
            ]);
            const shopData = shopSvcRes.data.data || shopSvcRes.data || {};
            const globalSvcs = globalSvcRes.data.data || globalSvcRes.data || [];
            const globalCats = globalCatRes.data.data || globalCatRes.data || [];
            
            const mappedServices = (shopData.services || []).map((s: any) => ({
                ...s,
                name: s.name || globalSvcs.find((g: any) => g.globalServiceId === s.globalServiceId)?.name || "Unnamed Service",
                categories: (s.categories || []).map((c: any) => {
                    const fallbackName = globalCats.find((g: any) => g.globalCategoryId === c.globalCategoryId)?.name;
                    return {
                        ...c,
                        name: c.name || fallbackName || "Unnamed Category"
                    };
                })
            }));
            
            setServices(mappedServices);
            setGlobalServices(globalSvcs);
        } catch (err: any) {
            setError(err.message || "Failed to load services");
        } finally {
            setLoading(false);
        }
    };

    // Refetch data only if the shop changes from the initial one
    useEffect(() => {
        if (!shopLoading && !selectedShopId) {
            setError("No shop found. Please contact support.");
        } else if (!shopLoading && selectedShopId) {
            // We could check if we need to refetch based on selectedShopId changing
            // But since this is SSR, the initial load already has data for the user's primary shop.
            // We only refetch if they explicitly change the shop in the dropdown.
            if (services.length === 0 && !initialError) {
                fetchData();
            }
        }
    }, [selectedShopId, shopLoading]);

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8 h-screen overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-8 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Services Configuration</h1>
                        <p className="text-gray-500 mt-1">Manage your shop's services, delivery multipliers, and item prices.</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm font-medium text-red-400">{error}</div>
                    </div>
                )}

                {loading || shopLoading ? (
                    <div className="flex justify-center items-center flex-1 bg-white rounded-3xl border border-gray-200">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                    </div>
                ) : (
                    <div className="flex-1 bg-white rounded-3xl border border-gray-200 overflow-hidden">
                        <ShopServices 
                            services={services} 
                            globalServices={globalServices} 
                            shopId={selectedShopId!} 
                            onRefresh={fetchData} 
                        />
                    </div>
                )}
            </main>
        </ProtectedRoute>
    );
}
