"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import apiClient from "@/lib/api/client";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import ShopServices from "@/components/services/ShopServices";

export default function ServicesPage() {
    const { selectedShopId, isLoading: shopLoading } = useShop();
    const [services, setServices] = useState<any[]>([]);
    const [globalServices, setGlobalServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                    console.log("MAPPING CAT:", c.shopServiceCategoryId, "orig:", c.name, "fallback:", fallbackName);
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

    useEffect(() => {
        if (!shopLoading && selectedShopId) {
            fetchData();
        } else if (!shopLoading && !selectedShopId) {
            setLoading(false);
            setError("No shop found. Please contact support.");
        }
    }, [selectedShopId, shopLoading]);

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8 h-screen overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-8 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Services Configuration</h1>
                        <p className="text-slate-400 mt-1">Manage your shop's services, delivery multipliers, and item prices.</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm font-medium text-red-400">{error}</div>
                    </div>
                )}

                {loading || shopLoading ? (
                    <div className="flex justify-center items-center flex-1 bg-[#0e1424] rounded-3xl border border-card-border">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                    </div>
                ) : (
                    <div className="flex-1 bg-[#0e1424] rounded-3xl border border-card-border overflow-hidden">
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
