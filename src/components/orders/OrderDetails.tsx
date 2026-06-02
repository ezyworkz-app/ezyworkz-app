"use client";

import React, { useState } from "react";
import { Loader2, CheckCircle2, Package, Truck, Calendar, Clock, MapPin, IndianRupee, FileText } from "lucide-react";
import apiClient from "@/lib/api/client";

interface OrderDetailsProps {
    order: any;
    shopId: string;
    onOrderUpdated: () => void;
}

export default function OrderDetails({ order, shopId, onOrderUpdated }: OrderDetailsProps) {
    const [statusLoading, setStatusLoading] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [partialAmount, setPartialAmount] = useState("");
    const [showPartialInput, setShowPartialInput] = useState(false);

    const handleUpdateStatus = async (newStatus: string) => {
        if (!confirm(`Are you sure you want to change the status to ${newStatus.replace(/_/g, " ")}?`)) return;
        
        setStatusLoading(true);
        try {
            await apiClient.patch(`/shops/${shopId}/orders/${order.orderId}/status`, {
                status: newStatus
            });
            onOrderUpdated();
        } catch (err: any) {
            alert(err.message || "Failed to update status");
        } finally {
            setStatusLoading(false);
        }
    };

    const handleUpdatePayment = async (status: string, amountPaid?: number) => {
        setPaymentLoading(true);
        try {
            const payload: any = { paymentStatus: status };
            if (amountPaid !== undefined) {
                payload.amountPaid = amountPaid;
            }
            await apiClient.patch(`/shops/${shopId}/orders/${order.orderId}/payment`, payload);
            setShowPartialInput(false);
            setPartialAmount("");
            onOrderUpdated();
        } catch (err: any) {
            alert(err.message || "Failed to update payment");
        } finally {
            setPaymentLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'in_process': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'ready_to_deliver': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'out_for_delivery': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
            default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Intl.DateTimeFormat('en-IN', { 
            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
        }).format(new Date(dateStr));
    };

    const totalAmount = order.grandTotalPaid ?? order.totalAmount ?? 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Order Items & Pricing */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Services & Items */}
                <div className="bg-[#0e1424] rounded-3xl border border-card-border p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Package className="w-5 h-5 text-teal-500" />
                        Order Items
                    </h2>

                    <div className="space-y-6">
                        {order.services?.map((svc: any, idx: number) => (
                            <div key={idx} className="space-y-4">
                                <div className="flex justify-between items-center bg-[#151b2b] p-3 rounded-xl border border-white/5">
                                    <h3 className="font-semibold text-white">{svc.serviceName}</h3>
                                    {svc.deliveryType && (
                                        <span className="text-xs font-medium px-2 py-1 bg-white/5 rounded-md text-slate-300 capitalize">
                                            {Object.keys(svc.deliveryType)[0]} Delivery
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4 pl-2">
                                    {svc.categories?.map((cat: any, cIdx: number) => (
                                        <div key={cIdx}>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{cat.categoryName}</p>
                                            <div className="space-y-2">
                                                {cat.items?.map((item: any, iIdx: number) => (
                                                    <div key={iIdx} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                                        <div>
                                                            <p className="text-white text-sm font-medium">{item.itemName}</p>
                                                            <p className="text-slate-400 text-xs mt-0.5">Qty: {item.qty} × ₹{item.unitPrice}</p>
                                                        </div>
                                                        <p className="text-white font-semibold text-sm">₹{(item.unitPrice * item.qty).toFixed(2)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-[#0e1424] rounded-3xl border border-card-border p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-teal-500" />
                        Price Breakdown
                    </h2>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm text-slate-300">
                            <span>Items Total</span>
                            <span>₹{(order.baseAmount ?? 0).toFixed(2)}</span>
                        </div>
                        {order.deliveryCharges > 0 && (
                            <div className="flex justify-between text-sm text-slate-300">
                                <span>Delivery Charges</span>
                                <span>₹{(order.deliveryCharges).toFixed(2)}</span>
                            </div>
                        )}
                        {order.taxAmount > 0 && (
                            <div className="flex justify-between text-sm text-slate-300">
                                <span>GST & Tax</span>
                                <span>₹{(order.taxAmount).toFixed(2)}</span>
                            </div>
                        )}
                        {order.discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-teal-400">
                                <span>Discount</span>
                                <span>-₹{(order.discountAmount).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="pt-3 mt-3 border-t border-white/10 flex justify-between items-center">
                            <span className="text-white font-bold">Grand Total</span>
                            <span className="text-xl font-bold text-white">₹{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Status, Payment, Customer Info */}
            <div className="space-y-6">
                
                {/* Status Card */}
                <div className="bg-[#0e1424] rounded-3xl border border-card-border p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Order Status</h2>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border capitalize ${getStatusColor(order.status)}`}>
                                {order.status.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <div className="text-right">
                            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Date</h2>
                            <span className="text-sm text-white">{formatDate(order.createdAt)}</span>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/10">
                        <h3 className="text-sm font-semibold text-white mb-3">Update Status</h3>
                        {order.status === 'waiting_confirmation' && (
                            <button 
                                onClick={() => handleUpdateStatus('in_process')}
                                disabled={statusLoading}
                                className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-semibold rounded-xl transition-colors border border-amber-500/20 disabled:opacity-50"
                            >
                                Accept Order (In Process)
                            </button>
                        )}
                        {['confirmed', 'in_pickup', 'in_process'].includes(order.status) && (
                            <button 
                                onClick={() => handleUpdateStatus('ready_to_deliver')}
                                disabled={statusLoading}
                                className="w-full py-2.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 font-semibold rounded-xl transition-colors border border-teal-500/20 disabled:opacity-50"
                            >
                                Mark Ready
                            </button>
                        )}
                        {['ready_to_deliver', 'out_for_delivery'].includes(order.status) && (
                            <button 
                                onClick={() => handleUpdateStatus('delivered')}
                                disabled={statusLoading}
                                className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-semibold rounded-xl transition-colors border border-emerald-500/20 disabled:opacity-50"
                            >
                                Mark Delivered
                            </button>
                        )}
                        {!['delivered', 'cancelled'].includes(order.status) && (
                            <button 
                                onClick={() => handleUpdateStatus('cancelled')}
                                disabled={statusLoading}
                                className="w-full py-2 text-sm text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50 mt-2"
                            >
                                Cancel Order
                            </button>
                        )}
                        {statusLoading && <p className="text-xs text-center text-slate-500 mt-2">Updating status...</p>}
                    </div>
                </div>

                {/* Payment Card */}
                <div className="bg-[#0e1424] rounded-3xl border border-card-border p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Payment Status</h2>
                    
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`w-3 h-3 rounded-full ${
                            order.paymentStatus === 'paid' ? 'bg-emerald-500' : 
                            order.paymentStatus === 'partial' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <div>
                            <p className="text-white font-medium capitalize">{order.paymentStatus}</p>
                            <p className="text-xs text-slate-500 uppercase">{order.paymentMethod}</p>
                        </div>
                        {order.paymentStatus === 'partial' && (
                            <div className="ml-auto text-right">
                                <p className="text-xs text-slate-400">Paid: <span className="text-emerald-400 font-semibold">₹{order.amountPaid}</span></p>
                                <p className="text-xs text-slate-400">Due: <span className="text-amber-400 font-semibold">₹{totalAmount - (order.amountPaid || 0)}</span></p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/10">
                        <h3 className="text-sm font-semibold text-white mb-3">Update Payment</h3>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => handleUpdatePayment('paid')}
                                disabled={paymentLoading || order.paymentStatus === 'paid'}
                                className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-semibold rounded-xl transition-colors border border-emerald-500/20 disabled:opacity-50 text-sm"
                            >
                                Mark Fully Paid
                            </button>
                            <button 
                                onClick={() => setShowPartialInput(!showPartialInput)}
                                disabled={paymentLoading || order.paymentStatus === 'paid'}
                                className="py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-semibold rounded-xl transition-colors border border-amber-500/20 disabled:opacity-50 text-sm"
                            >
                                Record Partial
                            </button>
                        </div>
                        
                        {showPartialInput && (
                            <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
                                <input 
                                    type="number" 
                                    placeholder="Amount received..." 
                                    value={partialAmount}
                                    onChange={(e) => setPartialAmount(e.target.value)}
                                    className="flex-1 bg-[#151b2b] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                                />
                                <button 
                                    onClick={() => handleUpdatePayment('partial', parseFloat(partialAmount))}
                                    disabled={!partialAmount || paymentLoading}
                                    className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        )}

                        <button 
                            onClick={() => handleUpdatePayment('pending')}
                            disabled={paymentLoading || order.paymentStatus === 'pending'}
                            className="w-full mt-2 py-2 text-sm text-slate-400 hover:text-white font-medium transition-colors disabled:opacity-50"
                        >
                            Mark Unpaid
                        </button>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="bg-[#0e1424] rounded-3xl border border-card-border p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Customer Details</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 font-bold">
                                {order.customerName?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-white font-medium">{order.customerName}</p>
                                <p className="text-sm text-slate-400">{order.customerPhoneNumber}</p>
                            </div>
                        </div>

                        {order.address && (
                            <div className="pt-4 border-t border-white/10">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Delivery Address</h3>
                                <div className="text-sm text-slate-300 space-y-0.5">
                                    <p>{order.address.houseNo}, {order.address.block}</p>
                                    <p>{order.address.line1}</p>
                                    <p>{order.address.area}, {order.address.city}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
