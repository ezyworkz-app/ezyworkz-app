"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useShop } from "@/context/ShopContext";
import apiClient from "@/lib/api/client";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ShopMenuClient from "@/components/shop/ShopMenuClient";
import ShopCardShop from "@/components/shop/ShopCardShop";
import FloatingCartBar from "@/components/order/FloatingCartBar";
import { fetchShopFullMenu } from "@/lib/actions/shops";

export default function OrderMenuEditPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;
    
    const { selectedShopId, isLoading: shopLoading } = useShop();
    const [order, setOrder] = useState<any>(null);
    const [shop, setShop] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!shopLoading && selectedShopId && orderId) {
            fetchData();
        } else if (!shopLoading && !selectedShopId) {
            setLoading(false);
            setError("No shop selected.");
        }
    }, [selectedShopId, shopLoading, orderId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");
            
            // Fetch order, shop list, and full menu
            const [orderRes, shopsRes, fullMenuRes] = await Promise.all([
                apiClient.get(`/shops/${selectedShopId}/orders/${orderId}`),
                apiClient.get(`/shops/my-shops`),
                fetchShopFullMenu(selectedShopId!)
            ]);
            
            const currentShop = shopsRes.data?.find((s: any) => s.shopId === selectedShopId) || shopsRes.data?.[0];

            if (!orderRes.data || !currentShop) {
                throw new Error("Could not load required data. Please ensure the order exists and you have access.");
            }

            setOrder(orderRes.data.order || orderRes.data);
            setShop(currentShop);
            setServices(fullMenuRes?.services || []);
        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data?.message || err?.message || "Failed to load shop menu for this order.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex-1 p-2 sm:p-4">
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => router.back()}
                    className="p-2 bg-white dark:bg-[#151b2b] text-gray-700 dark:text-teal-500 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-gray-200 dark:border-white/5"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Edit Order Items
                        <span className="text-slate-500 text-sm font-normal">#{orderId.split('-')[0]}</span>
                    </h1>
                </div>
            </div>

            {error && (
                <div className="text-red-500 mb-4">{error}</div>
            )}

            {loading || shopLoading ? (
                <div className="flex justify-center items-center p-24 bg-white dark:bg-[#0e1424] rounded-3xl border border-gray-200 dark:border-card-border">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                </div>
            ) : order && shop ? (
                <div className="relative pb-24 bg-white dark:bg-[#151b2b] rounded-3xl border border-gray-200 dark:border-none p-4">
                    <ShopCardShop shop={shop} />
                    <ShopMenuClient shop={shop} services={services} />
                    <FloatingCartBar />
                </div>
            ) : null}
        </main>
    );
}
