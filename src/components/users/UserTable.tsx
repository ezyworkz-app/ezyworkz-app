"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Phone, Mail, Calendar, Wallet, RefreshCw, ArrowUp, ArrowDown, Filter, ChevronDown, Bell, BellOff, Copy, Check, MessageCircle } from "lucide-react";
import Input from "@/components/form/input/InputField";
import { User } from "@/types/user";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { getAllUsers } from "@/lib/actions/users";
import Pagination from "@/components/tables/Pagination";
import Link from "next/link";

interface UserTableProps {
    initialUsers: User[];
    initialNextKey?: string;
    initialTotalCount: number;
    initialReferredCount?: number;
}

const UserTable: React.FC<UserTableProps> = ({ initialUsers, initialNextKey, initialTotalCount, initialReferredCount = 0 }) => {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [page, setPage] = useState(1);
    const [pageKeys, setPageKeys] = useState<Record<number, string | undefined>>({ 1: undefined, 2: initialNextKey });
    const [totalCount, setTotalCount] = useState(initialTotalCount);
    const [referredCount, setReferredCount] = useState(initialReferredCount);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<"createdAt" | "walletBalance" | "referralCount" | "orderCount">("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [walletFilter, setWalletFilter] = useState<"all" | "has_balance" | "zero_balance">("all");
    const [referralFilter, setReferralFilter] = useState<"all" | "completed" | "in_progress">("all");
    const [lifecycleFilter, setLifecycleFilter] = useState<"all" | "new" | "not_converted" | "active" | "dormant" | "churned">("all");
    const [pushFilter, setPushFilter] = useState<"all" | "enabled" | "disabled">("all");
    const [joinedFilter, setJoinedFilter] = useState<"all" | "today" | "week" | "month" | "year">("all");
    const [emailFilter, setEmailFilter] = useState<"all" | "has_email" | "no_email">("all");
    const [ordersFilter, setOrdersFilter] = useState<"all" | "zero" | "1_5" | "6_10" | "10plus">("all");
    const [referredFilter, setReferredFilter] = useState<"all" | "referred" | "organic">("all");
    const [showMoreFilters, setShowMoreFilters] = useState(false);
    const isFirstRender = useRef(true);

    const fetchPage = async (
        pageNumber: number, 
        currentSearch?: string, 
        currentWalletFilter?: string, 
        currentReferralFilter?: string,
        currentSortField?: string,
        currentSortOrder?: string
    ) => {
        setIsLoading(true);
        try {
            const key = pageNumber === 1 ? undefined : pageKeys[pageNumber];
            const result = await getAllUsers(
                10, 
                key, 
                currentSearch, 
                currentWalletFilter, 
                currentReferralFilter,
                currentSortField || sortField,
                currentSortOrder || sortOrder
            );
            
            setUsers(result.users);
            // Seed areaNames from any persisted values in the new batch
            setAreaNames(prev => {
                const next = { ...prev };
                for (const u of result.users) {
                    if (u.areaName) {
                        const key = typeof u.lat === "number" && typeof u.lng === "number"
                            ? `${u.lat.toFixed(4)}, ${u.lng.toFixed(4)}`
                            : typeof u.location === "object" && u.location
                                ? `${(u.location as any).lat.toFixed(4)}, ${(u.location as any).lng.toFixed(4)}`
                                : "";
                        if (key) next[key] = u.areaName!;
                    }
                }
                return next;
            });
            setTotalCount(result.totalCount);
            if (result.referredCount) setReferredCount(result.referredCount);
            if (result.nextKey) {
                setPageKeys(prev => ({ ...prev, [pageNumber + 1]: result.nextKey }));
            } else {
                // Clear next keys if no more results
                const newKeys = { ...pageKeys };
                delete newKeys[pageNumber + 1];
                setPageKeys(newKeys);
            }
            setPage(pageNumber);
        } catch (error) {
            console.error("Failed to fetch users page", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounced Search/Sort/Filter Effect
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            setPage(1);
            setPageKeys({ 1: undefined });
            fetchPage(1, searchTerm, walletFilter, referralFilter, sortField, sortOrder);
        }, 500);

        return () => clearTimeout(timeout);
    }, [searchTerm, walletFilter, referralFilter, sortField, sortOrder]);

    const handlePageChange = (newPage: number) => {
        if (newPage === page) return;
        fetchPage(newPage, searchTerm, walletFilter, referralFilter, sortField, sortOrder);
    };

    type LifecycleStage = "new" | "not_converted" | "active" | "dormant" | "churned";

    const getLifecycle = (user: (typeof users)[0]): LifecycleStage => {
        const now = Date.now();
        const signedUpDaysAgo = (now - new Date(user.createdAt).getTime()) / 86_400_000;
        if (!user.orderCount || user.orderCount === 0) {
            return signedUpDaysAgo <= 7 ? "new" : "not_converted";
        }
        if (!user.lastOrderDate) return "active";
        const daysSinceLast = (now - new Date(user.lastOrderDate).getTime()) / 86_400_000;
        if (daysSinceLast <= 30) return "active";
        if (daysSinceLast <= 90) return "dormant";
        return "churned";
    };

    const LIFECYCLE_CONFIG: Record<LifecycleStage, { label: string; color: string; bg: string; dot: string }> = {
        new:           { label: "New",           color: "#6366F1", bg: "#EEF2FF", dot: "#6366F1" },
        not_converted: { label: "Not Converted", color: "#F97316", bg: "#FFF7ED", dot: "#F97316" },
        active:        { label: "Active",        color: "#16A34A", bg: "#F0FDF4", dot: "#16A34A" },
        dormant:       { label: "Dormant",       color: "#D97706", bg: "#FFFBEB", dot: "#D97706" },
        churned:       { label: "Churned",       color: "#DC2626", bg: "#FEF2F2", dot: "#DC2626" },
    };

    const filteredUsers = users.filter(u => {
        if (lifecycleFilter !== "all" && getLifecycle(u) !== lifecycleFilter) return false;

        if (pushFilter !== "all") {
            const hasPush = !!(u.expoPushToken || (u.expoPushTokens && u.expoPushTokens.length > 0));
            if (pushFilter === "enabled" && !hasPush) return false;
            if (pushFilter === "disabled" && hasPush) return false;
        }

        if (joinedFilter !== "all") {
            const joined = new Date(u.createdAt).getTime();
            const now = Date.now();
            const day = 86_400_000;
            if (joinedFilter === "today"  && now - joined > day) return false;
            if (joinedFilter === "week"   && now - joined > 7 * day) return false;
            if (joinedFilter === "month"  && now - joined > 30 * day) return false;
            if (joinedFilter === "year"   && now - joined > 365 * day) return false;
        }

        if (emailFilter !== "all") {
            const hasEmail = !!(u.email && u.email.trim() && u.email !== "");
            if (emailFilter === "has_email" && !hasEmail) return false;
            if (emailFilter === "no_email"  && hasEmail) return false;
        }

        if (ordersFilter !== "all") {
            const n = u.orderCount || 0;
            if (ordersFilter === "zero"   && n !== 0) return false;
            if (ordersFilter === "1_5"    && (n < 1 || n > 5)) return false;
            if (ordersFilter === "6_10"   && (n < 6 || n > 10)) return false;
            if (ordersFilter === "10plus" && n <= 10) return false;
        }

        if (referredFilter !== "all") {
            const wasReferred = !!(u as any).referredBy;
            if (referredFilter === "referred" && !wasReferred) return false;
            if (referredFilter === "organic"  && wasReferred) return false;
        }

        return true;
    });

    // Handle local pagination for search/filter results (since we get up to 200 results at once)
    const ITEMS_PER_PAGE = 10;
    const isLocalPagination = !pageKeys[page] || searchTerm || walletFilter !== "all" || referralFilter !== "all" || lifecycleFilter !== "all" || pushFilter !== "all" || joinedFilter !== "all" || emailFilter !== "all" || ordersFilter !== "all" || referredFilter !== "all" || sortField !== "createdAt" || sortOrder !== "desc";
    const paginatedUsers = isLocalPagination
        ? filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
        : filteredUsers;

    const [copiedText, setCopiedText] = useState<string | null>(null);
    const [areaNames, setAreaNames] = useState<Record<string, string>>(() => {
        const seed: Record<string, string> = {};
        for (const u of initialUsers) {
            if (u.areaName) {
                const key = typeof u.lat === "number" && typeof u.lng === "number"
                    ? `${u.lat.toFixed(4)}, ${u.lng.toFixed(4)}`
                    : typeof u.location === "object" && u.location
                        ? `${(u.location as any).lat.toFixed(4)}, ${(u.location as any).lng.toFixed(4)}`
                        : "";
                if (key) seed[key] = u.areaName;
            }
        }
        return seed;
    });
    const areaCacheRef = useRef<Record<string, string>>({});

    useEffect(() => {
        // Pre-populate cache from persisted areaName so those users never need a Nominatim call
        for (const u of paginatedUsers) {
            if (u.areaName) areaCacheRef.current[getLocationString(u)] = u.areaName;
        }
        const usersNeedingGeo = paginatedUsers.filter(u => {
            if (u.areaName) return false;
            const key = getLocationString(u);
            return key !== "-" && !areaCacheRef.current[key];
        });
        if (usersNeedingGeo.length === 0) return;

        let cancelled = false;
        (async () => {
            for (let i = 0; i < usersNeedingGeo.length; i++) {
                if (cancelled) break;
                const user = usersNeedingGeo[i];
                const key = getLocationString(user);
                const lat = typeof user.lat === "number" ? user.lat : (user.location as any)?.lat;
                const lng = typeof user.lng === "number" ? user.lng : (user.location as any)?.lng;
                if (!lat || !lng) continue;
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 5000);
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
                        { headers: { "Accept-Language": "en" }, signal: controller.signal }
                    );
                    clearTimeout(timeout);
                    const data = await res.json();
                    const addr = data?.address || {};
                    const sub =
                        addr.suburb ||
                        addr.neighbourhood ||
                        addr.village ||
                        addr.county ||
                        "";
                    const city =
                        addr.city ||
                        addr.town ||
                        addr.city_district ||
                        addr.state_district ||
                        "";
                    const area = sub && city && sub !== city
                        ? `${sub}, ${city}`
                        : sub || city;
                    // Always store something so "resolving..." disappears
                    const display = area || `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
                    areaCacheRef.current[key] = display;
                    if (!cancelled) setAreaNames(prev => ({ ...prev, [key]: display }));
                } catch {
                    // On timeout or error, fall back to raw coordinates
                    const display = `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
                    areaCacheRef.current[key] = display;
                    if (!cancelled) setAreaNames(prev => ({ ...prev, [key]: display }));
                }
                // Nominatim: max 1 req/sec — wait 250ms between requests
                if (i < usersNeedingGeo.length - 1) await new Promise(r => setTimeout(r, 250));
            }
        })();
        return () => { cancelled = true; };
    // Use a stable key so the effect only re-runs when the actual users change,
    // not on every render (paginatedUsers is a new array reference each render).
    }, [paginatedUsers.map(u => u.userId).join(",")]);

    const handleCopy = (text: string) => {
        if (!text || text === "-") return;
        navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 2000);
    };

    const toggleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("desc");
        }
        setPage(1);
        setPageKeys({ 1: undefined });
    };

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

    const getLocationString = (user: User) => {
        if (typeof user.lat === "number" && typeof user.lng === "number") {
            return `${user.lat.toFixed(4)}, ${user.lng.toFixed(4)}`;
        }
        if (user.location) {
            if (typeof user.location === "string") return user.location;
            return `${user.location.lat.toFixed(4)}, ${user.location.lng.toFixed(4)}`;
        }
        return "-";
    };

    const getWhatsAppMessage = (name?: string) => {
        const firstName = name?.trim().split(" ")[0] || "there";
        const wave   = "\u{1F44B}"; // 👋
        const gift   = "\u{1F381}"; // 🎁
        const mobile = "\u{1F4F1}"; // 📱
        const point  = "\u{1F449}"; // 👉
        const smile  = "\u{1F60A}"; // 😊
        return (
            `Hi ${firstName}! ${wave}\n\n` +
            `Welcome to *Launezy*!\n\n` +
            `We noticed you haven't placed your first order yet, and we'd love to make it super easy for you!\n\n` +
            `${gift} *Special first-order offer:* Get ₹100 OFF your first order!\n\n` +
            `${mobile} Just open the Launezy app, add your clothes, and we'll handle the rest — pickup, wash, fold & delivery.\n\n` +
            `${point} *Book your first order now* and use code: *TRYLAUNEZY*\n\n` +
            `Any questions? Just reply here – we're happy to help! ${smile}\n\n` +
            `– Team Launezy`
        );
    };

    const getWhatsAppUrl = (phone: string, name?: string) => {
        const cleaned = phone.replace(/[\s\-\+\(\)]/g, "");
        const normalized = cleaned.startsWith("91") && cleaned.length === 12 ? cleaned : `91${cleaned.replace(/^0/, "")}`;
        return `https://wa.me/${normalized}?text=${encodeURIComponent(getWhatsAppMessage(name))}`;
    };

    return (
        <div className="space-y-4">
            <div className="relative overflow-hidden w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                    {/* Row 1: search + primary filters */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex flex-1 items-center gap-3">
                            <Input
                                placeholder="Search users by name, email, phone or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-md"
                            />
                            {isLoading && <RefreshCw className="animate-spin text-brand-500" size={20} />}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {[
                                { value: walletFilter,    onChange: (v: string) => { setWalletFilter(v as any); setPage(1); },    options: [["all","All Wallets"],["has_balance","With Balance"],["zero_balance","Zero Balance"]] },
                                { value: referralFilter,  onChange: (v: string) => { setReferralFilter(v as any); setPage(1); },  options: [["all","All Referrals"],["completed","Completed (5+)"],["in_progress","In Progress"]] },
                                { value: lifecycleFilter, onChange: (v: string) => { setLifecycleFilter(v as any); setPage(1); }, options: [["all","All Lifecycle"],["new","New"],["not_converted","Not Converted"],["active","Active"],["dormant","Dormant"],["churned","Churned"]] },
                            ].map((f, i) => (
                                <div key={i} className="relative">
                                    <select value={f.value} onChange={e => f.onChange(e.target.value)}
                                        className={`h-10 pl-3 pr-8 border rounded-xl text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all uppercase tracking-wider
                                            ${f.value !== "all" ? "bg-brand-50 dark:bg-brand-500/10 border-brand-300 dark:border-brand-500/30 text-brand-600 dark:text-brand-400" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}>
                                        {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                                </div>
                            ))}

                            {/* More Filters toggle */}
                            <button
                                onClick={() => setShowMoreFilters(p => !p)}
                                className={`h-10 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all uppercase tracking-wider
                                    ${showMoreFilters || [pushFilter, joinedFilter, emailFilter, ordersFilter, referredFilter].some(f => f !== "all")
                                        ? "bg-brand-50 dark:bg-brand-500/10 border-brand-300 dark:border-brand-500/30 text-brand-600 dark:text-brand-400"
                                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}
                            >
                                <Filter size={12} />
                                More
                                {[pushFilter, joinedFilter, emailFilter, ordersFilter, referredFilter].filter(f => f !== "all").length > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] flex items-center justify-center font-black">
                                        {[pushFilter, joinedFilter, emailFilter, ordersFilter, referredFilter].filter(f => f !== "all").length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Referral signup stat pill */}
                    {referredCount > 0 && (
                        <div className="flex items-center gap-3 px-1">
                            <button
                                onClick={() => { setReferredFilter(referredFilter === "referred" ? "all" : "referred"); setPage(1); setShowMoreFilters(true); }}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all
                                    ${referredFilter === "referred"
                                        ? "bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/30 text-violet-600 dark:text-violet-400"
                                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-violet-300 hover:text-violet-500"}`}
                                title="Click to filter referral signups"
                            >
                                <span className="w-2 h-2 rounded-full bg-violet-400" />
                                <span className="font-black text-sm">{referredCount.toLocaleString()}</span>
                                users joined via referral
                                <span className="text-gray-400 font-normal">
                                    ({totalCount > 0 ? Math.round((referredCount / totalCount) * 100) : 0}% of all users)
                                </span>
                            </button>
                            <button
                                onClick={() => { setReferredFilter(referredFilter === "organic" ? "all" : "organic"); setPage(1); setShowMoreFilters(true); }}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all
                                    ${referredFilter === "organic"
                                        ? "bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/30 text-sky-600 dark:text-sky-400"
                                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-sky-300 hover:text-sky-500"}`}
                                title="Click to filter organic signups"
                            >
                                <span className="w-2 h-2 rounded-full bg-sky-400" />
                                <span className="font-black text-sm">{(totalCount - referredCount).toLocaleString()}</span>
                                organic signups
                            </button>
                        </div>
                    )}

                    {/* Row 2: expanded filters */}
                    {showMoreFilters && (
                        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100 dark:border-gray-800">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">More filters:</span>
                            {[
                                { label: "Push",    value: pushFilter,    onChange: (v: string) => { setPushFilter(v as any); setPage(1); },    options: [["all","All Push"],["enabled","Push Enabled"],["disabled","Push Disabled"]] },
                                { label: "Joined",  value: joinedFilter,  onChange: (v: string) => { setJoinedFilter(v as any); setPage(1); },  options: [["all","All Time"],["today","Joined Today"],["week","This Week"],["month","This Month"],["year","This Year"]] },
                                { label: "Email",   value: emailFilter,   onChange: (v: string) => { setEmailFilter(v as any); setPage(1); },   options: [["all","All Email"],["has_email","Has Email"],["no_email","No Email"]] },
                                { label: "Orders",  value: ordersFilter,  onChange: (v: string) => { setOrdersFilter(v as any); setPage(1); },  options: [["all","All Orders"],["zero","0 Orders"],["1_5","1–5 Orders"],["6_10","6–10 Orders"],["10plus","10+ Orders"]] },
                                { label: "Source",  value: referredFilter, onChange: (v: string) => { setReferredFilter(v as any); setPage(1); }, options: [["all","All Sources"],["referred","Via Referral"],["organic","Organic"]] },
                            ].map((f, i) => (
                                <div key={i} className="relative">
                                    <select value={f.value} onChange={e => f.onChange(e.target.value)}
                                        className={`h-9 pl-3 pr-8 border rounded-xl text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all uppercase tracking-wider
                                            ${f.value !== "all" ? "bg-brand-50 dark:bg-brand-500/10 border-brand-300 dark:border-brand-500/30 text-brand-600 dark:text-brand-400" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}>
                                        {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                                </div>
                            ))}

                            {[pushFilter, joinedFilter, emailFilter, ordersFilter, referredFilter].some(f => f !== "all") && (
                                <button
                                    onClick={() => { setPushFilter("all"); setJoinedFilter("all"); setEmailFilter("all"); setOrdersFilter("all"); setReferredFilter("all"); setPage(1); }}
                                    className="h-9 px-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider transition-all hover:bg-red-100"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="max-w-full overflow-x-auto">
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    <button 
                                        onClick={() => toggleSort("createdAt")}
                                        className="flex items-center gap-1.5 hover:text-brand-500 transition-colors uppercase tracking-widest font-black"
                                    >
                                        Date {sortField === "createdAt" && (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                    </button>
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 uppercase tracking-widest font-black">User</TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 uppercase tracking-widest font-black">Location</TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    <button 
                                        onClick={() => toggleSort("walletBalance")}
                                        className="flex items-center gap-1.5 hover:text-brand-500 transition-colors uppercase tracking-widest font-black"
                                    >
                                        Wallet {sortField === "walletBalance" && (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                    </button>
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    <button 
                                        onClick={() => toggleSort("referralCount")}
                                        className="flex items-center gap-1.5 hover:text-brand-500 transition-colors uppercase tracking-widest font-black"
                                    >
                                        Referral {sortField === "referralCount" && (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                    </button>
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    <button 
                                        onClick={() => toggleSort("orderCount")}
                                        className="flex items-center gap-1.5 hover:text-brand-500 transition-colors uppercase tracking-widest font-black"
                                    >
                                        Orders {sortField === "orderCount" && (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                    </button>
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 uppercase tracking-widest font-black">Push</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {paginatedUsers.length > 0 ? (
                                paginatedUsers.map((user) => (
                                    <TableRow key={user.userId} className="hover:bg-gray-50/30 dark:hover:bg-white/[0.01] transition-colors align-top">
                                        <TableCell className="px-5 py-4 text-start">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-bold">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    {formatDate(user.createdAt)}
                                                </div>
                                                {(() => {
                                                    const stage = getLifecycle(user);
                                                    const cfg = LIFECYCLE_CONFIG[stage];
                                                    return (
                                                        <span
                                                            className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold"
                                                            style={{ backgroundColor: cfg.bg, color: cfg.color }}
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: cfg.dot }} />
                                                            {cfg.label}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-start">
                                            <div className="space-y-1.5">
                                                <div className="font-mono text-[9px] text-gray-400 leading-none">
                                                    {user.userId}
                                                </div>
                                                <Link 
                                                    href={`/users/${user.userId}`}
                                                    className="font-bold text-gray-900 dark:text-white/90 text-sm hover:text-brand-500 hover:underline transition-all block"
                                                >
                                                    {user.name}
                                                </Link>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs">
                                                        <Phone size={12} className="text-gray-400" />
                                                        {user.phoneNumber}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs">
                                                        <Mail size={12} className="text-gray-400" />
                                                        <span className="truncate max-w-[150px]">{user.email}</span>
                                                    </div>
                                                    {(!user.orderCount || user.orderCount === 0) && user.phoneNumber && (
                                                        <a
                                                            href={getWhatsAppUrl(user.phoneNumber, user.name)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 mt-0.5 w-fit px-2 py-1 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-[10px] font-bold transition-all"
                                                            title="Send first-order offer on WhatsApp"
                                                        >
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                                            </svg>
                                                            Send Offer
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-start">
                                            <div className="flex flex-col gap-1">
                                                {areaNames[getLocationString(user)] && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin size={11} className="text-brand-400 shrink-0" />
                                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                                            {areaNames[getLocationString(user)]}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 group">
                                                    <span className="text-[11px] text-gray-400 font-mono">
                                                        {getLocationString(user)}
                                                    </span>
                                                    {getLocationString(user) !== "-" && (
                                                        <button
                                                            onClick={() => handleCopy(getLocationString(user))}
                                                            className="p-1 text-gray-300 hover:text-brand-500 transition-all opacity-0 group-hover:opacity-100"
                                                            title="Copy coordinates"
                                                        >
                                                            {copiedText === getLocationString(user) ? <Check size={12} className="text-success-500" /> : <Copy size={12} />}
                                                        </button>
                                                    )}
                                                </div>
                                                {!areaNames[getLocationString(user)] && getLocationString(user) !== "-" && (
                                                    <span className="text-[10px] text-gray-300 italic">resolving...</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-start">
                                            <div className="flex items-center gap-1.5">
                                                <Wallet size={14} className="text-success-500" />
                                                <span className="font-bold text-gray-900 dark:text-white text-sm">
                                                    ₹{user.walletBalance?.toFixed(2) || "0.00"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-start">
                                            <div className="space-y-1 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400">Code:</span>
                                                    <span className="font-mono font-bold text-brand-500">{user.referralCode || "-"}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400">Count:</span>
                                                    <button 
                                                        onClick={() => user.referralCode && setSearchTerm(user.referralCode)}
                                                        className="hover:scale-105 transition-transform"
                                                        title="Click to see users referred by this person"
                                                    >
                                                        <Badge size="sm" color={user.referralCount && user.referralCount >= 5 ? "success" : "primary"}>
                                                            {user.referralCount || 0}/5
                                                        </Badge>
                                                    </button>
                                                </div>
                                                {user.referredBy && (
                                                    <div className="flex items-center gap-1 pt-1 border-t border-gray-50 dark:border-gray-800">
                                                        <span className="text-[10px] text-gray-400">Ref By:</span>
                                                        <button 
                                                            onClick={() => setSearchTerm(user.referredBy!)}
                                                            className="text-[10px] font-mono font-bold text-success-500 hover:text-success-600 hover:underline transition-all"
                                                            title={`Search for referrer ${user.referredBy}`}
                                                        >
                                                            {user.referredBy}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-start">
                                            <div className="flex flex-col gap-1">
                                                <Badge color="primary" variant="light" size="sm">
                                                    {user.orderCount || 0}
                                                </Badge>
                                                {user.lastOrderDate && (
                                                    <div className="text-[10px] text-gray-400 leading-tight">
                                                        Last: {formatDate(user.lastOrderDate)}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-start">
                                            <div className="flex flex-col gap-1">
                                                <div className="w-fit">
                                                    <Badge 
                                                        size="sm" 
                                                        color={(user.expoPushToken || (user.expoPushTokens && user.expoPushTokens.length > 0)) ? "success" : "error"}
                                                    >
                                                        {(user.expoPushToken || (user.expoPushTokens && user.expoPushTokens.length > 0)) ? (
                                                            <span className="flex items-center gap-1"><Bell size={10} /> Enabled</span>
                                                        ) : (
                                                            <span className="flex items-center gap-1"><BellOff size={10} /> Disabled</span>
                                                        )}
                                                    </Badge>
                                                </div>
                                                {user.expoPushToken && (
                                                    <div className="text-[10px] text-gray-400 font-mono truncate max-w-[100px]" title={user.expoPushToken}>
                                                        {user.expoPushToken}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="px-5 py-20 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="w-10 h-10 text-gray-200" />
                                            <span className="text-gray-400 font-medium">No users found.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col items-center gap-4 py-4">
                {(() => {
                    const anyLocalFilter = [lifecycleFilter, pushFilter, joinedFilter, emailFilter, ordersFilter, referredFilter].some(f => f !== "all");
                    const displayTotal = anyLocalFilter ? filteredUsers.length : totalCount;
                    return (
                        <>
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Showing {Math.min(displayTotal, (page - 1) * ITEMS_PER_PAGE + 1)}–{Math.min(displayTotal, page * ITEMS_PER_PAGE)} of {displayTotal} users
                                {anyLocalFilter && (
                                    <span className="ml-2 text-xs font-bold text-brand-500">
                                        (filtered)
                                    </span>
                                )}
                            </div>
                            <Pagination
                                currentPage={page}
                                totalPages={Math.max(1, Math.ceil(displayTotal / ITEMS_PER_PAGE))}
                                onPageChange={handlePageChange}
                            />
                        </>
                    );
                })()}
            </div>
        </div>
    );
};

export default UserTable;
