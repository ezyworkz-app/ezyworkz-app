"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import apiClient from "@/lib/api/client";
import { Receipt, Loader2, AlertCircle, Plus, ChevronRight, Trash2, Edit3, MapPin, Phone, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, Tab } from "@/components/ui/Tabs";

interface Order {
    orderId: string;
    customerName: string;
    customerPhoneNumber?: string;
    userId?: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    grandTotalPaid: number;
    totalAmount?: number;
    createdAt: string;
    services: any[];
    address?: {
        line1?: string;
        line2?: string;
        area?: string;
        city?: string;
        houseNo?: string;
    };
    orderSource?: string;
    multiplierLabel?: string;
}

const OrderServiceView = ({ services, title }: { services: any[], title: string }) => {
    const containerClass = "p-4 rounded-xl border-2 border-teal-500/20 bg-teal-50/20 shadow-sm";
    const titleClass = "text-teal-600/70";
    const totalTextClass = "text-teal-600";
    const borderClass = "border-teal-100";

    return (
        <div className="space-y-3">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center py-1 bg-gray-50 rounded-lg border border-gray-100">
                {title}
            </div>
            {(services ?? []).map((service, sIdx) => {
                const deliveryKey = service.selectedDeliveryKey || (service.deliveryType ? Object.keys(service.deliveryType)[0] : "standard");
                const deliveryType = deliveryKey.charAt(0).toUpperCase() + deliveryKey.slice(1);
                
                // Calculate item total using either itemTotal or totalPrice
                const itemTotalRaw = service.categories?.reduce((s: number, c: any) => s + c.items?.reduce((sum: number, i: any) => sum + (i.itemTotal || i.totalPrice || i.unitPrice * (i.qty || i.quantity) || 0), 0), 0) || 0;

                let deliveryBadgeClassName = "text-gray-500 bg-gray-100";
                if (deliveryKey === "oneDay") deliveryBadgeClassName = "bg-orange-500 text-white shadow-sm shadow-orange-500/20";
                if (deliveryKey === "express") deliveryBadgeClassName = "bg-red-500 text-white shadow-sm shadow-red-500/20";

                return (
                    <div key={sIdx} className={containerClass}>
                        <div className={`flex justify-between items-start mb-3 pb-2 border-b ${borderClass}`}>
                            <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-tight">{service.serviceName}</h4>
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${deliveryBadgeClassName}`}>
                                {deliveryType}
                            </div>
                        </div>
                        <ul className="space-y-3">
                            {service.categories?.map((cat: any, cIdx: number) => (
                                <li key={cIdx} className="space-y-1.5">
                                    <div className={`text-[9px] font-bold uppercase tracking-wider ${titleClass} mb-0.5 border-b ${borderClass} pb-0.5`}>
                                        {cat.categoryName}
                                    </div>
                                    <ul className="space-y-1.5">
                                        {cat.items?.map((item: any, iIdx: number) => (
                                            <li key={iIdx} className="text-[11px] flex flex-col text-gray-800">
                                                <div className="flex justify-between">
                                                    <span className="font-medium">{item.itemName} x{item.qty || item.quantity}</span>
                                                    <span className="font-bold text-gray-900">
                                                        ₹{(item.itemTotal || item.totalPrice || item.unitPrice * (item.qty || item.quantity) || 0).toFixed(2)}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                        <div className={`pt-2 mt-2 border-t ${borderClass} flex justify-between items-center`}>
                            <span className="text-[10px] font-bold uppercase text-teal-600">Total</span>
                            <span className={`text-sm font-black ${totalTextClass}`}>
                                ₹{itemTotalRaw.toFixed(2)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default function OrdersPage() {
    const { selectedShopId, isLoading: shopLoading } = useShop();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("all");

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
            setError("");
            const response = await apiClient.get(`/shops/${selectedShopId}/orders`);
            setOrders(response.data.orders || response.data || []);
        } catch (err: any) {
            setError(err.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async (orderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
        
        try {
            await apiClient.delete(`/shops/${selectedShopId}/orders/${orderId}`);
            fetchOrders();
        } catch (err: any) {
            alert(err.message || "Failed to delete order");
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "Never";
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }).format(d);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleCopy = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 2000);
    };

    const getStatusMessage = (order: Order) => {
        const orderId = order.orderId;
        const userName = order.customerName || "there";
        const status = order.status;
        
        let message = `Hello ${userName}, regarding your order ${orderId}...`;
        return `https://wa.me/91${order.customerPhoneNumber}?text=${encodeURIComponent(message)}`;
    };

    const statusTabs = [
        { id: 'all', label: 'All Orders' },
        { id: 'waiting_confirmation', label: 'Waiting Confirmation' },
        { id: 'confirmed', label: 'Confirmed' },
        { id: 'in_pickup', label: 'In Pickup' },
        { id: 'in_process', label: 'In Process' },
        { id: 'ready_to_deliver', label: 'Ready to Deliver' },
        { id: 'out_for_delivery', label: 'Out for Delivery' },
        { id: 'delivered', label: 'Delivered' },
        { id: 'cancelled', label: 'Cancelled' }
    ];

    const filteredOrders = activeTab === 'all' 
        ? orders 
        : orders.filter(order => order.status === activeTab);

    return (
        <ProtectedRoute>
            {/* Using light theme container matching the screenshot */}
            <main className="flex-1 p-8 bg-gray-50 min-h-screen text-gray-900">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                        <p className="text-gray-500 mt-1 font-medium">View and manage customer orders.</p>
                    </div>
                    <Link
                        href="/orders/create"
                        className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Order
                    </Link>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm font-bold text-red-600">{error}</div>
                    </div>
                )}

                <div className="bg-white px-6 py-4 rounded-3xl border border-gray-200 shadow-sm mb-6">
                    <div className="flex flex-col gap-6 w-full">
                        <Tabs
                            activeTab={statusTabs.findIndex(t => t.id === activeTab)}
                            onTabChange={(index) => setActiveTab(statusTabs[index].id)}
                        >
                            {statusTabs.map((tab) => {
                                const count = tab.id === 'all' 
                                    ? orders.length 
                                    : orders.filter(o => o.status === tab.id).length;

                                return (
                                    <Tab key={tab.id} title={tab.label} count={count}>
                                        {/* Content inside the tab goes here. 
                                            We wrap the table below instead.
                                            But since the Tabs component renders the active tab's children below it, 
                                            we can place the table here. 
                                        */}
                                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mt-6">
                                            {loading || shopLoading ? (
                                                <div className="flex justify-center items-center p-12">
                                                    <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                                                </div>
                                            ) : filteredOrders.length === 0 ? (
                                                <div className="text-center py-16 px-4">
                                                    <div className="flex justify-center mb-4">
                                                        <div className="bg-gray-50 p-4 rounded-full border border-gray-100">
                                                            <Receipt className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900">No orders yet</h3>
                                                    <p className="mt-2 text-gray-500 max-w-sm mx-auto font-medium">
                                                        When customers place orders, they will appear here. Click 'Create Order' to start one manually.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto pb-24">
                                                    <table className="w-full text-left border-collapse min-w-[1000px]">
                                                        <thead>
                                                            <tr className="border-b border-gray-200 bg-gray-50/50">
                                                                <th className="w-[12%] py-4 px-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Order ID & Date</th>
                                                                <th className="w-[15%] py-4 px-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Customer</th>
                                                                <th className="w-[25%] py-4 px-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Items & Details</th>
                                                                <th className="w-[12%] py-4 px-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Financials</th>
                                                                <th className="w-[15%] py-4 px-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Status Tracking</th>
                                                                <th className="w-[10%] py-4 px-4 font-black uppercase text-[10px] tracking-widest text-gray-400 text-right">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredOrders.map((order) => {
                                                                let statusBadgeClass = "bg-gray-100 text-gray-600 border-gray-200";
                                                                let statusLabel = order.status.replace(/_/g, ' ').toUpperCase();
                                                                if (order.status === 'delivered') statusBadgeClass = 'bg-teal-50 text-teal-600 border-teal-200';
                                                                if (order.status === 'cancelled') statusBadgeClass = 'bg-red-50 text-red-600 border-red-200';
                                                                if (order.status === 'in_process') statusBadgeClass = 'bg-amber-50 text-amber-600 border-amber-200';
                                                                if (order.status === 'ready_to_deliver') statusBadgeClass = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                                                                if (order.status === 'out_for_delivery') statusBadgeClass = 'bg-purple-50 text-purple-600 border-purple-200';
                                                                
                                                                return (
                                                                    <tr 
                                                                        key={order.orderId} 
                                                                        className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group"
                                                                    >
                                                                        {/* ORDER ID & DATE */}
                                                                        <td className="p-4 align-top">
                                                                            <div className="space-y-2">
                                                                                <div className="flex items-center gap-1.5 group/copy">
                                                                                    <Link href={`/orders/${order.orderId}`} className="text-[13px] font-black text-gray-900 hover:text-teal-600 transition-colors cursor-pointer">
                                                                                        #{order.orderId.split('-')[0]}
                                                                                    </Link>
                                                                                    <button 
                                                                                        onClick={(e) => handleCopy(order.orderId, e)}
                                                                                        className="text-gray-300 hover:text-teal-500 transition-colors p-1"
                                                                                        title="Copy Order ID"
                                                                                    >
                                                                                        {copiedText === order.orderId ? <Check size={12} className="text-teal-500" /> : <Copy size={12} />}
                                                                                    </button>
                                                                                </div>
                                                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                                                                    {formatDate(order.createdAt)}
                                                                                </div>
                                                                                <div className="pt-1">
                                                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                                                                        order.orderSource === 'app' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                                                    }`}>
                                                                                        {order.orderSource || "Store"}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </td>

                                                                        {/* CUSTOMER */}
                                                                        <td className="p-4 align-top">
                                                                            <div className="space-y-2.5">
                                                                                <div>
                                                                                    <div className="text-xs font-black text-gray-900">
                                                                                        {order.customerName}
                                                                                    </div>
                                                                                    {order.customerPhoneNumber && (
                                                                                        <div className="flex items-center gap-1 mt-0.5">
                                                                                            <Phone size={10} className="text-gray-400" />
                                                                                            <a 
                                                                                                href={`tel:${order.customerPhoneNumber}`}
                                                                                                className="text-[11px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                            >
                                                                                                {order.customerPhoneNumber}
                                                                                            </a>
                                                                                            <a
                                                                                                href={getStatusMessage(order)}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                                className="ml-1 px-1.5 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded text-[9px] font-black hover:bg-green-100 transition-colors"
                                                                                                title="WhatsApp Customer"
                                                                                            >
                                                                                                WA
                                                                                            </a>
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {order.address ? (
                                                                                    <div className="flex items-start gap-1 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                                                        <MapPin size={10} className="text-gray-400 shrink-0 mt-0.5" />
                                                                                        <div className="text-[10px] font-medium text-gray-600 line-clamp-3">
                                                                                            {order.address.houseNo ? `${order.address.houseNo}, ` : ""}
                                                                                            {order.address.line1 ? `${order.address.line1}, ` : ""}
                                                                                            {order.address.line2 ? `${order.address.line2}, ` : ""}
                                                                                            {order.address.area || order.address.city || "No Area"}
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-[10px] font-bold text-gray-400 italic">No Address</div>
                                                                                )}
                                                                            </div>
                                                                        </td>

                                                                        {/* ITEMS & DETAILS */}
                                                                        <td className="p-4 align-top">
                                                                            {order.services && order.services.length > 0 ? (
                                                                                <OrderServiceView services={order.services} title="Order Details" />
                                                                            ) : (
                                                                                <div className="text-xs text-gray-400 italic">No services listed</div>
                                                                            )}
                                                                        </td>

                                                                        {/* FINANCIALS */}
                                                                        <td className="p-4 align-top">
                                                                            <div className="space-y-3">
                                                                                <div className="text-lg font-black text-gray-900">
                                                                                    {formatCurrency(order.grandTotalPaid || order.totalAmount || 0)}
                                                                                </div>
                                                                                <div className={`inline-flex px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${
                                                                                    order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                                                    order.paymentStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                                    'bg-gray-100 text-gray-600 border-gray-200'
                                                                                }`}>
                                                                                    {order.paymentStatus || 'Pending'}
                                                                                </div>
                                                                            </div>
                                                                        </td>

                                                                        {/* STATUS TRACKING */}
                                                                        <td className="p-4 align-top">
                                                                            <div className={`inline-flex px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-widest border ${statusBadgeClass}`}>
                                                                                {statusLabel}
                                                                            </div>
                                                                        </td>

                                                                        {/* ACTIONS */}
                                                                        <td className="p-4 align-top">
                                                                            <div className="flex flex-col gap-2 items-end">
                                                                                <Link
                                                                                    href={`/orders/${order.orderId}/edit`}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 rounded-lg text-[11px] font-bold transition-all shadow-sm group/btn"
                                                                                >
                                                                                    <Edit3 size={12} className="group-hover/btn:scale-110 transition-transform" />
                                                                                    Edit
                                                                                </Link>
                                                                                
                                                                                <button
                                                                                    onClick={(e) => handleDeleteOrder(order.orderId, e)}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-lg text-[11px] font-bold transition-all shadow-sm group/btn"
                                                                                >
                                                                                    <Trash2 size={12} className="group-hover/btn:scale-110 transition-transform" />
                                                                                    Delete
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </Tab>
                                );
                            })}
                        </Tabs>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
