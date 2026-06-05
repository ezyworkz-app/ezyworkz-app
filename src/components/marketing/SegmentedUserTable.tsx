"use client";
import React, { useState, useEffect } from "react";
import { 
    Search, 
    Phone, 
    Calendar, 
    ArrowRight, 
    MessageCircle, 
    Send, 
    ChevronLeft, 
    ChevronRight,
    Filter,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from "lucide-react";
import Input from "@/components/form/input/InputField";
import { SegmentedUser } from "@/types/user";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import SendCouponModal from "./SendCouponModal";
import { sendCouponToUser } from "@/lib/actions/users";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";

interface SegmentedUserTableProps {
    users: SegmentedUser[];
    total: number;
    currentPage: number;
    limit: number;
}

const SegmentedUserTable: React.FC<SegmentedUserTableProps> = ({ users, total, currentPage, limit }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Initialize from URL
    const initialSearch = searchParams.get("search") || "";
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedUser, setSelectedUser] = useState<SegmentedUser | null>(null);

    const currentSegment = searchParams.get("segment") || "";
    const currentSortBy = searchParams.get("sortBy") || "daysSinceLastOrder";
    const currentSortDir = searchParams.get("sortDir") || "desc";

    const totalPages = Math.ceil(total / limit);

    // Sync helpers
    const updateParams = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(newParams).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });
        params.set("page", "1"); // Reset pagination
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSort = (field: string) => {
        const isCurrentlySame = currentSortBy === field;
        const newDir = isCurrentlySame && currentSortDir === "desc" ? "asc" : "desc";
        updateParams({ sortBy: field, sortDir: newDir });
    };

    const getSortIcon = (field: string) => {
        if (currentSortBy !== field) return <ArrowUpDown size={12} className="opacity-30" />;
        return currentSortDir === "desc" ? <ArrowDown size={12} className="text-brand-500" /> : <ArrowUp size={12} className="text-brand-500" />;
    };

    // Debounce search update to URL
    useEffect(() => {
        if (searchTerm === initialSearch) return;

        const delayDebounceFn = setTimeout(() => {
            updateParams({ search: searchTerm });
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, initialSearch]);

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            router.push(createPageURL(newPage));
        }
    };

    const handleSendAction = (user: SegmentedUser) => {
        setSelectedUser(user);
    };

    const handleActualSend = async (data: { couponCode: string; title: string; body: string }) => {
        if (!selectedUser) return;
        try {
            await sendCouponToUser({
                userId: selectedUser.userId,
                ...data
            });
            alert(`Success: Campaign sent to ${selectedUser.name}.`);
            setSelectedUser(null);
        } catch (error: any) {
            console.error("[handleActualSend]", error);
            const message = error.message || "Failed to send notification";
            if (message.includes("no push tokens")) {
                alert(`Cannot send notification: ${selectedUser.name} has not enabled push notifications on their device.`);
            } else {
                alert(`Error: ${message}`);
            }
        }
    };

    const handleQuickSend = async (user: SegmentedUser) => {
        let quickData = {
            couponCode: "LAUNEZY20",
            title: "We Miss You! 🎁",
            body: `Hi ${user.name || 'there'}, we've missed you! Use code LAUNEZY20 for a special discount on your next order.`
        };

        if (user.segment === "FIRST_TIME") {
            quickData = {
                couponCode: "LAUNEZY20",
                title: "Welcome to Launezy! ✨",
                body: `Hi ${user.name || 'there'}, start your journey with 20% off! Use code LAUNEZY20 on your first order.`
            };
        } else if (user.segment === "INACTIVE_FREQUENT") {
            quickData = {
                couponCode: "VIP25",
                title: "VIP Special Offer 🌟",
                body: `Hi ${user.name || 'there'}, as one of our top customers, here is an exclusive 25% off code: VIP25. Come back soon!`
            };
        }

        try {
            await sendCouponToUser({
                userId: user.userId,
                ...quickData
            });
            alert(`One-tap campaign sent to ${user.name}!`);
        } catch (error: any) {
            console.error("[handleQuickSend]", error);
            const message = error.message || "";
            if (message.includes("no push tokens")) {
                alert(`Cannot send notification: ${user.name} has not enabled push notifications on their device.`);
            } else {
                alert("Failed to send quick notification. Please try again or use WhatsApp.");
            }
        }
    };

    const getSegmentBadge = (segment: string) => {
        switch (segment) {
            case "FIRST_TIME": 
                return <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">FIRST TIME</span>;
            case "INACTIVE_ONE_TIME": 
                return <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20">CHURN RISK</span>;
            case "INACTIVE_FREQUENT": 
                return <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20">CRITICAL</span>;
            default: 
                return <Badge color="light">{segment}</Badge>;
        }
    };

    return (
        <div className="relative overflow-hidden w-full bg-white dark:bg-gray-950 rounded-[2.2rem] border-0 shadow-none">
            <div className="p-8 border-b border-gray-100 dark:border-white/5 flex flex-col xl:flex-row items-center justify-between gap-6 bg-white dark:bg-gray-950">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="relative w-full md:w-96 group">
                        <div className="absolute inset-0 bg-brand-500/5 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                        <Input
                            placeholder="Find specific leads by name or number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 py-6 rounded-2xl bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 focus:bg-white dark:focus:bg-gray-900 transition-all text-sm font-semibold"
                        />
                    </div>
                    
                    <div className="relative w-full md:w-64">
                        <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            value={currentSegment}
                            onChange={(e) => updateParams({ segment: e.target.value })}
                            className="w-full pl-12 pr-6 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-[11px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest focus:ring-2 focus:ring-brand-500 transition-all outline-none appearance-none cursor-pointer"
                        >
                            <option value="">SELECT SEGMENT</option>
                            <option value="FIRST_TIME">FIRST-TIME USERS</option>
                            <option value="INACTIVE_ONE_TIME">CHURN RISK (1 ORDER)</option>
                            <option value="INACTIVE_FREQUENT">CRITICAL (VIP)</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3 px-6 py-3 bg-brand-500/5 dark:bg-brand-500/10 rounded-2xl border border-brand-500/10">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse" />
                    <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em]">
                        {total} TARGETABLE LEADS
                    </span>
                </div>
            </div>

            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-white/[0.02]">
                        <TableRow>
                            <TableCell isHeader className="px-6 py-4 font-bold text-gray-400 text-start text-[10px] uppercase tracking-widest">LEAD DETAILS</TableCell>
                            <TableCell isHeader className="px-6 py-4 font-bold text-gray-400 text-start text-[10px] uppercase tracking-widest">CATEGORY</TableCell>
                            <TableCell 
                                isHeader 
                                className="px-6 py-4 font-bold text-gray-400 text-start text-[10px] uppercase tracking-widest cursor-pointer hover:text-brand-500 transition-colors"
                                onClick={() => handleSort("orderCount")}
                            >
                                <div className="flex items-center gap-2">
                                    ACTIVITY HISTORY {getSortIcon("orderCount")}
                                </div>
                            </TableCell>
                            <TableCell 
                                isHeader 
                                className="px-6 py-4 font-bold text-gray-400 text-start text-[10px] uppercase tracking-widest cursor-pointer hover:text-brand-500 transition-colors"
                                onClick={() => handleSort("daysSinceLastOrder")}
                            >
                                <div className="flex items-center gap-2">
                                    DORMANT PERIOD {getSortIcon("daysSinceLastOrder")}
                                </div>
                            </TableCell>
                            <TableCell isHeader className="px-6 py-4 font-bold text-gray-400 text-end text-[10px] uppercase tracking-widest">QUICK ACTIONS</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {users.length > 0 ? (
                            users.map((user) => (
                                <TableRow key={user.userId} className="group hover:bg-brand-50/20 dark:hover:bg-brand-500/[0.02] transition-colors">
                                    <TableCell className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">{user.name}</span>
                                            <span className="text-xs text-gray-400 mt-1 font-medium">{user.phoneNumber}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        {getSegmentBadge(user.segment)}
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{user.orderCount} Lifetime Orders</span>
                                            <span 
                                                className="text-xs text-gray-400 mt-0.5"
                                                suppressHydrationWarning
                                            >
                                                Last: {user.lastOrderDate ? format(parseISO(user.lastOrderDate), "MMM d, yyyy") : "New SignUp"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 font-mono">
                                        {user.daysSinceLastOrder ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-error-500" />
                                                <span className="text-error-500 font-bold text-sm tracking-tight">{user.daysSinceLastOrder} Days Inactive</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 text-xs">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <div className="flex items-center justify-end gap-3">
                                            <a 
                                                href={user.whatsappUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="flex items-center justify-center w-10 h-10 text-green-500 bg-green-50 dark:bg-green-500/10 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-sm border border-green-100 dark:border-green-500/20"
                                                title="Direct WhatsApp with Pre-filled Message"
                                            >
                                                <MessageCircle size={20} />
                                            </a>
                                            <button 
                                                onClick={() => handleQuickSend(user)}
                                                className="flex items-center justify-center w-10 h-10 text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-500/20"
                                                title="One-Tap Notification"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={() => handleSendAction(user)}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 hover:scale-105 active:scale-95 transition-all"
                                                title="Custom Campaign"
                                            >
                                                <Send size={14} /> Engage
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="px-5 py-32 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center">
                                            <Search className="text-gray-300 dark:text-gray-700" size={32} />
                                        </div>
                                        <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">No matching leads found</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50 dark:bg-white/[0.02]">
                <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Showing <span className="text-gray-900 dark:text-white">{users.length > 0 ? (currentPage - 1) * limit + 1 : 0}</span> to <span className="text-gray-900 dark:text-white">{Math.min(currentPage * limit, total)}</span> of <span className="text-gray-900 dark:text-white">{total}</span> records
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Simple pagination logic for 5 pages around current
                            let pageNum = currentPage;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (currentPage <= 3) pageNum = i + 1;
                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = currentPage - 2 + i;

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                                        currentPage === pageNum
                                            ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                                            : "text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <SendCouponModal 
                isOpen={!!selectedUser}
                onClose={() => setSelectedUser(null)}
                onSend={handleActualSend}
                userName={selectedUser?.name || ""}
                segment={selectedUser?.segment || ""}
            />
        </div>
    );
};

export default SegmentedUserTable;
