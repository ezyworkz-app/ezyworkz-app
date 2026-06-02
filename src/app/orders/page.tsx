"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import apiClient from "@/lib/api/client";
import { Receipt, Loader2, AlertCircle, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Order {
    orderId: string;
    customerName: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    grandTotalPaid: number;
    createdAt: string;
}

export default function OrdersPage() {
    const { selectedShopId, isLoading: shopLoading } = useShop();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!shopLoading && selectedShopId) {
            fetchOrders();
        } else if (!shopLoading && !selectedShopId) {
            setLoading(false);
            setError("No shop found. Please contact support.");
        }
    }, [selectedShopId, shopLoading]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/shops/${selectedShopId}/orders`);
            setOrders(response.data.orders || response.data || []);
        } catch (err: any) {
            setError(err.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
        }).format(d);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-teal-500/10 text-teal-400';
            case 'cancelled': return 'bg-red-500/10 text-red-400';
            case 'in_process': return 'bg-amber-500/10 text-amber-400';
            case 'ready_to_deliver': return 'bg-emerald-500/10 text-emerald-400';
            case 'out_for_delivery': return 'bg-violet-500/10 text-violet-400';
            default: return 'bg-blue-500/10 text-blue-400';
        }
    };

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Orders</h1>
                        <p className="text-slate-400 mt-1">View and manage customer orders.</p>
                    </div>
                    <Link
                        href="/orders/create"
                        className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Order
                    </Link>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm font-medium text-red-400">{error}</div>
                    </div>
                )}

                <div className="bg-[#0e1424] rounded-3xl border border-card-border shadow-sm overflow-hidden">
                    {loading || shopLoading ? (
                        <div className="flex justify-center items-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="flex justify-center mb-4">
                                <div className="bg-slate-800 p-4 rounded-full">
                                    <Receipt className="w-8 h-8 text-slate-400" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white">No orders yet</h3>
                            <p className="mt-2 text-slate-400 max-w-sm mx-auto">
                                When customers place orders, they will appear here. Click 'Create Order' to start one manually.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-card-border bg-[#0B0F19] text-slate-400 text-sm">
                                        <th className="p-4 font-medium">Order ID</th>
                                        <th className="p-4 font-medium">Date</th>
                                        <th className="p-4 font-medium">Customer</th>
                                        <th className="p-4 font-medium">Status</th>
                                        <th className="p-4 font-medium">Payment</th>
                                        <th className="p-4 font-medium text-right">Total</th>
                                        <th className="p-4 font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr 
                                            key={order.orderId} 
                                            className="border-b border-card-border hover:bg-white/5 transition-colors cursor-pointer group"
                                            onClick={() => router.push(`/orders/${order.orderId}`)}
                                        >
                                            <td className="p-4 text-slate-300 text-sm whitespace-nowrap font-mono">
                                                {order.orderId.split('-')[0] || order.orderId}
                                            </td>
                                            <td className="p-4 text-white text-sm whitespace-nowrap">
                                                {formatDate(order.createdAt)}
                                            </td>
                                            <td className="p-4 text-white text-sm font-medium">
                                                {order.customerName}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${getStatusColor(order.status)}`}>
                                                    {order.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-slate-300 uppercase">{order.paymentMethod}</div>
                                                <div className="text-xs text-slate-500 capitalize">{order.paymentStatus}</div>
                                            </td>
                                            <td className="p-4 text-white font-semibold text-right whitespace-nowrap">
                                                {formatCurrency(order.grandTotalPaid ?? order.totalAmount ?? 0)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-teal-400 transition-colors ml-auto" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </ProtectedRoute>
    );
}
