"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, RefreshCw, Check, Search, ChevronsUpDown } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import { Order } from "@/types/order";
import { getAllShops } from "@/lib/actions/shops";
import { reassignOrder } from "@/lib/actions/orders";
import { Shop } from "@/types/Shop";
import { useRouter } from "next/navigation";

interface ReassignOrderModalProps {
    order: Order;
    onClose: () => void;
}

const ReassignOrderModal = ({ order, onClose }: ReassignOrderModalProps) => {
    const router = useRouter();
    const [shops, setShops] = useState<Shop[]>([]);
    const [loadingShops, setLoadingShops] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
    const [formData, setFormData] = useState({
        toShopId: "",
        reason: "high_logistics_cost",
        notes: "",
        notifyUser: false,
    });

    useEffect(() => {
        async function fetchShops() {
            try {
                let allFetchedShops: Shop[] = [];
                let currentLastKey: string | undefined = undefined;
                
                // Fetch all shops handling pagination
                do {
                    const { shops: fetchedShops, nextKey } = await getAllShops(100, currentLastKey);
                    if (fetchedShops && fetchedShops.length > 0) {
                        allFetchedShops = [...allFetchedShops, ...fetchedShops];
                    }
                    currentLastKey = nextKey;
                } while (currentLastKey);

                // Filter out the current shop and only show approved shops
                setShops(allFetchedShops.filter(s => s.shopId !== order.shopId && s.status === "approved"));
            } catch (err) {
                console.error("Failed to fetch shops", err);
            } finally {
                setLoadingShops(false);
            }
        }
        fetchShops();
    }, [order.shopId]);

    const filteredShops = shops.filter(s => {
        const searchTerms = searchTerm.toLowerCase();
        return s.name.toLowerCase().includes(searchTerms) ||
               (s.address && s.address.locality && s.address.locality.toLowerCase().includes(searchTerms)) ||
               (s.citySlug && s.citySlug.toLowerCase().includes(searchTerms)) ||
               s.shopId.toLowerCase().includes(searchTerms);
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.toShopId) return;

        setSubmitting(true);
        try {
            const shop = shops.find(s => s.shopId === formData.toShopId);
            const res = await reassignOrder(order.orderId, {
                ...formData,
                toShopName: shop?.name || "Unknown Shop",
            });

            if (res.success) {
                router.refresh();
                onClose();
            } else {
                alert(res.error || "Failed to reassign order");
            }
        } catch (err: any) {
            alert(err.message || "An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <RefreshCw className="size-5 text-brand-500" /> Reassign Order
                        </h3>
                        <p className="text-xs font-bold text-gray-400">Current fulfilling shop: {order.shopName || order.shopId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Fulfilling Shop</label>
                        {loadingShops ? (
                            <div className="flex items-center gap-2 p-3 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <Loader2 className="animate-spin size-4" /> Loading available partners...
                            </div>
                        ) : (
                            <div className="relative flex flex-col gap-2">
                                <div 
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm flex justify-between items-center cursor-pointer transition-colors hover:border-brand-300 dark:hover:border-gray-600 shadow-theme-xs"
                                    onClick={() => setIsShopDropdownOpen(!isShopDropdownOpen)}
                                >
                                    {formData.toShopId ? (
                                        <div className="font-medium text-gray-900 dark:text-white truncate">
                                            {shops.find(s => s.shopId === formData.toShopId)?.name} 
                                            <span className="text-gray-400 font-normal ml-2">
                                                ({shops.find(s => s.shopId === formData.toShopId)?.address?.locality || shops.find(s => s.shopId === formData.toShopId)?.shopId.slice(0, 6)})
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">Select a partner shop...</span>
                                    )}
                                    <ChevronsUpDown size={16} className="text-gray-400 shrink-0 ml-2" />
                                </div>

                                {isShopDropdownOpen && (
                                    <div className="absolute top-[calc(100%+8px)] left-0 w-full z-10 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                                        <div className="p-2 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-white/[0.02]">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    placeholder="Search partner by name, ID or locality..." 
                                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all dark:text-white/90 placeholder:text-gray-400 shadow-sm"
                                                    value={searchTerm}
                                                    onChange={e => setSearchTerm(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-600">
                                            {filteredShops.map(s => (
                                                <div 
                                                    key={s.shopId} 
                                                    onClick={() => {
                                                        setFormData(p => ({ ...p, toShopId: s.shopId }));
                                                        setIsShopDropdownOpen(false);
                                                        setSearchTerm("");
                                                    }}
                                                    className={`p-3 border-b border-gray-50 dark:border-gray-700/50 last:border-b-0 cursor-pointer flex justify-between items-center transition-colors ${formData.toShopId === s.shopId ? 'bg-brand-50/50 dark:bg-brand-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                                                >
                                                    <div className="min-w-0 pr-4">
                                                        <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{s.name}</div>
                                                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                            {s.address?.locality || s.citySlug || s.shopId.slice(0, 6)} • ID: {s.shopId.slice(0, 8)}
                                                        </div>
                                                    </div>
                                                    {formData.toShopId === s.shopId && <Check className="text-brand-500 size-4 shrink-0" />}
                                                </div>
                                            ))}
                                            {filteredShops.length === 0 && (
                                                <div className="p-6 text-center text-sm font-medium text-gray-400">
                                                    No shops match your search.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <p className="text-[10px] text-gray-400 ml-1 italic">* Only approved shops are listed.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for Reassignment</label>
                        <Select
                            options={[
                                { value: "high_logistics_cost", label: "Reduce Logistics Cost (Closer to user)" },
                                { value: "shop_unfulfilled", label: "Shop Unable to Fulfill" },
                                { value: "admin_reassignment", label: "Manual Override / Admin Choice" },
                            ]}
                            defaultValue={formData.reason}
                            onChange={(val) => setFormData(prev => ({ ...prev, reason: val }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Internal Notes (Optional)</label>
                        <textarea
                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-500/10 transition-all outline-none resize-none h-24"
                            placeholder="Why are you moving this order? (Internal use only)"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-brand-50/50 dark:bg-brand-500/5 rounded-2xl border border-brand-100 dark:border-brand-500/10">
                        <input
                            type="checkbox"
                            id="notifyUser"
                            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                            checked={formData.notifyUser}
                            onChange={(e) => setFormData(prev => ({ ...prev, notifyUser: e.target.checked }))}
                        />
                        <label htmlFor="notifyUser" className="text-xs font-bold text-gray-600 dark:text-brand-400 cursor-pointer select-none">
                            Notify customer about the shop change via Push
                        </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 font-black uppercase tracking-widest"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 font-black uppercase tracking-widest"
                            disabled={!formData.toShopId || submitting}
                        >
                            {submitting ? "Processing..." : "Confirm Transfer"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReassignOrderModal;
