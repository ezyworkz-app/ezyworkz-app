"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import apiClient from "@/lib/api/client";
import { Loader2, AlertCircle, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import OrderDetails from "@/components/orders/OrderDetails";

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;
    
    const { selectedShopId, isLoading: shopLoading } = useShop();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!shopLoading && selectedShopId && orderId) {
            fetchOrder();
        } else if (!shopLoading && !selectedShopId) {
            setLoading(false);
            setError("No shop found. Please contact support.");
        }
    }, [selectedShopId, shopLoading, orderId]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/shops/${selectedShopId}/orders/${orderId}`);
            setOrder(response.data.order || response.data);
            setError("");
        } catch (err: any) {
            setError(err.message || "Failed to load order");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async () => {
        if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
        
        try {
            await apiClient.delete(`/shops/${selectedShopId}/orders/${orderId}`);
            router.push('/orders');
        } catch (err: any) {
            setError(err.message || "Failed to delete order");
        }
    };

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/orders" 
                            className="p-2 bg-[#151b2b] text-teal-500 rounded-xl hover:bg-white/5 transition-colors border border-white/5"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                Order Details
                                <span className="text-slate-500 text-sm font-normal">#{orderId.split('-')[0]}</span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href={`/orders/${orderId}/edit`}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 rounded-xl transition-colors font-medium text-sm border border-teal-500/20"
                        >
                            Edit Order
                        </Link>
                        <button
                            onClick={handleDeleteOrder}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors font-medium text-sm border border-red-500/20"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Order
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm font-medium text-red-400">{error}</div>
                    </div>
                )}

                {loading || shopLoading ? (
                    <div className="flex justify-center items-center p-24 bg-[#0e1424] rounded-3xl border border-card-border">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                    </div>
                ) : order ? (
                    <OrderDetails order={order} shopId={selectedShopId!} onOrderUpdated={fetchOrder} />
                ) : null}
            </main>
        </ProtectedRoute>
    );
}
