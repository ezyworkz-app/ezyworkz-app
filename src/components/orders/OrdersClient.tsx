"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Order } from "@/types/order";
import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import { X, Search, RefreshCw, Check, ChevronDown, Calendar, Filter, ArrowUp, ArrowDown } from "lucide-react";
import {
    updateOrderStatus,
    updateOrderPaymentStatus,
    updateOrderFinancials,
    getAllOrders,
    triggerPorterAction,
    cancelPorterAction,
    refundOverpaidAmount,
    refundViaCashfree,
    refundManual,
    deleteOrder,
} from "@/lib/actions/orders";
import ReassignOrderModal from "./ReassignOrderModal";
import OrderTabs from "./OrderTabs";
import { Conversation, Message, createOrGetConversation, getConversationMessages } from "@/lib/actions/chat";
import ChatWindow from "../chat/ChatWindow";
import Pagination from "../tables/Pagination";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import { getAllShops } from "@/lib/actions/shops";
// Import from @/types (not @/types/Shop): ShopContext returns that shape, and
// the two Shop declarations are structurally incompatible.
import { Shop } from "@/types";
import { useShop } from "@/context/ShopContext";

const TabButton = ({
    active,
    onClick,
    label,
    count,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    count: number;
}) => (
    <button
        onClick={onClick}
        className={`shrink-0 py-3 px-4 text-xs font-bold transition-all duration-200 flex items-center gap-2 relative whitespace-nowrap ${active
            ? "text-brand-500"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
    >
        {label}
        {count !== undefined && (
            <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-black ${active ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
            >
                {count}
            </span>
        )}
        {active && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
        )}
    </button>
);

const OrdersClient = ({ 
    initialOrders, 
    initialNextKey, 
    initialTotalCount,
    initialGlobalCounts,
    initialStatusCounts
}: { 
    initialOrders: Order[], 
    initialNextKey?: string, 
    initialTotalCount: number,
    initialGlobalCounts: Record<string, number>,
    initialStatusCounts?: Record<string, number>
}) => {
    const router = useRouter();
    
    // Core Data State
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [globalCounts, setGlobalCounts] = useState(initialGlobalCounts);
    const [statusCounts, setStatusCounts] = useState(initialStatusCounts || initialGlobalCounts);
    // Start as loading=true when no initial data is passed (client-only fetch path)
    const [isLoading, setIsLoading] = useState(initialOrders.length === 0);
    const [shopsMap, setShopsMap] = useState<Record<string, Shop>>({});
    
    // Auth / Shop Context
    const { selectedShopId, selectedShop, isLoading: isShopLoading } = useShop();
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [pageKeys, setPageKeys] = useState<Record<number, string | undefined>>({ 1: undefined, 2: initialNextKey });
    const [totalCount, setTotalCount] = useState(initialTotalCount);
    
    // Filter State
    const [selectedTab, setSelectedTab] = useState<
        "all" | "user_unpaid" | "user_paid" | "shop_unpaid" | "shop_paid" | "cancelled" | "wait_refund" | "uncollectible"
    >("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("waiting_confirmation");
    
    // Status Tabs Mapping
    const statusTabs: (Order["status"] | "scheduled" | "uncollectible" | "wait_refund" | "all")[] = [
        "waiting_confirmation",
        "payment_pending",
        "confirmed",
        "in_pickup",
        "in_process",
        "waiting_user_review",
        "ready_to_deliver",
        "scheduled",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "all"
    ];

    const [priorityTab, setPriorityTab] = useState<"all" | "standard" | "oneDay" | "express">("all");
    const [sourceFilter, setSourceFilter] = useState<"all" | "user" | "store">("all");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [searchType, setSearchType] = useState<"all" | "user" | "shop">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityCounts, setPriorityCounts] = useState<Record<string, number>>({
        all: 0,
        standard: 0,
        oneDay: 0,
        express: 0,
    });
    const [filters, setFilters] = useState({
        shopId: "",
        userId: "",
    });

    // UI State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [activeSection, setActiveSection] = useState<
        "status" | "payment" | "financials" | "chat" | "reassign"
    >("status");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFormSubmitting, setIsFormSubmitting] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Record<string, boolean>>({});
    const [isPorterLoading, setIsPorterLoading] = useState<Record<string, "pickup" | "delivery" | null>>({});
    const [isStatusUpdating, setIsStatusUpdating] = useState<Record<string, boolean>>({});
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [formState, setFormState] = useState({
        status: "",
        paymentStatus: "",
    });
    const [additionalLogistics, setAdditionalLogistics] = useState(0);

    // Chat states
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);


    // Scroll to Top state
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const fetchOrdersForPage = async (
        pageNumber: number, 
        currentFilters: typeof filters, 
        categoryTab: string,
        statusTab: string,
        sOrder: "asc" | "desc",
        prio: string,
        query?: string,
        uSearch?: string,
        sSearch?: string,
        srcFilter?: string
    ) => {
        setIsLoading(true);
        try {
            const key = pageNumber === 1 ? undefined : pageKeys[pageNumber];
            
            const effectiveStatus = statusTab === "all" ? undefined : statusTab;
            const effectiveCategory = categoryTab === "all" ? undefined : categoryTab;
            
            const { orders: newOrders, nextKey: newKey, totalCount: newTotal, globalCounts: newGlobal, statusCounts: newStatusCounts, priorityCounts: newPriorityCounts } = await getAllOrders(
                10, 
                key, 
                effectiveStatus, 
                currentFilters.shopId, 
                currentFilters.userId,
                effectiveCategory,
                sOrder,
                prio,
                query,
                uSearch,
                sSearch,
                srcFilter
            );
            
            setOrders(newOrders);
            setTotalCount(newTotal);
            setGlobalCounts(newGlobal);
            setStatusCounts(newStatusCounts || newGlobal);
            setPriorityCounts(newPriorityCounts);
            if (newKey) {
                setPageKeys(prev => ({ ...prev, [pageNumber + 1]: newKey }));
            }
            setPage(pageNumber);
        } catch (e) {
            console.error("Fetch orders failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch shops for mapping on mount (Disabled for shop portal)
    useEffect(() => {
        // Shop portal only has one shop context
        if (selectedShopId && selectedShop) {
            setShopsMap({
                [selectedShopId]: selectedShop
            });
        } else {
            setShopsMap({});
        }
    }, [selectedShopId, selectedShop]);

    // Consolidated Fetch Logic: Triggered on any filter/search/tab change
    useEffect(() => {
        if (isShopLoading) return;
        
        if (!selectedShopId) {
            // User has no shop or shop failed to load
            setOrders([]);
            setTotalCount(0);
            setIsLoading(false);
            return;
        }

        const timeout = setTimeout(() => {
            setPage(1);
            setPageKeys({ 1: undefined });
            
            const q = searchType === "all" ? searchQuery : undefined;
            const u = searchType === "user" ? searchQuery : undefined;
            const s = searchType === "shop" ? searchQuery : undefined;
            const src = sourceFilter === "all" ? undefined : sourceFilter;

            fetchOrdersForPage(1, { ...filters, shopId: selectedShopId }, selectedTab, selectedStatus, sortOrder, priorityTab, q, u, s, src);
        }, 500);

        return () => clearTimeout(timeout);
    }, [selectedTab, selectedStatus, filters.shopId, filters.userId, sortOrder, priorityTab, searchQuery, searchType, selectedShopId, isShopLoading, sourceFilter]);

    const handlePageChange = (newPage: number) => {
        if (newPage === page) return;
        const q = searchType === "all" ? searchQuery : undefined;
        const u = searchType === "user" ? searchQuery : undefined;
        const s = searchType === "shop" ? searchQuery : undefined;
        const src = sourceFilter === "all" ? undefined : sourceFilter;
        fetchOrdersForPage(newPage, { ...filters, shopId: selectedShopId || filters.shopId }, selectedTab, selectedStatus, sortOrder, priorityTab, q, u, s, src);
    };

    const handleManualRefresh = () => {
        const q = searchType === "all" ? searchQuery : undefined;
        const u = searchType === "user" ? searchQuery : undefined;
        const s = searchType === "shop" ? searchQuery : undefined;
        const src = sourceFilter === "all" ? undefined : sourceFilter;
        fetchOrdersForPage(page, { ...filters, shopId: selectedShopId || filters.shopId }, selectedTab, selectedStatus, sortOrder, priorityTab, q, u, s, src);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    const handleTabChange = (tab: typeof selectedTab) => {
        setSelectedTab(tab);
        setSelectedStatus("all"); // Reset status filter when switching main tabs
        setPage(1);
        setPageKeys({ 1: undefined });
    };

    const handleStatusChange = (statusIndex: number) => {
        const newStatus = statusTabs[statusIndex];
        let effectiveCategory = selectedTab;
        let effectiveStatus = newStatus;

        if (newStatus === "scheduled") {
            effectiveStatus = "all";
            effectiveCategory = "scheduled" as any;
            setSelectedStatus("all");
            setSelectedTab("scheduled" as any);
        } else {
            effectiveStatus = newStatus;
            setSelectedStatus(newStatus);
            if (selectedTab === ( "scheduled" as any)) {
                effectiveCategory = "all";
                setSelectedTab("all");
            }
        }

        setPage(1);
        setPageKeys({ 1: undefined });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(f => ({ ...f, [name]: value }));
    };


    const counts = globalCounts;

    const openModal = async (
        order: Order,
        section: "status" | "payment" | "financials" | "chat" | "reassign"
    ) => {
        setSelectedOrder(order);
        setActiveSection(section);
        setFormState({
            status: order.status,
            paymentStatus: order.paymentStatus || "",
        });
        setIsModalOpen(true);

        if (section === "chat") {
            setIsChatLoading(true);
            try {
                const conv = await createOrGetConversation(order.userId, order.shopId, order.orderId);
                setConversation(conv);
                if (conv) {
                    const msgs = await getConversationMessages(conv.conversationId);
                    setChatMessages(msgs);
                }
            } catch (error) {
                console.error("Failed to load chat", error);
            } finally {
                setIsChatLoading(false);
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsFormSubmitting(false);
        setSelectedOrder(null);
        setAdditionalLogistics(0);
    };

    const handleSelectChange = (name: string, value: string) =>
        setFormState((s) => ({ ...s, [name]: value }));

    const handleTriggerPorter = async (orderId: string, type: "pickup" | "delivery") => {
        setIsPorterLoading(prev => ({ ...prev, [`${orderId}_${type}`]: type }));
        try {
            const res = await triggerPorterAction(orderId, type);
            if (res.success) {
                alert(`Porter ${type} triggered successfully!`);
            } else {
                alert(`Error: ${res.message || res.error}`);
            }
        } catch (error) {
            console.error("Porter trigger failed", error);
            alert("Unexpected error triggering Porter.");
        } finally {
            setIsPorterLoading(prev => ({ ...prev, [`${orderId}_${type}`]: null }));
        }
    };

    const handleCancelPorter = async (orderId: string, type: "pickup" | "delivery") => {
        setIsPorterLoading(prev => ({ ...prev, [`${orderId}_${type}`]: type }));
        try {
            const res = await cancelPorterAction(orderId, type);
            if (res.success) {
                alert(`Porter ${type} cancelled successfully!`);
            } else {
                alert(`Error: ${res.message || res.error}`);
            }
        } catch (error) {
            console.error("Porter cancel failed", error);
            alert("Unexpected error cancelling Porter.");
        } finally {
            setIsPorterLoading(prev => ({ ...prev, [`${orderId}_${type}`]: null }));
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm("Are you sure you want to PERMANENTLY delete this order? This action cannot be undone.")) return;

        const orderToDelete = orders.find(o => o.orderId === orderId);
        if (!orderToDelete) return;

        setIsStatusUpdating(prev => ({ ...prev, [orderId]: true }));
        try {
            const res = await deleteOrder(orderId, selectedShopId);
            if (res.error) throw new Error(res.error);

            // 1. Update Global Status Counts (Top Tabs)
            setGlobalCounts(prev => {
                const next = { ...prev };
                const status = orderToDelete.status;
                if (next[status] > 0) next[status]--;
                if (next.all > 0) next.all--;
                return next;
            });

            // 2. Update Priority Counts (Sub Tabs)
            setPriorityCounts(prev => {
                const next = { ...prev };
                const service = orderToDelete.services?.[0];
                const pKey = service?.selectedDeliveryKey || orderToDelete.multiplierLabel || "standard";
                const pKeyNormalized = pKey.toLowerCase().includes("express") ? "express" : pKey.toLowerCase().includes("oneday") ? "oneDay" : "standard";
                
                if (next[pKeyNormalized] > 0) next[pKeyNormalized]--;
                if (next.all > 0) next.all--;
                return next;
            });

            // 3. Update Total Count (Overall pagination/footer)
            setTotalCount(prev => Math.max(0, prev - 1));

            // 4. Remove from local list
            setOrders(prev => prev.filter(o => o.orderId !== orderId));

            alert("Order deleted successfully");
        } catch (err: any) {
            alert(err.message || "Failed to delete order");
        } finally {
            setIsStatusUpdating(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const onSubmitStatus = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (isFormSubmitting) return; // Prevent double clicks on form submission
        setIsFormSubmitting(true);
        
        const formData = new FormData(e.currentTarget);
        const orderId = formData.get("orderId") as string;
        const newStatus = formData.get("orderStatus") as Order["status"];
        
        // Append shopId for the shop portal API
        if (selectedShopId) {
            formData.append("shopId", selectedShopId);
        }
        
        // Block consecutive updates and show loading spinner on the table behind the modal
        setIsStatusUpdating(prev => ({ ...prev, [orderId]: true }));
        
        // 3. Background API request
        try {
            const res = await updateOrderStatus(formData);
            
            if (!res || res.error) {
                alert(`Failed to update status: ${res?.error || "Unknown error"}`);
            } else {
                // Success: Optimistic UI Update
                setOrders(prevOrders => {
                    const cancelReason = formData.get("cancelReason") as string;
                    const updatedOrders = prevOrders.map(order => 
                        order.orderId === orderId 
                            ? { ...order, status: newStatus, cancelReason: newStatus === "cancelled" ? cancelReason : order.cancelReason } 
                            : order
                    );
                    
                    const filteredOrders = updatedOrders.filter(order => {
                        if (order.orderId !== orderId) return true;
                        
                        // If we are in "Scheduled" tab, remove if now delivered or cancelled
                        if (selectedTab === ("scheduled" as any)) {
                            return order.status !== "delivered" && order.status !== "cancelled";
                        }
                        
                        // If we are in a specific status tab, remove if status changed
                        if (selectedStatus !== "all" && order.status !== selectedStatus) {
                            return false;
                        }
                        
                        return true;
                    });

                    // Update totalCount if order was removed
                    if (filteredOrders.length < updatedOrders.length) {
                        setTotalCount(prev => Math.max(0, prev - 1));
                    }

                    return filteredOrders;
                });
                
                // Adjust local counts optimistically
                if (selectedOrder) {
                    setGlobalCounts(prev => {
                        const newCounts = { ...prev };
                        // Status counts
                        if (newCounts[selectedOrder.status] > 0) newCounts[selectedOrder.status]--;
                        newCounts[newStatus] = (newCounts[newStatus] || 0) + 1;

                        // Scheduled count adjustment
                        if (selectedOrder.deliveryScheduledAt) {
                            const wasScheduled = selectedOrder.status !== "cancelled" && selectedOrder.status !== "delivered";
                            const isScheduled = newStatus !== "cancelled" && newStatus !== "delivered";
                            if (wasScheduled && !isScheduled) {
                                if (newCounts.scheduled > 0) newCounts.scheduled--;
                            } else if (!wasScheduled && isScheduled) {
                                newCounts.scheduled = (newCounts.scheduled || 0) + 1;
                            }
                        }
                        
                        return newCounts;
                    });
                }
                
                // Show a quick visual cue using alert or toast (nextjs alert for now to keep it simple)
                // We don't want an intrusive alert, but they asked for a visual cue. 
                // Since it moves to another tab, a small alert is fine, or we just close modal.
                closeModal();
            }
        } catch (error) {
            console.error("Status update failed:", error);
            alert("Unexpected error updating status.");
        } finally {
            setIsStatusUpdating(prev => ({ ...prev, [orderId]: false }));
            setIsFormSubmitting(false);
        }
    };

    const onSubmitFinancials = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isFormSubmitting) return;
        setIsFormSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const orderId = formData.get("orderId") as string;
        
        const compensationAmount = parseFloat(formData.get("compensationAmount") as string) || 0;
        const shopPayoutVal = formData.get("shopPayout");
        const shopPayout = shopPayoutVal ? parseFloat(shopPayoutVal as string) : undefined;
        const logisticsCost = parseFloat(formData.get("logisticsCost") as string) || 0;
        const shopLogisticsCost = parseFloat(formData.get("shopLogisticsCost") as string) || 0;
        const discountAmount = parseFloat(formData.get("discountAmount") as string) || 0;

        try {
            const res = await updateOrderFinancials(formData);
            if (res.success) {
                setOrders(prev => prev.map(o => o.orderId === orderId ? {
                    ...o,
                    compensationAmount,
                    ...(shopPayout !== undefined ? { shopPayout } : {}),
                    logisticsCost,
                    shopLogisticsCost,
                    discountAmount,
                    // Update net profit locally for immediate feedback (Shop perspective)
                    netProfit: (o.grandTotalPaid || 0) - logisticsCost - (shopLogisticsCost || 0) - compensationAmount
                } : o));
                closeModal();
            } else {
                alert(res.error || "Failed to update financials");
            }
        } catch (error) {
            console.error("Financials update failed", error);
            alert("An unexpected error occurred");
        } finally {
            setIsFormSubmitting(false);
        }
    };

    const { setCustomChildren } = useBreadcrumb();

    useEffect(() => {
        setCustomChildren(
            <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center gap-3 w-full">
                    <div className="flex flex-1 items-center bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all group">
                        {/* Search Type Selector */}
                        <div className="relative border-r border-gray-200 dark:border-gray-700">
                            <select
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value as any)}
                                className="h-11 pl-4 pr-8 bg-transparent text-xs font-bold text-gray-600 dark:text-gray-300 appearance-none cursor-pointer focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors uppercase tracking-wider"
                            >
                                <option value="all">Unified</option>
                                <option value="user">User</option>
                                <option value="shop">Shop</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                        </div>

                        {/* Source Filter Selector */}
                        <div className="relative border-r border-gray-200 dark:border-gray-700">
                            <select
                                value={sourceFilter}
                                onChange={(e) => setSourceFilter(e.target.value as any)}
                                className="h-11 pl-4 pr-8 bg-transparent text-xs font-bold text-gray-600 dark:text-gray-300 appearance-none cursor-pointer focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors uppercase tracking-wider"
                            >
                                <option value="all">All Sources</option>
                                <option value="user">Online</option>
                                <option value="store">Shop Placed</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                        </div>

                        {/* Main Search Input */}
                        <div className="relative flex-1 flex items-center">
                            <Search
                                className="absolute left-4 text-gray-400 group-focus-within:text-brand-500 transition-colors"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder={
                                    searchType === "all" ? "Search Order ID, Name, Phone..." :
                                    searchType === "user" ? "Search ONLY Users (Name, ID, Phone...)" :
                                    "Search ONLY Shops (Name, ID, Phone...)"
                                }
                                className="w-full h-11 pl-11 pr-10 bg-transparent text-sm focus:outline-none dark:text-gray-200 font-bold placeholder:text-gray-400/70"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        const q = searchType === "all" ? searchQuery : undefined;
                                        const u = searchType === "user" ? searchQuery : undefined;
                                        const s = searchType === "shop" ? searchQuery : undefined;
                                        fetchOrdersForPage(1, filters, selectedTab, selectedStatus, sortOrder, priorityTab, q, u, s);
                                    } else if (e.key === "Escape") {
                                        setSearchQuery("");
                                    }
                                }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <Button
                        onClick={() => router.push("/orders/create")}
                        variant="primary"
                        className="h-11 font-bold px-4 whitespace-nowrap shadow-sm"
                    >
                        Create New Order
                    </Button>
                    <Button
                        onClick={handleManualRefresh}
                        disabled={isLoading}
                        variant="outline"
                        className="h-11 border-gray-200 dark:border-gray-700 font-bold px-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                        startIcon={<RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />}
                    >
                        {isLoading ? "..." : "Refresh"}
                    </Button>
                </div>
            </div>
        );

        return () => setCustomChildren(null);
    }, [searchQuery, searchType, setCustomChildren, filters, selectedTab, selectedStatus, sortOrder, priorityTab, isLoading]);

    return (
        <div className="space-y-6">

            <div className="bg-white dark:bg-gray-900 px-6 py-4 rounded-3xl border border-gray-200 dark:border-gray-800">
                <div className="flex flex-col gap-6 w-full">
                    {/* Category Tabs */}
                    <div className="w-full">
                        <div className="md:hidden relative">
                            <select
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={selectedTab}
                                onChange={(e) => handleTabChange(e.target.value as any)}
                            >
                                <option value="all">All ({counts.all})</option>
                                <option value="user_unpaid">User Unpaid ({counts.user_unpaid})</option>
                                <option value="user_paid">User Paid ({counts.user_paid})</option>
                                <option value="wait_refund">Wait Refund ({counts.wait_refund})</option>
                                <option value="uncollectible">Bad Debt ({counts.uncollectible})</option>
                            </select>
                            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <ChevronDown size={18} />
                            </span>
                        </div>
 
                        <div className="hidden md:flex space-x-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar pb-1">
                            <TabButton active={selectedTab === "all"} onClick={() => handleTabChange("all")} label="All" count={counts.all} />
                            <TabButton active={selectedTab === "user_unpaid"} onClick={() => handleTabChange("user_unpaid")} label="User Unpaid" count={counts.user_unpaid} />
                            <TabButton active={selectedTab === "user_paid"} onClick={() => handleTabChange("user_paid")} label="User Paid" count={counts.user_paid} />
                            {/* "Shop Unpaid" / "Shop Paid" removed — shop-side
                                settlement is not tracked from this screen. The
                                underlying filters remain supported so any saved
                                link or bookmark using them still resolves. */}
                            <TabButton active={selectedTab === "wait_refund"} onClick={() => handleTabChange("wait_refund")} label="Wait Refund" count={counts.wait_refund} />
                            <TabButton active={selectedTab === "uncollectible"} onClick={() => handleTabChange("uncollectible")} label="Bad Debt" count={counts.uncollectible} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Tabs with Orders */}
            <OrderTabs
                orders={orders}
                isLoading={isLoading}
                unreadCounts={unreadCounts}
                globalCounts={statusCounts}
                priorityCounts={priorityCounts}
                activeStatus={selectedTab === ("scheduled" as any) ? "scheduled" : selectedStatus}
                priorityTab={priorityTab}
                setPriorityTab={setPriorityTab}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                statusTabs={statusTabs}
                onStatusChange={handleStatusChange}
                onEdit={(order, section) => openModal(order, section)}
                onTriggerPorter={handleTriggerPorter}
                onCancelPorter={handleCancelPorter}
                onDelete={handleDeleteOrder}
                isPorterLoading={isPorterLoading}
                isStatusUpdating={isStatusUpdating}
                shopsMap={shopsMap}
            />

            {/* Pagination Controls */}
            <div className="flex justify-center pb-12 flex-col items-center gap-4">
                {isLoading && <RefreshCw className="animate-spin text-brand-500" size={24} />}
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Showing {orders.length} of {totalCount} orders
                </div>
                <Pagination
                    currentPage={page}
                    totalPages={Math.max(1, Math.ceil(totalCount / 10))}
                    onPageChange={handlePageChange}
                />
            </div>

            {/* Edit Modals */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    {activeSection === "reassign" ? (
                        <ReassignOrderModal
                            order={selectedOrder}
                            onClose={closeModal}
                        />
                    ) : (
                        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                        {activeSection === "status" ? "Order Status" : activeSection === "payment" ? "Payment status" : activeSection === "chat" ? "Support Chat" : "Financial Audit"}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-400">Order ID: {selectedOrder.orderId}</p>
                                </div>
                                <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto w-full">
                                {activeSection === "status" && (
                                    <form
                                        onSubmit={onSubmitStatus}
                                        className="space-y-6"
                                    >
                                        <input type="hidden" name="orderId" value={selectedOrder.orderId} />
                                        <Select
                                            name="orderStatus"
                                            options={[
                                                { value: "waiting_confirmation", label: "Waiting For Confirmation" },
                                                { value: "confirmed", label: "Confirmed" },
                                                { value: "in_pickup", label: "In Pickup" },
                                                { value: "in_process", label: "In Process" },
                                                { value: "ready_to_deliver", label: "Ready to Deliver" },
                                                { value: "out_for_delivery", label: "Out For Delivery" },
                                                { value: "delivered", label: "Delivered" },
                                                { value: "waiting_user_review", label: "Waiting User Review" },
                                                { value: "payment_pending", label: "Payment Pending" },
                                                { value: "cancelled", label: "Cancelled" },
                                            ]}
                                            defaultValue={selectedOrder.status}
                                            onChange={(val) => handleSelectChange("status", val)}
                                        />

                                        {formState.status === "cancelled" && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Cancellation Reason</label>
                                                <textarea 
                                                    name="cancelReason" 
                                                    required
                                                    placeholder="Example: Price is too high, Found better price somewhere else, User changed mind..."
                                                    className="w-full bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 outline-none transition-all placeholder:text-rose-300"
                                                    rows={3}
                                                />
                                            </div>
                                        )}

                                        <Button className="w-full" type="submit" disabled={isFormSubmitting}>
                                            {isFormSubmitting ? "Updating..." : "Update Status"}
                                        </Button>
                                    </form>
                                )}

                                {activeSection === "payment" && (
                                    <form
                                        action={async (formData) => {
                                            if (isFormSubmitting) return;
                                            setIsFormSubmitting(true);
                                            try {
                                                if (selectedShopId) {
                                                    formData.append("shopId", selectedShopId);
                                                }
                                                const res = await updateOrderPaymentStatus(formData);
                                                if (res && res.success) {
                                                    const paymentStatus = formData.get("paymentStatus") as string;
                                                    let amountPaid = selectedOrder.amountPaid || 0;
                                                    if (paymentStatus === "paid") {
                                                        amountPaid = selectedOrder.grandTotalPaid || 0;
                                                    } else if (paymentStatus === "pending" || paymentStatus === "failed") {
                                                        amountPaid = 0;
                                                    }

                                                    setOrders(prev => prev.map(o => o.orderId === selectedOrder.orderId ? { 
                                                        ...o, 
                                                        paymentStatus: paymentStatus as any,
                                                        amountPaid 
                                                    } : o));
                                                    closeModal();
                                                } else {
                                                    alert(res?.error || "Failed to update payment status");
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                alert("Unexpected error updating payment status");
                                            } finally {
                                                setIsFormSubmitting(false);
                                            }
                                        }}
                                        className="space-y-6"
                                    >
                                        <input type="hidden" name="orderId" value={selectedOrder.orderId} />
                                        <Select
                                            name="paymentStatus"
                                            options={[
                                                { value: "pending", label: "Pending" },
                                                { value: "paid", label: "Paid" },
                                                { value: "uncollectible", label: "Uncollectible (Bad Debt)" },
                                                { value: "failed", label: "Failed" },
                                                { value: "refunded", label: "Refunded" },
                                                { value: "partial", label: "Partial" },
                                            ]}
                                            defaultValue={selectedOrder.paymentStatus}
                                            onChange={(val) => handleSelectChange("paymentStatus", val)}
                                        />
                                        <Button className="w-full" type="submit">Update Payment Status</Button>
                                        
                                        {(() => {
                                            const paid = (selectedOrder.amountPaid || 0) + (selectedOrder.walletAmountUsed || 0) + (selectedOrder.ezyAmountUsed || 0);
                                            const total = (selectedOrder.grandTotalPaid || 0);
                                            const isOverpaid = paid > total + 0.05;
                                            
                                            if (isOverpaid) {
                                                const overAmount = (paid - total).toFixed(2);
                                                return (
                                                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl space-y-3">
                                                        <div className="flex justify-between items-center text-amber-800 dark:text-amber-400">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Overpayment Detected</span>
                                                                <span className="text-sm font-black">₹{overAmount} Excess</span>
                                                            </div>
                                                            <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-full">
                                                                <RefreshCw size={16} />
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-amber-700 dark:text-amber-500/80 leading-snug">
                                                            This order has more money than the final total. Choose how to refund.
                                                        </p>
                                                        {(() => {
                                                            const pref = (selectedOrder as any).refundPreference as string | undefined;
                                                            if (!pref) return <p className="text-[10px] italic text-amber-600/80">Customer has not selected a refund method yet.</p>;
                                                            const label = pref === "wallet" ? "Wallet (Instant)" : pref === "original" ? "Original Payment Method" : "Manual";
                                                            return <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-500/10 rounded-lg px-2 py-1.5">Customer prefers: {label}</div>;
                                                        })()}
                                                        <Button variant="outline" className="w-full bg-white dark:bg-gray-900 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-100/50 dark:hover:bg-amber-500/10" onClick={async () => { if (confirm(`Refund Rs.${overAmount} to wallet?`)) { const res = await refundOverpaidAmount(selectedOrder.orderId); if (res.success) { alert("Wallet refund done!"); router.refresh(); closeModal(); } else alert("Failed: " + (res.message || res.error)); } }}>Refund to Wallet (Instant)</Button>
                                                        <Button variant="outline" className="w-full bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 font-bold hover:bg-blue-100/50 dark:hover:bg-blue-500/10" onClick={async () => { if (confirm(`Trigger Cashfree refund of Rs.${overAmount}?`)) { const res = await refundViaCashfree(selectedOrder.orderId); if (res.success) { alert("Cashfree refund triggered!"); router.refresh(); closeModal(); } else alert("Failed: " + (res.message || res.error)); } }}>Refund via Cashfree (Original Source)</Button>
                                                        <Button variant="outline" className="w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100/50 dark:hover:bg-gray-700/30" onClick={async () => { if (confirm(`Mark Rs.${overAmount} as manually refunded?`)) { const res = await refundManual(selectedOrder.orderId); if (res.success) { alert("Marked!"); router.refresh(); closeModal(); } else alert("Failed: " + (res.message || res.error)); } }}>Mark as Manually Refunded (Cash/UPI)</Button>
                                                        </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </form>
                                )}

                                {activeSection === "financials" && (
                                    <form
                                        onSubmit={onSubmitFinancials}
                                        className="space-y-6"
                                    >
                                        <input type="hidden" name="orderId" value={selectedOrder.orderId} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Compensation ₹</label>
                                                <input type="number" step="0.01" name="compensationAmount" defaultValue={selectedOrder.compensationAmount ?? 0} className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shop Discount ₹</label>
                                                <input type="number" step="0.01" name="discountAmount" defaultValue={selectedOrder.discountAmount ?? 0} className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold" />
                                            </div>
                                            <div className="space-y-2 col-span-2 bg-blue-50/50 dark:bg-brand-500/5 p-4 rounded-2xl border border-blue-100 dark:border-brand-500/10">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-[10px] font-black text-blue-600 dark:text-brand-400 uppercase tracking-widest ml-1">Logistics Fee Management</label>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Current Fee</span>
                                                        <span className="text-sm font-black text-gray-900 dark:text-white">₹{(selectedOrder.logisticsCost ?? 0).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 space-y-1">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase ml-1">Add Amount ₹</span>
                                                        <input 
                                                            type="number" 
                                                            step="0.01" 
                                                            placeholder="0.00"
                                                            value={additionalLogistics || ""} 
                                                            onChange={(e) => setAdditionalLogistics(parseFloat(e.target.value) || 0)}
                                                            className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" 
                                                        />
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-gray-400 font-bold mb-1">+</span>
                                                        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <span className="text-[9px] font-bold text-brand-500 uppercase ml-1">New Total ₹</span>
                                                        <input 
                                                            type="number" 
                                                            name="logisticsCost" 
                                                            readOnly
                                                            value={((selectedOrder.logisticsCost ?? 0) + additionalLogistics).toFixed(2)} 
                                                            className="w-full bg-brand-50 dark:bg-brand-500/10 border-brand-100 dark:border-brand-500/20 text-brand-600 dark:text-brand-400 rounded-xl px-4 py-2 text-sm font-black focus:outline-none" 
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 mt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setAdditionalLogistics(prev => prev + 52)}
                                                        className="flex-1 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                                    >
                                                        +52 Pickup
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAdditionalLogistics(prev => prev + 52)}
                                                        className="flex-1 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                                    >
                                                        +52 Delivery
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAdditionalLogistics(0)}
                                                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-rose-500 rounded-lg text-[10px] font-black uppercase transition-all"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <Button className="w-full" type="submit">Save Financials</Button>
                                    </form>
                                )}

                                {activeSection === "chat" && (
                                    <div className="h-[500px] -mx-6 -mb-6">
                                        {isChatLoading ? (
                                            <div className="flex items-center justify-center h-full">
                                                <RefreshCw className="animate-spin text-gray-400" />
                                            </div>
                                        ) : conversation ? (
                                            <ChatWindow
                                                initialMessages={chatMessages}
                                                conversationId={conversation.conversationId}
                                                shopId={selectedOrder.shopId}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                Failed to load conversation
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 p-3 bg-brand-500 text-white rounded-full hover:bg-brand-600 transition-all duration-300 z-40 animate-in fade-in slide-in-from-bottom-5 border border-brand-400"
                    aria-label="Scroll to top"
                >
                    <ArrowUp size={20} />
                </button>
            )}
        </div>
    );
};

export default OrdersClient;
