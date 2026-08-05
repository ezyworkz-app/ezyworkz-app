"use client";

import { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import apiClient from "@/lib/api/client";
import Link from "next/link";
import {
    Users, Loader2, AlertCircle, MapPin, Plus, Edit2, Trash2,
    Search, ChevronLeft, ChevronRight, ChevronDown, Store, Globe,
    ShoppingBag, IndianRupee, Clock
} from "lucide-react";
import { CustomerModal } from "@/components/CustomerModal";

interface Address {
    label: string;
    line1: string;
    area: string;
    city: string;
}

interface Customer {
    customerId: string;
    name: string;
    email: string;
    phone: string;
    savedAddresses: Address[];
    createdAt: string;
    joinedAt?: string;
    orderCount?: number;
    totalSpent?: number;
    lastOrderAt?: string;
    source?: "shop" | "organic";
    location?: { area: string; city: string } | null;
}

type SourceFilter = "all" | "shop" | "organic";
type SortField = "date" | "orders" | "spent" | "name";
type SortDir = "asc" | "desc";

export default function UsersClient({ initialCustomers, error: initialError }: { initialCustomers: Customer[], error?: string }) {
    const { selectedShopId, userRole, isLoading: shopLoading } = useShop();
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(initialError || "");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
    const [sortField, setSortField] = useState<SortField>("date");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sourceFilter]);

    // If shop changes after initial load, fetch new customers
    useEffect(() => {
        if (!shopLoading && !selectedShopId) {
            setError("No shop found. Please contact support.");
        } else if (!shopLoading && selectedShopId) {
            if (customers.length === 0 && !initialError) {
                fetchCustomers();
            }
        }
    }, [selectedShopId, shopLoading]);

    const fetchCustomers = async () => {
        if (!selectedShopId) return;
        try {
            setLoading(true);
            const response = await apiClient.get(`/customers/${selectedShopId}`);
            setCustomers(response.data.data || response.data || []);
            setError("");
        } catch (err: any) {
            setError(err.message || "Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomer = () => {
        setCustomerToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditCustomer = (customer: Customer) => {
        setCustomerToEdit(customer);
        setIsModalOpen(true);
    };

    const handleDeleteCustomer = async (customerId: string, customerName: string) => {
        if (!window.confirm(`Are you sure you want to remove ${customerName || 'this user'} from your shop?`)) return;

        try {
            await apiClient.delete(`/customers/${selectedShopId}/${customerId}`);
            setCustomers(prev => prev.filter(c => c.customerId !== customerId));
        } catch (err: any) {
            setError(err.message || "Failed to remove customer");
        }
    };

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        return new Intl.DateTimeFormat('en-IN', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
        }).format(d);
    };

    const getRelativeTime = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return `${Math.floor(diffDays / 30)}mo ago`;
    };

    // Count stats
    const shopCreatedCount = useMemo(() => customers.filter(c => c.source === "shop").length, [customers]);
    const organicCount = useMemo(() => customers.filter(c => c.source === "organic").length, [customers]);

    const filteredCustomers = useMemo(() => {
        let result = customers;

        // Source filter
        if (sourceFilter !== "all") {
            result = result.filter(c => c.source === sourceFilter);
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(c =>
                (c.name && c.name.toLowerCase().includes(query)) ||
                (c.phone && c.phone.includes(query)) ||
                (c.email && c.email.toLowerCase().includes(query)) ||
                (c.customerId && c.customerId.toLowerCase().includes(query))
            );
        }

        // Sort
        result = [...result].sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1;
            switch (sortField) {
                case "date":
                    return dir * (new Date(a.joinedAt || a.createdAt).getTime() - new Date(b.joinedAt || b.createdAt).getTime());
                case "orders":
                    return dir * ((a.orderCount || 0) - (b.orderCount || 0));
                case "spent":
                    return dir * ((a.totalSpent || 0) - (b.totalSpent || 0));
                case "name":
                    return dir * (a.name || "").localeCompare(b.name || "");
                default:
                    return 0;
            }
        });

        return result;
    }, [customers, searchQuery, sourceFilter, sortField, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE));
    const paginatedCustomers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredCustomers, currentPage]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDir("desc");
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => (
        <ChevronDown className={`w-3 h-3 inline ml-0.5 transition-transform ${sortField === field ? 'text-brand-500' : 'text-gray-400'} ${sortField === field && sortDir === "asc" ? 'rotate-180' : ''}`} />
    );

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <ProtectedRoute>
            <main className="flex-1 p-6 lg:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                            <span>🏠 Home</span>
                            <span>›</span>
                            <span className="text-gray-600 dark:text-gray-300">Users</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">User List</h1>
                    </div>
                    <button
                        onClick={handleAddCustomer}
                        className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Customer
                    </button>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm font-medium text-red-600 dark:text-red-400">{error}</div>
                    </div>
                )}

                {/* Search + Filter Bar */}
                <div className="mb-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users by name, phone, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all text-gray-900 dark:text-white"
                        />
                    </div>

                    {/* Source filter pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setSourceFilter("all")}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${sourceFilter === "all"
                                ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800"
                            }`}
                        >
                            <Users className="w-3 h-3" />
                            All ({customers.length})
                        </button>
                        <button
                            onClick={() => setSourceFilter("shop")}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${sourceFilter === "shop"
                                ? "bg-amber-500 text-white border-amber-500"
                                : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800"
                            }`}
                        >
                            <Store className="w-3 h-3" />
                            Shop Created ({shopCreatedCount})
                        </button>
                        <button
                            onClick={() => setSourceFilter("organic")}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${sourceFilter === "organic"
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800"
                            }`}
                        >
                            <Globe className="w-3 h-3" />
                            Organic Signups ({organicCount})
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="relative overflow-hidden w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    {loading || (shopLoading && customers.length === 0) ? (
                        <div className="flex justify-center items-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="flex justify-center mb-4">
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-full border border-gray-100 dark:border-gray-800">
                                    <Users className="w-8 h-8 text-gray-400" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">No customers yet</h3>
                            <p className="mt-2 text-gray-500 text-sm max-w-sm mx-auto">
                                When customers register or place orders, they will appear here. Click &apos;Add Customer&apos; to create one manually.
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-full overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/80 dark:bg-gray-900">
                                        <th
                                            onClick={() => toggleSort("date")}
                                            className="px-5 py-3.5 font-bold text-gray-500 text-start text-[11px] uppercase tracking-widest cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none"
                                        >
                                            Date <SortIcon field="date" />
                                        </th>
                                        <th
                                            onClick={() => toggleSort("name")}
                                            className="px-5 py-3.5 font-bold text-gray-500 text-start text-[11px] uppercase tracking-widest cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none"
                                        >
                                            User <SortIcon field="name" />
                                        </th>
                                        <th className="px-5 py-3.5 font-bold text-gray-500 text-start text-[11px] uppercase tracking-widest">
                                            Location
                                        </th>
                                        <th className="px-5 py-3.5 font-bold text-gray-500 text-start text-[11px] uppercase tracking-widest">
                                            Source
                                        </th>
                                        <th
                                            onClick={() => toggleSort("orders")}
                                            className="px-5 py-3.5 font-bold text-gray-500 text-center text-[11px] uppercase tracking-widest cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none"
                                        >
                                            Orders <SortIcon field="orders" />
                                        </th>
                                        <th
                                            onClick={() => toggleSort("spent")}
                                            className="px-5 py-3.5 font-bold text-gray-500 text-start text-[11px] uppercase tracking-widest cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none"
                                        >
                                            Total Spent <SortIcon field="spent" />
                                        </th>
                                        <th className="px-5 py-3.5 font-bold text-gray-500 text-right text-[11px] uppercase tracking-widest">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                    {paginatedCustomers.map((customer) => (
                                        <tr key={customer.customerId} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors align-top group">
                                            {/* Date Column */}
                                            <td className="px-5 py-4 text-start">
                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                    {formatDateTime(customer.joinedAt || customer.createdAt)}
                                                </div>
                                                <div className="mt-1">
                                                    {(() => {
                                                        const rel = getRelativeTime(customer.joinedAt || customer.createdAt);
                                                        const d = new Date(customer.joinedAt || customer.createdAt);
                                                        const now = new Date();
                                                        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                                                        if (diffDays <= 7) {
                                                            return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">🟢 New</span>;
                                                        }
                                                        if ((customer.orderCount || 0) > 3) {
                                                            return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">🔵 Active</span>;
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            </td>

                                            {/* User Column */}
                                            <td className="px-5 py-4 text-start">
                                                <Link href={`/users/${customer.customerId}`} className="text-gray-400 hover:text-brand-500 text-[10px] font-mono mb-0.5 block transition-colors">{customer.customerId}</Link>
                                                <Link href={`/users/${customer.customerId}`} className="font-bold text-gray-900 dark:text-white/90 text-sm hover:text-brand-500 dark:hover:text-brand-400 transition-colors cursor-pointer">{customer.name || 'Unknown'}</Link>
                                                <div className="flex items-center gap-1 mt-0.5 text-gray-500 dark:text-gray-400 text-xs">
                                                    <span>📞</span>
                                                    <span>{customer.phone || '—'}</span>
                                                </div>
                                                {customer.email && (
                                                    <div className="text-gray-400 text-[11px] mt-0.5">✉️ {customer.email}</div>
                                                )}
                                            </td>

                                            {/* Location Column */}
                                            <td className="px-5 py-4 text-start">
                                                {customer.location ? (
                                                    <div className="flex items-start gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-brand-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                                {customer.location.area}
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                {customer.location.city}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : customer.savedAddresses && customer.savedAddresses.length > 0 ? (
                                                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                                                        <MapPin className="w-3.5 h-3.5 text-brand-400" />
                                                        <span>{customer.savedAddresses[0]?.area || customer.savedAddresses[0]?.city || `${customer.savedAddresses.length} saved`}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">—</span>
                                                )}
                                            </td>

                                            {/* Source Column */}
                                            <td className="px-5 py-4 text-start">
                                                {customer.source === "organic" ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                                        <Globe className="w-3 h-3" />
                                                        Organic
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                                        <Store className="w-3 h-3" />
                                                        Shop
                                                    </span>
                                                )}
                                            </td>

                                            {/* Orders Column */}
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-sm font-bold ${(customer.orderCount || 0) > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                                        {customer.orderCount || 0}
                                                    </span>
                                                    {customer.lastOrderAt && (
                                                        <span className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">
                                                            Last: {getRelativeTime(customer.lastOrderAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Total Spent Column */}
                                            <td className="px-5 py-4 text-start">
                                                <div className={`text-sm font-bold flex items-center gap-0.5 ${(customer.totalSpent || 0) > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                                    <IndianRupee className="w-3 h-3" />
                                                    {(customer.totalSpent || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                </div>
                                            </td>

                                            {/* Actions Column */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditCustomer(customer)}
                                                        className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors dark:hover:bg-brand-500/10"
                                                        title="Edit Customer"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {userRole !== 'staff' && (
                                                        <button
                                                            onClick={() => handleDeleteCustomer(customer.customerId, customer.name)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10"
                                                            title="Remove Customer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && filteredCustomers.length > 0 && (
                    <div className="mt-5 flex items-center justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing <span className="font-medium text-gray-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)}</span> of <span className="font-medium text-gray-900 dark:text-white">{filteredCustomers.length}</span> users
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm text-gray-600 dark:text-gray-300"
                            >
                                Previous
                            </button>
                            {getPageNumbers().map((page, i) => (
                                typeof page === "string" ? (
                                    <span key={`ellipsis-${i}`} className="px-2 text-sm text-gray-400">…</span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page as number)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                            ? "bg-brand-500 text-white shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm text-gray-600 dark:text-gray-300"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                shopId={selectedShopId || ""}
                onSuccess={fetchCustomers}
                customerToEdit={customerToEdit}
            />
        </ProtectedRoute>
    );
}
