"use client";

import React, { useState, useEffect } from "react";
import { Search, Edit3, DollarSign, FileText, MessageCircle, MapPin, Phone, StickyNote, Check, Loader2, ExternalLink, RefreshCw, X, ArrowDown, ArrowUp, AlertCircle, Truck, ChevronDown, Trash2, Ticket } from "lucide-react";
import InputField from "@/components/form/input/InputField";
import { Order, OrderService } from "@/types/order";
import { Shop } from "@/types/Shop";
import { getAllShops } from "@/lib/actions/shops";
import { updateOrderAdminNotes, updateOrderLogisticsType, updateOrderChatType, refundManual, refundOverpaidAmount, refundViaCashfree, updateOrderDetailsByAdmin, verifyOrderItemCount, deleteOrder, updateRiderAssignment, updateOrderDate } from "@/lib/actions/orders";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { generateWhatsAppMessage } from "@/utils/whatsappTemplate";

interface OrderTableProps {
    orders: Order[];
    isLoading?: boolean;
    onEdit: (order: Order, section: "status" | "payment" | "financials" | "chat" | "reassign") => void;
    unreadCounts: Record<string, number>;
    priorityCounts: Record<string, number>;
    priorityTab: string;
    setPriorityTab: (tab: "all" | "standard" | "oneDay" | "express") => void;
    sortOrder: "asc" | "desc";
    setSortOrder: (order: "asc" | "desc") => void;
    onTriggerPorter: (orderId: string, type: "pickup" | "delivery") => void;
    onCancelPorter: (orderId: string, type: "pickup" | "delivery") => void;
    onDelete: (orderId: string) => void;
    isPorterLoading: Record<string, "pickup" | "delivery" | null>;
    isStatusUpdating: Record<string, boolean>;
    shopsMap: Record<string, Shop>;
}

const AdminNotesCell = ({ orderId, initialNotes }: { orderId: string, initialNotes?: string }) => {
    const [notes, setNotes] = useState(initialNotes || "");
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const handleSave = async () => {
        if (!hasUnsavedChanges) return;
        setIsSaving(true);
        try {
            await updateOrderAdminNotes(orderId, notes);
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error("Failed to save admin notes", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="relative group">
            <textarea
                value={notes}
                onChange={(e) => {
                    setNotes(e.target.value);
                    setHasUnsavedChanges(true);
                }}
                placeholder="Add admin notes..."
                className={`w-full text-[11px] p-2 pr-8 rounded-lg border transition-all resize-none h-20 focus:ring-2 focus:ring-brand-500/10 outline-none ${hasUnsavedChanges
                    ? "border-warning-300 bg-warning-50/30"
                    : "border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white dark:border-gray-700 dark:bg-gray-900"
                    }`}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
                {isSaving ? (
                    <Loader2 size={12} className="animate-spin text-brand-500" />
                ) : hasUnsavedChanges ? (
                    <button
                        onClick={handleSave}
                        className="p-1 bg-warning-500 text-white rounded hover:bg-warning-600 shadow-sm"
                        title="Save changes"
                    >
                        <Check size={10} />
                    </button>
                ) : (
                    <StickyNote size={12} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
                )}
            </div>
        </div>
    );
};

const LogisticsToggleCell = ({ orderId, initialValue }: { orderId: string, initialValue: boolean }) => {
    const [isShopHandling, setIsShopHandling] = useState(initialValue);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleToggle = async () => {
        setIsUpdating(true);
        try {
            const nextValue = !isShopHandling;
            const res = await updateOrderLogisticsType(orderId, nextValue);
            if (res.error) throw new Error(res.error);
            setIsShopHandling(nextValue);
        } catch (err: any) {
            alert(err.message || "Failed to update logistics type");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex flex-col gap-1.5 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Shop Handled?</span>
                <button
                    onClick={handleToggle}
                    disabled={isUpdating}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${isShopHandling ? 'bg-brand-500' : 'bg-gray-300'
                        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span
                        className={`${isShopHandling ? 'translate-x-3.5' : 'translate-x-0.5'
                            } inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform`}
                    />
                </button>
            </div>
            <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isShopHandling ? 'bg-success-500' : 'bg-gray-400 animate-pulse'}`} />
                <span className={`text-[10px] font-bold ${isShopHandling ? 'text-success-600' : 'text-gray-500'}`}>
                    {isShopHandling ? "YES (Shop)" : "NO (System)"}
                </span>
            </div>
        </div>
    );
};

const DateEditorCell = ({ orderId, shopId, initialDate }: { orderId: string, shopId: string, initialDate: string }) => {
    const getLocalDatetimeString = (isoString: string) => {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return "";
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const [date, setDate] = useState(getLocalDatetimeString(initialDate));
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const handleSave = async () => {
        if (!hasUnsavedChanges) return;
        setIsSaving(true);
        try {
            const newDate = new Date(date);
            if (isNaN(newDate.getTime())) throw new Error("Invalid date");

            const res = await updateOrderDate(orderId, shopId, newDate.toISOString());
            if (res.error) throw new Error(res.error);
            setHasUnsavedChanges(false);
            window.location.reload(); // Refresh to ensure data sync
        } catch (error: any) {
            console.error("Failed to save date", error);
            alert(error.message || "Failed to update date");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-1 relative w-fit z-10">
            <input
                type="datetime-local"
                value={date}
                onChange={(e) => {
                    setDate(e.target.value);
                    setHasUnsavedChanges(true);
                }}
                className={`text-[10px] p-1 pr-6 rounded border transition-all h-6 outline-none ${hasUnsavedChanges
                    ? "border-warning-300 bg-warning-50/30 text-warning-700"
                    : "border-transparent bg-transparent hover:bg-gray-50 focus:bg-white text-gray-500"
                    }`}
            />
            {isSaving ? (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Loader2 size={10} className="animate-spin text-brand-500" />
                </div>
            ) : hasUnsavedChanges && (
                <button
                    onClick={handleSave}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 bg-warning-500 text-white rounded hover:bg-warning-600 shadow-sm"
                    title="Save changes"
                >
                    <Check size={8} />
                </button>
            )}
        </div>
    );
};

const OrderServiceView = ({
    services,
    title,
    themeColor = "brand",
    showShopPrices = false
}: {
    services: OrderService[],
    title: string,
    themeColor?: "brand" | "amber" | "gray",
    showShopPrices?: boolean
}) => {
    const isAmber = themeColor === "amber";
    const isGray = themeColor === "gray";
    const isBrand = themeColor === "brand";

    let containerClass = "p-4 rounded-xl border-2 border-brand-500/20 dark:border-brand-500/30 bg-brand-50/20 dark:bg-brand-500/5 shadow-sm";
    let titleClass = "text-brand-500/70 dark:text-brand-400/50";
    let badgeClass = "bg-brand-500 text-white";
    let totalTextClass = "text-brand-600 dark:text-brand-500";
    let borderClass = "border-brand-100 dark:border-brand-900/40";

    if (isAmber) {
        containerClass = "p-4 rounded-xl border-2 border-amber-500/20 dark:border-amber-500/30 bg-amber-50/20 dark:bg-amber-500/5 shadow-sm";
        titleClass = "text-amber-500/70 dark:text-amber-400/50";
        totalTextClass = "text-amber-600 dark:text-amber-500";
        borderClass = "border-amber-100 dark:border-amber-900/40";
    } else if (isGray) {
        containerClass = "p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40";
        titleClass = "text-gray-400 dark:text-gray-500";
        totalTextClass = "text-gray-600 dark:text-gray-400";
        borderClass = "border-gray-50 dark:border-gray-800/30";
    }

    return (
        <div className="space-y-3">
            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center py-1 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                {title}
            </div>
            {(services ?? []).map((service, sIdx) => {
                const deliveryKey = service.selectedDeliveryKey || (service.deliveryTypes?.express ? "express" : service.deliveryTypes?.oneDay ? "oneDay" : "standard");
                const deliveryType = deliveryKey.charAt(0).toUpperCase() + deliveryKey.slice(1);

                const itemTotalRaw = service.categories.reduce((s, c) => s + c.items.reduce((sum, i) => sum + (i.totalPrice || 0), 0), 0);
                const itemTotalShop = service.categories.reduce((s, c) => s + c.items.reduce((sum, i) => sum + ((i.originalUnitPrice || 0) * i.qty), 0), 0);
                
                const addonTotalRaw = service.addons?.reduce((sum, a) => sum + (a.price * a.qty), 0) || 0;
                const addonTotalShop = service.addons?.reduce((sum, a) => sum + ((a.originalUnitPrice || a.price || 0) * a.qty), 0) || 0;

                const itemTotal = showShopPrices ? itemTotalShop : itemTotalRaw;
                const addonTotal = showShopPrices ? addonTotalShop : addonTotalRaw;
                
                // For fulfillment user bill, speed fee is embedded in marked-up totalPrice already
                // Only compute speed fee for the shop payout side (which doesn't apply)
                const multiplier = service.deliveryTypes?.[deliveryKey as any]?.priceMultiplier || 1;
                const isFulfillmentUserBill = title === "Fulfillment User Bill";
                
                let speedFee = 0;
                if (multiplier > 1 && !isFulfillmentUserBill) {
                    speedFee = (itemTotal + addonTotal) * (multiplier - 1);
                }

                // Delivery Badge Color Logic
                let deliveryBadgeClassName = "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400"; // Standard
                if (deliveryKey === "oneDay") deliveryBadgeClassName = "bg-orange-500 text-white shadow-sm shadow-orange-500/20";
                if (deliveryKey === "express") deliveryBadgeClassName = "bg-red-500 text-white shadow-sm shadow-red-500/20";

                return (
                    <div key={sIdx} className={containerClass}>
                        <div className={`flex justify-between items-start mb-3 pb-2 border-b ${borderClass}`}>
                            <h4 className="text-theme-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">{service.serviceName}</h4>
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${deliveryBadgeClassName}`}>
                                {deliveryType}
                            </div>
                        </div>
                        <ul className="space-y-3">
                            {service.categories.map((cat, cIdx) => (
                                <li key={cIdx} className="space-y-1.5">
                                    <div className={`text-[9px] font-bold uppercase tracking-wider ${titleClass} mb-0.5 border-b ${borderClass} pb-0.5`}>
                                        {cat.categoryName}
                                    </div>
                                    <ul className="space-y-1.5">
                                        {cat.items.map((item, iIdx) => (
                                            <li key={iIdx} className="text-[11px] flex flex-col text-gray-800 dark:text-gray-200">
                                                <div className="flex justify-between">
                                                    <span className="font-medium">{item.itemName} x{item.qty}</span>
                                                    <span className="font-bold text-gray-900 dark:text-white">
                                                        ₹{(showShopPrices ? (item.originalUnitPrice || 0) * item.qty : (item.totalPrice ?? 0)).toFixed(2)}
                                                    </span>
                                                </div>
                                                {item.addons && item.addons.length > 0 && (
                                                    <div className={`pl-2 mt-0.5 space-y-0.5 border-l ${borderClass}`}>
                                                        {item.addons.map((a: any, aIdx: any) => (
                                                            <div key={aIdx} className={`text-[9px] flex justify-between ${titleClass} font-bold italic`}>
                                                                <span>+ {a.addonName}</span>
                                                                <span>
                                                                    ₹{(showShopPrices ? (a.originalUnitPrice || a.price || 0) * item.qty : a.price).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                            {service.addons && service.addons.length > 0 && (
                                <li className="space-y-1.5">
                                    <div className={`text-[9px] font-bold uppercase tracking-wider ${titleClass} mb-0.5 border-b ${borderClass} pb-0.5`}>
                                        Addons
                                    </div>
                                    <ul className="space-y-1.5">
                                        {service.addons.map((addon: any, aIdx: any) => (
                                            <li key={aIdx} className={`text-[10px] flex justify-between ${totalTextClass} font-bold italic`}>
                                                <span>+ {addon.addonName} x{addon.qty}</span>
                                                <span>
                                                    ₹{(showShopPrices ? (addon.originalUnitPrice || addon.price || 0) * addon.qty : (addon.price * addon.qty)).toFixed(2)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            )}
                            {speedFee > 0.01 && (
                                <li className="space-y-1.5 pt-1">
                                    <div className={`text-[10px] flex justify-between ${totalTextClass} font-bold uppercase tracking-wider`}>
                                        <span>Speed Fee ({deliveryType})</span>
                                        <span>₹{speedFee.toFixed(2)}</span>
                                    </div>
                                </li>
                            )}
                        </ul>
                        <div className={`pt-2 mt-2 border-t ${borderClass} flex justify-between items-center`}>
                            <span className={`text-[10px] font-bold uppercase ${isGray ? 'text-gray-400' : 'text-brand-500'}`}>{showShopPrices ? 'Shop Payout' : 'Total'}</span>
                            <span className={`text-theme-sm font-black ${totalTextClass}`}>
                            ₹{(showShopPrices ? (itemTotalShop + addonTotalShop + speedFee) : (itemTotalRaw + addonTotalRaw + speedFee)).toFixed(2)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const ChatToggleCell = ({ orderId, initialValue }: { orderId: string, initialValue: boolean }) => {
    const [isShopChatEnabled, setIsShopChatEnabled] = useState(initialValue);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleToggle = async () => {
        setIsUpdating(true);
        try {
            const nextValue = !isShopChatEnabled;
            const res = await updateOrderChatType(orderId, nextValue);
            if (res.error) throw new Error(res.error);
            setIsShopChatEnabled(nextValue);
        } catch (err: any) {
            alert(err.message || "Failed to update chat notification type");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex flex-col gap-1.5 p-2 bg-brand-50/30 dark:bg-brand-500/5 rounded-xl border border-brand-100/50 dark:border-brand-500/10">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                    <MessageCircle size={10} className={isShopChatEnabled ? "text-brand-500" : "text-gray-400"} />
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Shop Chat?</span>
                </div>
                <button
                    onClick={handleToggle}
                    disabled={isUpdating}
                    className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors focus:outline-none ${isShopChatEnabled ? 'bg-brand-500' : 'bg-gray-300'
                        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span
                        className={`${isShopChatEnabled ? 'translate-x-3' : 'translate-x-0.5'
                            } inline-block h-2 w-2 transform rounded-full bg-white transition-transform`}
                    />
                </button>
            </div>
            <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-bold ${isShopChatEnabled ? 'text-brand-600' : 'text-gray-500'}`}>
                    {isShopChatEnabled ? "NOTIFY SHOP" : "ADMIN ONLY"}
                </span>
            </div>
        </div>
    );
};

const ItemCountCell = ({ orderId, userItems, shopItems }: { orderId: string, userItems?: number, shopItems?: number }) => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    
    // 🔹 Local display state for immediate updates
    const [displayUserItems, setDisplayUserItems] = useState(userItems);
    const [displayShopItems, setDisplayShopItems] = useState(shopItems);
    
    // 🔹 Editor state
    const [uCount, setUCount] = useState(userItems?.toString() || "");
    const [sCount, setSCount] = useState(shopItems?.toString() || "");
    const [isSaving, setIsSaving] = useState(false);

    // 🔹 Sync local state when props change (from background refresh)
    useEffect(() => {
        setDisplayUserItems(userItems);
        setUCount(userItems?.toString() || "");
    }, [userItems]);

    useEffect(() => {
        setDisplayShopItems(shopItems);
        setSCount(shopItems?.toString() || "");
    }, [shopItems]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const parsedS = sCount === "" ? undefined : parseInt(sCount);
            const parsedU = uCount === "" ? undefined : parseInt(uCount);

            // 1. If only shopVerifiedItemCount changed, use the specialized verify API (triggers notifications)
            if (sCount !== (displayShopItems?.toString() || "")) {
                const res = await verifyOrderItemCount(orderId, parsedS || 0);
                if (res.error) throw new Error(res.error);
            }
            
            // 2. If userItemCount also changed, use the general update API
            if (uCount !== (displayUserItems?.toString() || "")) {
                const res = await updateOrderDetailsByAdmin(orderId, {
                    userItemCount: parsedU
                } as any);
                if (res.error) throw new Error(res.error);
            }
            
            // 🔹 Update local display state immediately
            setDisplayUserItems(parsedU);
            setDisplayShopItems(parsedS);
            
            router.refresh();
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update item counts", error);
            alert("Failed to update item counts");
        } finally {
            setIsSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div 
                className="flex flex-col gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl border-2 border-brand-500/50 shadow-xl w-40 animate-in fade-in zoom-in duration-200 z-50 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">User Count</label>
                        {uCount !== "" && <span className="text-[8px] font-bold text-gray-300">#{uCount}</span>}
                    </div>
                    <input
                        type="number"
                        value={uCount}
                        onChange={(e) => setUCount(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        placeholder="Items reported by user..."
                    />
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black uppercase text-emerald-500 tracking-wider font-bold">Verified Count</label>
                        {sCount !== "" && <span className="text-[8px] font-bold text-emerald-400">AUTHORITATIVE</span>}
                    </div>
                    <input
                        type="number"
                        value={sCount}
                        onChange={(e) => setSCount(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-emerald-100 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-500/5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-emerald-600 dark:text-emerald-400"
                        placeholder="Authoritative count..."
                    />
                </div>
                <div className="flex gap-2 pt-1">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 py-2 bg-brand-500 text-white rounded-lg text-xs font-black hover:bg-brand-600 disabled:opacity-50 shadow-sm shadow-brand-500/20 transition-all font-mono"
                    >
                        {isSaving ? <Loader2 size={12} className="animate-spin mx-auto" /> : "SAVE"}
                    </button>
                    {uCount !== "" && uCount !== sCount && (
                        <button
                            onClick={() => {
                                setSCount(uCount);
                            }}
                            className="px-3 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg text-[9px] font-black border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500 hover:text-white transition-all uppercase"
                            title="Set Shop Count = User Count"
                        >
                            SET FOR SHOP
                        </button>
                    )}
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        );
    }

    if (displayUserItems === undefined && displayShopItems === undefined) {
        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                }}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-brand-500/50 hover:bg-brand-50/30 transition-all active:scale-95"
            >
                <RefreshCw size={12} className="text-gray-300 group-hover:text-brand-500 transition-transform group-hover:rotate-180 duration-500" />
                <span className="text-[10px] font-black text-gray-400 group-hover:text-brand-600 uppercase tracking-tight">Verify Count</span>
            </button>
        );
    }

    return (
        <div 
            onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            className="flex flex-row items-center gap-1.5 cursor-pointer group"
        >
            {displayUserItems !== undefined && (
                <div className="relative">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 uppercase tracking-tighter group-hover:border-amber-400 transition-all flex items-center gap-1 shrink-0">
                        <span className="opacity-50">USER</span> {displayUserItems}
                    </span>
                    {displayShopItems === undefined && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                    )}
                </div>
            )}
            
            {displayShopItems !== undefined && (
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-tighter flex items-center gap-1 shadow-sm group-hover:scale-105 transition-all outline outline-1 outline-offset-1 shrink-0 ${
                    displayUserItems !== undefined && displayUserItems !== displayShopItems
                    ? 'bg-rose-500 text-white border-rose-400 dark:border-rose-500 outline-rose-500/20'
                    : 'bg-emerald-500 text-white border-emerald-400 dark:border-emerald-500 outline-emerald-500/20'
                }`}>
                    <span className="opacity-70">SHOP</span> {displayShopItems}
                    {displayUserItems !== undefined && displayUserItems !== displayShopItems && <AlertCircle size={8} className="ml-0.5" />}
                </span>
            )}
            
            <div className="p-1 bg-gray-50 dark:bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-all border border-gray-100 dark:border-gray-700">
                <Edit3 size={8} className="text-gray-400" />
            </div>
        </div>
    );
};

const RapidoOtpCell = ({
    orderId,
    initialOtp,
    initialRiderName,
    initialBookingId,
    initialPayoutAmount,
}: {
    orderId: string;
    initialOtp?: string;
    initialRiderName?: string;
    initialBookingId?: string;
    initialPayoutAmount?: number;
    status: string;
}) => {
    const [isEditing,    setIsEditing]    = useState(false);
    const [otp,          setOtp]          = useState(initialOtp       || "");
    const [riderName,    setRiderName]    = useState(initialRiderName || "");
    const [bookingId,    setBookingId]    = useState(initialBookingId  || "");
    const [payoutAmount, setPayoutAmount] = useState(initialPayoutAmount?.toString() || "");
    const [isSaving,     setIsSaving]     = useState(false);
    const [saved,        setSaved]        = useState(false);

    // Keep local state in sync when props refresh
    useEffect(() => { setOtp(initialOtp       || ""); }, [initialOtp]);
    useEffect(() => { setRiderName(initialRiderName || ""); }, [initialRiderName]);
    useEffect(() => { setBookingId(initialBookingId  || ""); }, [initialBookingId]);
    useEffect(() => { setPayoutAmount(initialPayoutAmount?.toString() || ""); }, [initialPayoutAmount]);

    const handleSave = async () => {
        if (!otp.trim()) { alert("OTP is required."); return; }
        setIsSaving(true);
        try {
            let nextStatus = undefined;
            if (status === "confirmed") nextStatus = "in_pickup";
            
            const res = await updateRiderAssignment(orderId, {
                rapidoOtp:            otp.trim(),
                rapidoRiderName:      riderName.trim() || undefined,
                rapidoBookingId:      bookingId.trim() || undefined,
                deliveryPayoutAmount: payoutAmount ? parseFloat(payoutAmount) : undefined,
                status:               nextStatus,
            });
            if (res.error) throw new Error(res.error);
            setSaved(true);
            setIsEditing(false);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            alert(err.message || "Failed to save rider assignment");
        } finally {
            setIsSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div className="space-y-2 p-3 bg-orange-50 dark:bg-orange-500/5 rounded-xl border border-orange-200 dark:border-orange-500/20 min-w-[200px]">
                <div className="flex items-center gap-1.5 mb-2">
                    <Truck size={13} className="text-orange-500" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                        Rapido Rider OTP
                    </span>
                </div>

                {/* OTP input — big and obvious */}
                <div>
                    <label className="text-[9px] font-black uppercase text-orange-500 tracking-wider block mb-1">
                        OTP <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        placeholder="e.g. 4821"
                        className="w-full text-xl font-black tracking-[0.4em] p-2 rounded-lg border-2 border-orange-300 dark:border-orange-500/40 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-400/30 text-orange-600 dark:text-orange-400 placeholder:text-orange-200 placeholder:tracking-normal placeholder:text-sm placeholder:font-normal text-center"
                        autoFocus
                    />
                </div>

                {/* Rider name */}
                <div>
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                        Rider Name <span className="text-gray-300">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={riderName}
                        onChange={(e) => setRiderName(e.target.value)}
                        placeholder="e.g. Ravi Kumar"
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-400/20 text-gray-700 dark:text-gray-300"
                    />
                </div>

                {/* Booking ID */}
                <div>
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block mb-1">
                        Booking ID <span className="text-gray-300">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={bookingId}
                        onChange={(e) => setBookingId(e.target.value)}
                        placeholder="e.g. RB-2024-12345"
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-400/20 text-gray-700 dark:text-gray-300"
                    />
                </div>

                {/* Payout Amount */}
                <div>
                    <label className="text-[9px] font-black uppercase text-orange-500 tracking-wider block mb-1">
                        Pay Rider (₹) <span className="text-gray-300 font-normal normal-case">(shown in shop app)</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                        <input
                            type="number"
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            placeholder="0.00"
                            min={0}
                            step="0.01"
                            className="w-full pl-6 pr-2 text-sm font-bold p-2 rounded-lg border-2 border-orange-300 dark:border-orange-500/40 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-400/30 text-orange-600 dark:text-orange-400 placeholder:text-orange-200 placeholder:font-normal placeholder:text-xs"
                        />
                    </div>
                </div>


                <div className="flex gap-2 pt-1">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !otp.trim()}
                        className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-xs font-black shadow-sm shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                        {isSaving
                            ? <Loader2 size={12} className="animate-spin" />
                            : <><Check size={12} /> Save</>
                        }
                    </button>
                    <button
                        onClick={() => { setIsEditing(false); setOtp(initialOtp || ""); setRiderName(initialRiderName || ""); setBookingId(initialBookingId || ""); setPayoutAmount(initialPayoutAmount?.toString() || ""); }}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        );
    }

    // Display state — OTP already set
    if (otp) {
        return (
            <div
                onClick={() => setIsEditing(true)}
                className="group cursor-pointer p-2.5 rounded-xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/5 hover:bg-orange-100 dark:hover:bg-orange-500/10 transition-all space-y-1.5"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Truck size={11} className="text-orange-500" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-orange-500">Rapido OTP</span>
                    </div>
                    {saved
                        ? <span className="text-[9px] font-black text-green-500 uppercase tracking-wider">Saved ✓</span>
                        : <Edit3 size={9} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
                    }
                </div>

                {/* Large OTP digits */}
                <div className="flex items-center gap-1 justify-center">
                    {otp.split("").map((d, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center justify-center w-7 h-8 rounded-lg bg-white dark:bg-gray-900 border-2 border-orange-300 dark:border-orange-500/40 text-lg font-black text-orange-600 dark:text-orange-400 shadow-sm"
                        >
                            {d}
                        </span>
                    ))}
                </div>

                {/* Rider / booking / payout chips */}
                {(riderName || bookingId || payoutAmount) && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                        {riderName && (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-full border border-orange-200 dark:border-orange-500/20">
                                👤 {riderName}
                            </span>
                        )}
                        {bookingId && (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-full border border-orange-200 dark:border-orange-500/20">
                                🔖 {bookingId}
                            </span>
                        )}
                        {payoutAmount && (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-500/20">
                                💸 ₹{parseFloat(payoutAmount).toFixed(2)}
                            </span>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Empty state — no OTP yet
    return (
        <button
            onClick={() => setIsEditing(true)}
            className="group flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-orange-200 dark:border-orange-500/20 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all w-full"
        >
            <Truck size={12} className="text-orange-300 group-hover:text-orange-500 transition-colors" />
            <span className="text-[10px] font-black text-gray-400 group-hover:text-orange-600 uppercase tracking-tight">
                Add Rapido OTP
            </span>
        </button>
    );
};

const OrderTable: React.FC<OrderTableProps> = ({
    orders,
    isLoading = false,
    unreadCounts,
    priorityCounts = {},
    priorityTab,
    setPriorityTab,
    sortOrder,
    setSortOrder,
    onEdit,
    onTriggerPorter,
    onCancelPorter,
    onDelete,
    isPorterLoading,
    isStatusUpdating,
    shopsMap,
}) => {
    const router = useRouter();

    const [copiedText, setCopiedText] = useState<string | null>(null);

    const handleCopy = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 2000);
    };

    const filteredOrders = orders; // Filtering is now handled by backend q, priority, and status

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Never";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    const getWhatsAppLink = (phone: string, message?: string) => {
        const cleanPhone = phone.replace(/\D/g, "");
        if (!cleanPhone) return "#";
        const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const url = `https://wa.me/${finalPhone}`;
        return message ? `${url}?text=${encodeURIComponent(message)}` : url;
    };

    const getStatusMessage = (order: Order, recipient: "user" | "shop") => {
        const safeOrderId = order.orderId.replace(/_/g, '-');
        const shop = shopsMap[order.shopId];
        const shopCustomDomain = shop?.customDomain;
        const shopSubdomain = shop?.subdomain;
        const invoiceUrl = shopCustomDomain 
            ? `https://${shopCustomDomain}/invoice/${safeOrderId}`
            : shopSubdomain
            ? `https://${shopSubdomain}.ezyworkz.com/invoice/${safeOrderId}`
            : `https://ezyworkz.com/order/${safeOrderId}`;

        return generateWhatsAppMessage(order, recipient, shop?.name, invoiceUrl);
    };


    return (
        <div className="relative overflow-hidden w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
            {/* Priority Sub-tabs & Sort Toggle */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/10 dark:bg-white/[0.01]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Priority Sub-tabs */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">Filter By</span>
                        <div 
                            className="flex-1 min-w-0 flex gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700 overflow-x-auto no-scrollbar"
                            onWheel={(e) => {
                                if (e.deltaY !== 0) {
                                    e.currentTarget.scrollLeft += e.deltaY;
                                }
                            }}
                        >
                            {(["all", "standard", "oneDay", "express"] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPriorityTab(p)}
                                    className={`px-4 py-2 text-[11px] font-black rounded-lg transition-all uppercase tracking-tighter flex items-center gap-2 ${priorityTab === p
                                        ? "bg-white dark:bg-gray-700 text-brand-500 border border-gray-200 dark:border-gray-600"
                                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        }`}
                                >
                                    {p === "all" ? "All" : p}
                                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${priorityTab === p ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10" : "bg-gray-100 dark:bg-gray-700 text-gray-400 font-bold"}`}>
                                        {priorityCounts[p] || 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sort Toggle */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">Sort By</span>
                        <div 
                            className="flex-1 min-w-0 flex gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700 overflow-x-auto no-scrollbar"
                            onWheel={(e) => {
                                if (e.deltaY !== 0) {
                                    e.currentTarget.scrollLeft += e.deltaY;
                                }
                            }}
                        >
                            <button
                                onClick={() => setSortOrder("desc")}
                                className={`flex items-center gap-2 px-4 py-2 text-[11px] font-black rounded-lg transition-all uppercase tracking-tighter ${sortOrder === "desc"
                                    ? "bg-white dark:bg-gray-700 text-brand-500 border border-gray-200 dark:border-gray-600"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    }`}
                            >
                                <ArrowDown size={14} /> Newest
                            </button>
                            <button
                                onClick={() => setSortOrder("asc")}
                                className={`flex items-center gap-2 px-4 py-2 text-[11px] font-black rounded-lg transition-all uppercase tracking-tighter ${sortOrder === "asc"
                                    ? "bg-white dark:bg-gray-700 text-brand-500 border border-gray-200 dark:border-gray-600"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    }`}
                            >
                                <ArrowUp size={14} /> Oldest
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="max-w-full overflow-x-auto">
                <div className="min-w-[1100px]">
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Order</TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Customer</TableCell>

                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Logistics</TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 min-w-[200px]">Notes</TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Financial Audit</TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 min-w-[540px]">Cart Items</TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 min-w-[540px]">B2B Fulfillment</TableCell>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => {
                                        const shop = shopsMap[order.shopId];

                                        return (
                                        <TableRow key={order?.orderId} className="hover:bg-gray-50/30 dark:hover:bg-white/[0.01] transition-colors align-top">
                                            {/* Order Info */}
                                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                            {order.orderId}
                                                        </span>
                                                        <button
                                                            onClick={() => handleCopy(order.orderId, "Order ID")}
                                                            className="p-1 text-gray-300 hover:text-brand-500 transition-all"
                                                        >
                                                            {copiedText === order.orderId ? <Check size={10} className="text-success-500" /> : <FileText size={10} />}
                                                        </button>
                                                    </div>

                                                    {order.tokenNumbers?.length > 0 ? (
                                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                                            {order.tokenNumbers.map((t: string) => (
                                                                <div key={t} className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 w-fit">
                                                                    <Ticket size={12} />
                                                                    {t}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : order.tokenNumber ? (
                                                        <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 w-fit">
                                                            <Ticket size={12} />
                                                            {order.tokenNumber}
                                                        </div>
                                                    ) : null}

                                                    <div className="block mt-1">
                                                        <DateEditorCell orderId={order.orderId} shopId={order.shopId} initialDate={order.createdAt} />
                                                    </div>

                                                    {/* Item Counts Verification */}
                                                    <div className="pt-2">
                                                        <ItemCountCell 
                                                            orderId={order.orderId} 
                                                            userItems={order.userItemCount} 
                                                            shopItems={order.shopVerifiedItemCount} 
                                                        />
                                                    </div>

                                                    {/* Action Buttons (Moved from dedicated column) */}
                                                    <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col items-start gap-4">
                                                        <button
                                                            onClick={() => onEdit(order, "status")}
                                                            disabled={isStatusUpdating[order.orderId]}
                                                            className={`w-fit px-4 py-1.5 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase rounded-lg transition-all shadow-sm border ${order.status === "delivered"
                                                                ? "bg-green-50 border-green-100 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400"
                                                                : order.status === "cancelled"
                                                                    ? "bg-red-50 border-red-100 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400"
                                                                    : "bg-gray-900 border-gray-800 text-white dark:bg-white dark:border-white dark:text-gray-900"
                                                                } ${isStatusUpdating[order.orderId] ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"}`}
                                                        >
                                                            {isStatusUpdating[order.orderId] ? (
                                                                <>
                                                                    <Loader2 size={10} className="animate-spin" />
                                                                    Updating
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {order.status.replace(/_/g, " ")}
                                                                    <ChevronDown size={12} className="opacity-50 ml-0.5" />
                                                                </>
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() => onDelete(order.orderId)}
                                                            className="w-fit px-4 py-1.5 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase rounded-lg transition-all shadow-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 active:scale-95"
                                                        >
                                                            <Trash2 size={12} />
                                                            Delete Order
                                                        </button>
                                                        
                                                        {(() => {
                                                            const amountPaid = order.amountPaid || 0;
                                                            const grandTotal = order.grandTotalPaid || 0;
                                                            if (amountPaid > grandTotal + 0.05) {
                                                                const over = (amountPaid - grandTotal).toFixed(2);
                                                                const pref = order.refundPreference;
                                                                return (
                                                                    <div className="flex flex-col gap-2 w-full">
                                                                        <button
                                                                            onClick={async () => {
                                                                                if (confirm(`Mark Rs.${over} as manually refunded for order ${order.orderId}?`)) {
                                                                                    const res = await refundManual(order.orderId);
                                                                                    if (res.success) {
                                                                                        alert("Marked as refunded!");
                                                                                        window.location.reload();
                                                                                    } else {
                                                                                        alert("Failed: " + (res.message || res.error));
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="w-fit px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                                                        >
                                                                            <DollarSign size={12} /> Manual Refund
                                                                        </button>

                                                                        {pref && (
                                                                            <p className="text-[9px] font-black uppercase tracking-wider text-indigo-400">
                                                                                Customer prefers: {pref === 'wallet' ? '👜 Wallet' : pref === 'original' ? '💳 Original' : '✋ Manual'}
                                                                            </p>
                                                                        )}

                                                                        <div className="flex gap-2 w-full">
                                                                            <button
                                                                                onClick={async () => {
                                                                                    if (confirm(`Refund Rs.${over} to Wallet for order ${order.orderId}?`)) {
                                                                                        const res = await refundOverpaidAmount(order.orderId);
                                                                                        if (res.success) {
                                                                                            alert("Refunded to wallet!");
                                                                                            window.location.reload();
                                                                                        } else alert("Failed: " + (res.message || res.error));
                                                                                    }
                                                                                }}
                                                                                className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all active:scale-95 text-center ${
                                                                                    pref === 'wallet'
                                                                                        ? 'bg-emerald-500 text-white border-emerald-500 ring-2 ring-emerald-400 ring-offset-1 ring-offset-gray-950'
                                                                                        : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white border-emerald-500/20'
                                                                                }`}
                                                                            >
                                                                                Wallet {pref === 'wallet' && '★'}
                                                                            </button>
                                                                            <button
                                                                                onClick={async () => {
                                                                                    if (confirm(`Trigger Cashfree refund of Rs.${over} for order ${order.orderId}?`)) {
                                                                                        const res = await refundViaCashfree(order.orderId);
                                                                                        if (res.success) {
                                                                                            alert("Cashfree refund triggered!");
                                                                                            window.location.reload();
                                                                                        } else alert("Failed: " + (res.message || res.error));
                                                                                    }
                                                                                }}
                                                                                className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all active:scale-95 text-center ${
                                                                                    pref === 'original'
                                                                                        ? 'bg-blue-500 text-white border-blue-500 ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-950'
                                                                                        : 'bg-blue-500/10 hover:bg-blue-50 hover:text-blue-600 text-blue-500 border-blue-500/20'
                                                                                }`}
                                                                            >
                                                                                Cashfree {pref === 'original' && '★'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })()}

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => onEdit(order, "chat")}
                                                                className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all relative border border-gray-100 dark:border-white/5"
                                                                title="Chat"
                                                            >
                                                                <MessageCircle className="h-4 w-4" />
                                                                {(unreadCounts[order.orderId] || 0) > 0 && (
                                                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-950 dark:bg-white text-[9px] font-black text-white dark:text-gray-950 ring-2 ring-white dark:ring-gray-900 animate-pulse">
                                                                        {unreadCounts[order.orderId]}
                                                                    </span>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => onEdit(order, "payment")}
                                                                className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all border border-gray-100 dark:border-white/5"
                                                                title="Update Payment"
                                                            >
                                                                <DollarSign className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => onEdit(order, "financials")}
                                                                className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all border border-gray-100 dark:border-white/5"
                                                                title="Edit Financials"
                                                            >
                                                                <FileText className="h-4 w-4" />
                                                            </button>
                                                            {(() => {
                                                                const isTransferred = order.originalShopId && order.originalShopId !== order.shopId;
                                                                if (!isTransferred) {
                                                                    return (
                                                                        <Link
                                                                            href={`/orders/${order.orderId}/edit`}
                                                                            className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all border border-gray-100 dark:border-white/5"
                                                                            title="Edit Cart Items"
                                                                        >
                                                                            <Edit3 className="h-4 w-4" />
                                                                        </Link>
                                                                    );
                                                                }
                                                                return (
                                                                    <div className="flex gap-1.5">
                                                                        <Link
                                                                            href={`/orders/${order.orderId}/edit`}
                                                                            className="flex items-center justify-center h-8 px-2 text-[9px] font-black uppercase rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-500 hover:text-white transition-all border border-brand-100 dark:bg-brand-500/10 dark:border-brand-500/20"
                                                                            title="Edit Customer Bill"
                                                                        >
                                                                            BILL
                                                                        </Link>
                                                                        <Link
                                                                            href={`/orders/${order.orderId}/edit?mode=fulfillment`}
                                                                            className="flex items-center justify-center h-8 px-2 text-[9px] font-black uppercase rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-all border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20"
                                                                            title="Edit Shop B Payout"
                                                                        >
                                                                            FULLFILL
                                                                        </Link>
                                                                    </div>
                                                                );
                                                            })()}
                                                            <button
                                                                onClick={() => onEdit(order, "reassign")}
                                                                className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all border border-gray-100 dark:border-white/5"
                                                                title="Reassign Shop"
                                                            >
                                                                <RefreshCw className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Customer Info */}
                                            <TableCell className="px-4 py-3 text-start">
                                                <div className="space-y-4 min-w-[200px]">
                                                    {/* Name & Phone */}
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleCopy(order.user?.name || "", "Customer Name")}
                                                                className="block font-medium text-gray-800 text-theme-sm dark:text-white/90 leading-none hover:text-brand-500 transition-colors text-left"
                                                            >
                                                                {order.user?.name || "Guest User"}
                                                            </button>
                                                            {order.userInfo?.hasUncollectibleBalance && (
                                                                <Badge color="error" variant="solid" size="sm" className="bg-rose-500 text-white border-none font-black uppercase tracking-tighter px-2">
                                                                    ⚠️ UNCOLLECTIBLE {order.userInfo?.uncollectibleBalanceAmount ? `: ₹${order.userInfo.uncollectibleBalanceAmount.toFixed(0)}` : ""}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <button
                                                                onClick={() => handleCopy(order.user?.phoneNumber || "", "Phone Number")}
                                                                className="text-gray-500 text-theme-xs dark:text-gray-400 hover:text-brand-500 transition-colors"
                                                            >
                                                                {order.user?.phoneNumber || "No Phone"}
                                                            </button>
                                                            {order.user?.phoneNumber && (
                                                                <a
                                                                    href={getWhatsAppLink(order.user.phoneNumber, getStatusMessage(order, "user"))}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1 px-1.5 bg-success-50 text-success-600 rounded-md hover:bg-success-600 hover:text-white transition-all border border-success-100 flex items-center gap-1"
                                                                >
                                                                    <MessageCircle size={10} className="fill-current" />
                                                                    <span className="text-[8px] font-black uppercase">WA</span>
                                                                </a>
                                                            )}
                                                        </div>

                                                    {/* Address & Coordinates */}
                                                    <div className="pt-2 border-t border-gray-50 dark:border-gray-800 space-y-2">
                                                        <button
                                                            onClick={() => order.address && handleCopy(`${order.address?.houseNo || ""} ${order.address?.line2 || ""}`.trim(), "Address")}
                                                            className="text-theme-xs text-gray-500 leading-snug dark:text-gray-400 text-left hover:text-brand-500 transition-colors block"
                                                        >
                                                            {order.address?.houseNo && <span className="font-medium text-gray-800 dark:text-white/90">{order.address?.houseNo} </span>}
                                                            {order.address?.line2 && order.address.line2 !== "Not Provided" && <div>{order.address.line2}</div>}
                                                            <div className="flex items-center gap-1 mt-1 font-medium italic">
                                                                <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                                                <span className="truncate">{order.address?.area || order.address?.city || "No Area"}</span>
                                                            </div>
                                                        </button>

                                                        {/* Coordinates */}
                                                        {(order.address?.lat !== undefined && order.address?.lng !== undefined) && (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleCopy(`${order.address?.lat},${order.address?.lng}`, "Coordinates")}
                                                                    className="text-theme-sm font-bold text-gray-400 hover:text-brand-500 transition-colors block text-left pt-1"
                                                                >
                                                                    {order.address?.lat?.toFixed(5)}, {order.address?.lng?.toFixed(5)}
                                                                </button>
                                                                {copiedText === `${order.address?.lat},${order.address?.lng}` && (
                                                                    <Check size={10} className="text-success-500 animate-in fade-in zoom-in duration-200" />
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Delivery Phone Number (Optional) */}
                                                        {order.address?.phoneNumber && (
                                                            <div className="flex items-center gap-2 pt-1 border-t border-gray-50 dark:border-gray-800 mt-1">
                                                                <div className="p-1 bg-brand-50 dark:bg-brand-500/10 rounded-md">
                                                                    <Phone size={10} className="text-brand-500" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-tighter">Delivery Contact</span>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <button
                                                                            onClick={() => handleCopy(order.address!.phoneNumber!, "Delivery Phone")}
                                                                            className="text-theme-xs font-bold text-brand-600 hover:text-brand-700 transition-colors block text-left leading-none"
                                                                        >
                                                                            {order.address.phoneNumber}
                                                                        </button>
                                                                        <a
                                                                            href={getWhatsAppLink(order.address.phoneNumber, getStatusMessage(order, "user"))}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="p-1 px-1.5 bg-success-50 text-success-600 rounded-md hover:bg-success-600 hover:text-white transition-all border border-success-100 flex items-center gap-1"
                                                                        >
                                                                            <MessageCircle size={10} className="fill-current" />
                                                                            <span className="text-[8px] font-black uppercase text-success-600 group-hover:text-white">WA</span>
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Stats & Meta */}
                                                    <div className="space-y-2 pt-1">
                                                        <div className="flex items-center gap-1.5 py-1">
                                                            <div 
                                                                className="flex items-center justify-center min-w-[28px] h-7 px-1.5 bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/30 rounded-lg"
                                                                title="Active/Completed Orders"
                                                            >
                                                                <span className="text-sm font-black text-success-600 dark:text-success-400">
                                                                    {order.userInfo?.activeOrderCount ?? 0}
                                                                </span>
                                                            </div>
                                                            <div className="text-gray-200 dark:text-gray-800 text-[10px] font-black">/</div>
                                                            <div 
                                                                className="flex items-center justify-center min-w-[28px] h-7 px-1.5 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 rounded-lg"
                                                                title="Cancelled Orders"
                                                            >
                                                                <span className="text-sm font-black text-error-600 dark:text-error-400">
                                                                    {order.userInfo?.cancelledOrderCount ?? 0}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Link
                                                            href={`/users/${order.userId}`}
                                                            className="block text-[10px] text-gray-400 font-mono tracking-tighter truncate max-w-[140px] hover:text-brand-500 hover:underline transition-colors"
                                                            title="View User Details"
                                                        >
                                                            {order.userId}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </TableCell>




                                            {/* Logistics */}
                                            <TableCell className="px-4 py-3 text-start">
                                                <div className="space-y-4 text-theme-xs min-w-[180px]">
                                                    <div className="space-y-2 pb-2 border-b border-gray-50 dark:border-gray-800">
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                {(() => {
                                                                    const customerAsksStr = typeof order.customerAsks === "string" ? order.customerAsks : "";
                                                                    const match = customerAsksStr.match(/\[Pickup Schedule:\s*([^\]]+)\]/i);
                                                                    const parsedPickupSchedule = match ? match[1] : null;
                                                                    const hasSchedule = parsedPickupSchedule || order.pickupScheduledAt;
                                                                    const effectivePickupType = hasSchedule ? "scheduled" : order.pickupType;
                                                                    const timeDisplay = parsedPickupSchedule || (order.pickupScheduledAt ? formatDate(order.pickupScheduledAt) : null);
                                                                    
                                                                    return (
                                                                        <>
                                                                            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                                                <div className={`w-1.5 h-1.5 rounded-full ${effectivePickupType === 'scheduled' ? 'bg-brand-500' : 'bg-warning-500'}`} />
                                                                                Pickup: {effectivePickupType}
                                                                            </div>
                                                                            {timeDisplay && (
                                                                                <div className="font-medium text-gray-800 dark:text-white/90">{timeDisplay}</div>
                                                                            )}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <button
                                                                    onClick={() => onTriggerPorter(order.orderId, "pickup")}
                                                                    disabled={!!isPorterLoading[`${order.orderId}_pickup`]}
                                                                    className="p-1.5 bg-brand-50 text-brand-600 rounded-md hover:bg-brand-500 hover:text-white transition-all border border-brand-100 dark:bg-brand-500/10 dark:border-brand-500/20"
                                                                    title="Trigger Porter Pickup"
                                                                >
                                                                    {isPorterLoading[`${order.orderId}_pickup`] === "pickup" ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                                                                </button>
                                                                <button
                                                                    onClick={() => onCancelPorter(order.orderId, "pickup")}
                                                                    disabled={!!isPorterLoading[`${order.orderId}_pickup`]}
                                                                    className="p-1.5 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-500 hover:text-white transition-all border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20"
                                                                    title="Cancel Porter Pickup"
                                                                >
                                                                    {isPorterLoading[`${order.orderId}_pickup`] === "pickup" ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {order.receivedAtShop && (
                                                        <div className="space-y-2 pb-2 border-b border-gray-50 dark:border-gray-800">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                    In Shop
                                                                </div>
                                                                <div className="font-medium text-gray-800 dark:text-white/90">{formatDate(order.receivedAtShop)}</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="space-y-2 pb-2 border-b border-gray-50 dark:border-gray-800">
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-success-500" />
                                                                    Delivery
                                                                </div>
                                                                <div className="font-medium text-gray-800 dark:text-white/90">
                                                                    {order.deliveredAt ? formatDate(order.deliveredAt) : (order.deliveryScheduledAt ? formatDate(order.deliveryScheduledAt) : "TBD")}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <button
                                                                    onClick={() => onTriggerPorter(order.orderId, "delivery")}
                                                                    disabled={!!isPorterLoading[`${order.orderId}_delivery`]}
                                                                    className="p-1.5 bg-brand-50 text-brand-600 rounded-md hover:bg-brand-500 hover:text-white transition-all border border-brand-100 dark:bg-brand-500/10 dark:border-brand-500/20"
                                                                    title="Trigger Porter Delivery"
                                                                >
                                                                    {isPorterLoading[`${order.orderId}_delivery`] === "delivery" ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                                                                </button>
                                                                <button
                                                                    onClick={() => onCancelPorter(order.orderId, "delivery")}
                                                                    disabled={!!isPorterLoading[`${order.orderId}_delivery`]}
                                                                    className="p-1.5 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-500 hover:text-white transition-all border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20"
                                                                    title="Cancel Porter Delivery"
                                                                >
                                                                    {isPorterLoading[`${order.orderId}_delivery`] === "delivery" ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-1">
                                                        <Link
                                                            href={`/orders/${order.orderId}/porter`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 text-[10px] font-black text-brand-500 uppercase tracking-widest hover:text-brand-600 transition-colors"
                                                        >
                                                            <ExternalLink size={10} />
                                                            Track Porter Details
                                                        </Link>
                                                    </div>
                                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                                                        <LogisticsToggleCell 
                                                            orderId={order.orderId} 
                                                            initialValue={!!order.isShopLogistics} 
                                                        />
                                                        <ChatToggleCell 
                                                            orderId={order.orderId} 
                                                            initialValue={order.isShopChatEnabled !== false} 
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Notes (Moved forward) */}
                                            <TableCell className="px-4 py-3 text-start">
                                                <div className="space-y-3 min-w-[200px]">
                                                    {order.status === "cancelled" && order.cancelReason && (
                                                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-2 rounded-lg">
                                                            <div className="text-[10px] font-black text-red-600 mb-1 uppercase tracking-tighter">Cancellation Reason</div>
                                                            <p className="text-theme-xs text-red-800 dark:text-red-400 font-bold leading-tight">{order.cancelReason}</p>
                                                        </div>
                                                    )}
                                                    {(() => {
                                                        const actualNotes = (order.customerAsks || "").replace(/\[.*?\]/g, "").trim();
                                                        if (!actualNotes) return null;
                                                        return (
                                                            <div className="bg-warning-50 dark:bg-warning-500/10 border border-warning-100 dark:border-warning-500/20 p-2 rounded-lg">
                                                                <div className="text-theme-xs font-medium text-warning-600 mb-1">User Note</div>
                                                                <p className="text-theme-xs text-warning-800 dark:text-warning-400 leading-tight italic">"{actualNotes}"</p>
                                                            </div>
                                                        );
                                                    })()}
                                                    <div className="space-y-1">
                                                        <div className="text-theme-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Admin Note</div>
                                                        <AdminNotesCell orderId={order.orderId} initialNotes={order.adminNotes} />
                                                    </div>

                                                    {/* Rapido OTP — shown for all non-terminal orders */}
                                                    {!["delivered", "cancelled", "payment_pending"].includes(order.status) && (
                                                        <div className="space-y-1 pt-1">
                                                            <div className="text-theme-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Rapido OTP</div>
                                                            <RapidoOtpCell
                                                                orderId={order.orderId}
                                                                initialOtp={order.rapidoOtp}
                                                                initialRiderName={order.rapidoRiderName}
                                                                initialBookingId={order.rapidoBookingId}
                                                                initialPayoutAmount={order.deliveryPayoutAmount}
                                                                status={order.status}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Financial Audit (Moved forward) */}
                                            <TableCell className="px-4 py-3 text-start">
                                                <div className="space-y-4 min-w-[240px]">
                                                    {/* User Inflow */}
                                                    <div className="p-3 bg-gray-50/50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/[0.05] space-y-2">
                                                        <div className="flex justify-between items-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-white/[0.05] pb-1.5">
                                                            User Inflow
                                                            <span className="text-gray-900 dark:text-white uppercase">Inflow</span>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                                                                <span>Original Base</span>
                                                                <span className="font-medium text-gray-800 dark:text-white/90">₹{(order.baseAmount || 0).toFixed(2)}</span>
                                                            </div>
                                                            {order.multiplierBreakdown && Object.keys(order.multiplierBreakdown).length > 0 ? (
                                                                Object.values(order.multiplierBreakdown).map((item: any, idx: number) => (
                                                                    <div key={idx} className="flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                                                                        <span>{item.label}</span>
                                                                        <span className="font-medium text-gray-500 dark:text-gray-400 font-mono">+₹{(item.amount || 0).toFixed(2)}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                !order.multiplierBreakdown && (order.multiplierUpcharge || 0) !== 0 && (
                                                                    <div className="flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                                                                        <span>{order.multiplierLabel || "Priority Fee"}</span>
                                                                        <span className="font-medium text-gray-500 dark:text-gray-400 font-mono">+₹{(order.multiplierUpcharge || 0).toFixed(2)}</span>
                                                                    </div>
                                                                )
                                                            )}
                                                            <div className="flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                                                                <span>Logistics Fee</span>
                                                                <span className="font-medium text-gray-500 dark:text-gray-400 font-mono">+₹{(order.deliveryCharges || 0).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                                                                <span>Tax Amount</span>
                                                                <span className="font-medium text-gray-500 dark:text-gray-400 font-mono">+₹{(order.taxAmount || 0).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                                                                <span>Low Cart Fee</span>
                                                                <span className="font-medium text-gray-500 dark:text-gray-400 font-mono">+₹{(order.lowCartFee || 0).toFixed(2)}</span>
                                                            </div>
                                                            {(order.discountAmount || 0) > 0 && (
                                                                <div className="flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                                                                    <span>Admin Discount</span>
                                                                    <span className="font-medium text-gray-500 dark:text-gray-400 font-mono">-₹{(order.discountAmount || 0).toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                            {(order.shopDiscountAmount || 0) > 0 && (
                                                                <div className="flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                                                                    <span>Shop Discount</span>
                                                                    <span className="font-medium text-gray-500 dark:text-gray-400 font-mono">-₹{(order.shopDiscountAmount || 0).toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                            {!(order.discountAmount || 0) && !(order.shopDiscountAmount || 0) && (
                                                                <div className="flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                                                                    <span>Discount</span>
                                                                    <span className="font-medium text-gray-500 dark:text-gray-400 font-mono">-₹0.00</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                                                                <span>Wallet Amount Used</span>
                                                                <span className="font-medium text-gray-500 dark:text-gray-400 font-mono">-₹{(order.walletAmountUsed || 0).toFixed(2)}</span>
                                                            </div>
                                                            {(order.ezyAmountUsed || 0) > 0 && (
                                                            <div className="flex justify-between text-theme-xs text-purple-500 dark:text-purple-400">
                                                                <span>⚡ EZY Tokens</span>
                                                                <span className="font-medium font-mono">-₹{(order.ezyAmountUsed || 0).toFixed(2)}</span>
                                                            </div>
                                                            )}
                                                            <div className="flex justify-between pt-1.5 border-t border-gray-100 dark:border-white/[0.05]">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Grand Total</span>
                                                                <span className="text-theme-sm font-black text-gray-900 dark:text-white">₹{(order.grandTotalPaid || 0).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-gray-50/50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/[0.05] space-y-2">
                                                        <div className="flex justify-between items-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-white/[0.05] pb-1.5">
                                                            Payment Status
                                                            <span className="text-gray-900 dark:text-white uppercase">Status</span>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-[11px] font-black uppercase pt-1">
                                                                <span className="text-gray-400 dark:text-gray-500">Already Paid:</span>
                                                                {(() => {
                                                                    const amountPaid = order.amountPaid || 0;
                                                                    const grandTotal = order.grandTotalPaid || 0;
                                                                    const isFullyPaid = amountPaid >= grandTotal - 0.05;
                                                                    const isUnpaid = amountPaid <= 0;

                                                                    const colorClass = isFullyPaid
                                                                        ? "text-emerald-600 dark:text-emerald-500"
                                                                        : isUnpaid
                                                                        ? "text-rose-500 dark:text-rose-400"
                                                                        : "text-amber-600 dark:text-amber-500";

                                                                    return (
                                                                        <span className={`${colorClass} tracking-tight font-black`}>
                                                                            ₹{amountPaid.toFixed(2)}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                            {/* Pending / Overpaid Amount Row */}
                                                            {(() => {
                                                                const amountPaid = order.amountPaid || 0;
                                                                const grandTotal = order.grandTotalPaid || 0;
                                                                const pending = Math.max(0, grandTotal - amountPaid);
                                                                const overpaid = Math.max(0, amountPaid - grandTotal);
                                                                
                                                                if (pending > 0.05) {
                                                                    return (
                                                                        <div className="flex justify-between text-[11px] font-black uppercase pt-1">
                                                                            <span className="text-gray-400 dark:text-gray-500">Pending Amount:</span>
                                                                            <span className="text-rose-600 dark:text-rose-500 tracking-tight font-black">
                                                                                ₹{pending.toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }
                                                                if (overpaid > 0.05) {
                                                                    return (
                                                                        <div className="flex justify-between text-[11px] font-black uppercase pt-1">
                                                                            <span className="text-gray-400 dark:text-gray-500">Overpaid:</span>
                                                                            <span className="text-indigo-600 dark:text-indigo-500 tracking-tight font-black">
                                                                                ₹{overpaid.toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}

                                                            {/* Payment Status Badge */}
                                                            <div className="pt-2">
                                                                {(() => {
                                                                    const amountPaid = order.amountPaid || 0;
                                                                    const grandTotal = order.grandTotalPaid || 0;

                                                                    const isOverpaid = amountPaid > grandTotal + 0.05;
                                                                    const isFullyPaid = !isOverpaid && amountPaid >= grandTotal - 0.05;
                                                                    const isUnpaid = amountPaid <= 0;
                                                                    const isPartial = !isFullyPaid && !isOverpaid && !isUnpaid;

                                                                    let badgeStyles = "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 border-rose-100 dark:border-rose-500/20";
                                                                    let statusLabel = "Unpaid";

                                                                    if (isOverpaid) {
                                                                        badgeStyles = "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border-indigo-100 dark:border-indigo-500/20";
                                                                        statusLabel = "OVERPAID (WAIT REFUND)";
                                                                    } else if (isFullyPaid) {
                                                                        badgeStyles = "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-100 dark:border-emerald-500/20";
                                                                        statusLabel = "Fully Paid";
                                                                    } else if (isPartial) {
                                                                        badgeStyles = "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-100 dark:border-amber-500/20";
                                                                        statusLabel = "Partial Pay";
                                                                    }

                                                                    return (
                                                                        <div className="space-y-2 pt-1">
                                                                            <div className={`w-full py-1 rounded-[6px] text-[10px] font-black text-center uppercase tracking-widest border transition-all ${badgeStyles}`}>
                                                                                {statusLabel}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Total Flow Summary */}
                                                    <div className="p-3 bg-gray-50/50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/[0.05] space-y-2">
                                                        <div className="flex justify-between items-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-white/[0.05] pb-1.5">
                                                            Total Flow
                                                            <span className="text-gray-900 dark:text-white uppercase">Flow</span>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                                                                <span>User Order Value</span>
                                                                <span className="font-medium text-gray-500 dark:text-gray-400">+₹{(order.grandTotalPaid || 0).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                                                                <span>Porter/Rapido Cost</span>
                                                                <span className="font-medium text-gray-500 dark:text-gray-400">-₹{(order.logisticsCost || 0).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-theme-xs text-gray-500 dark:text-gray-400">
                                                                <span>Shop Logistics Cost</span>
                                                                <span className="font-medium text-gray-500 dark:text-gray-400">-₹{(order.shopLogisticsCost || 0).toFixed(2)}</span>
                                                            </div>
                                                            <div className={`flex justify-between text-theme-xs text-gray-500 dark:text-gray-400`}>
                                                                <span>Compensations</span>
                                                                <span className={order.compensationAmount ? 'font-medium text-gray-500 dark:text-gray-400' : ''}>-₹{(order.compensationAmount || 0).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Profit Summary */}
                                                    <div className="p-3 bg-gray-900 dark:bg-white border border-gray-800 dark:border-white rounded-xl flex justify-between items-center px-4">
                                                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Net Profit</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-gray-500 dark:text-gray-400 text-sm font-black italic">₹</span>
                                                            <span className={`text-[15px] font-black ${(order?.netProfit ?? ((order.grandTotalPaid || 0) - (order.logisticsCost || 0) - (order.shopLogisticsCost || 0) - (order.compensationAmount || 0))) >= 0 ? "text-white dark:text-gray-950" : "text-gray-400"}`}>
                                                                {(order?.netProfit ?? ((order.grandTotalPaid || 0) - (order.logisticsCost || 0) - (order.shopLogisticsCost || 0) - (order.compensationAmount || 0))).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Cart Items (Pushed back) */}
                                            <TableCell className="px-4 py-3 text-start align-top">
                                                <div className="space-y-4 min-w-[540px] max-w-4xl">
                                                    {/* Snapshot (History) at the top if exists */}
                                                    {order.reviewSnapshot?.services?.length && (
                                                        <div className="space-y-4">
                                                            <OrderServiceView 
                                                                services={order.reviewSnapshot.services} 
                                                                title="Original Order (Snapshot)" 
                                                                themeColor="gray" 
                                                            />
                                                            <div className="flex justify-center -my-2 relative z-10">
                                                                <div className="bg-white dark:bg-gray-900 p-1 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm">
                                                                    <ArrowDown size={12} className="text-brand-500" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-4">
                                                        {/* LEFT SIDE: Lead Shop Payout */}
                                                        <div className="flex-1">
                                                            <OrderServiceView 
                                                                services={order.services} 
                                                                title="Lead Shop Payout" 
                                                                themeColor="amber" 
                                                                showShopPrices
                                                            />
                                                        </div>

                                                        {/* RIGHT SIDE: Customer Bill */}
                                                        <div className="flex-1">
                                                            <OrderServiceView 
                                                                services={order.services} 
                                                                title={order.reviewSnapshot?.services?.length ? "Current Customer Bill" : "Customer Bill"} 
                                                                themeColor="brand" 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* B2B Fulfillment (Pushed back) */}
                                            <TableCell className="px-4 py-3 text-start align-top">
                                                <div className="space-y-4 min-w-[540px] max-w-4xl">
                                                    {order.fulfillmentCart && order.fulfillmentCart.length > 0 ? (
                                                        <div className="flex gap-4">
                                                            {/* LEFT SIDE: Fulfillment Shop Payout */}
                                                            <div className="flex-1">
                                                                <OrderServiceView 
                                                                    services={order.fulfillmentCart} 
                                                                    title="Fulfillment Payout" 
                                                                    themeColor="amber"
                                                                    showShopPrices
                                                                />
                                                            </div>
                                                            {/* RIGHT SIDE: What user would have paid at this shop */}
                                                            <div className="flex-1">
                                                                <OrderServiceView 
                                                                    services={order.fulfillmentCart} 
                                                                    title="Fulfillment User Bill" 
                                                                    themeColor="brand"
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-gray-50/50 dark:bg-white/[0.01] border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center text-center opacity-40">
                                                            <RefreshCw size={24} className="text-gray-300 mb-3" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Not Transferred</span>
                                                            <p className="text-[9px] text-gray-400 mt-1 max-w-[150px]">Fulfillment cart is only built after B2B transfer.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>



                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell className="px-4 py-20 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            {isLoading ? (
                                                <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
                                            ) : (
                                                <>
                                                    <Search className="w-8 h-8 text-gray-200" />
                                                    <span className="text-gray-400 font-medium">No orders found matching your search.</span>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default OrderTable;
