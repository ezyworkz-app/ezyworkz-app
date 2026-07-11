"use client";

import { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import apiClient from "@/lib/api/client";
import { Users, Loader2, AlertCircle, MapPin, Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
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
}

export default function UsersClient({ initialCustomers, error: initialError }: { initialCustomers: Customer[], error?: string }) {
    const { selectedShopId, isLoading: shopLoading } = useShop();
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(initialError || "");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // If shop changes after initial load, fetch new customers
    useEffect(() => {
        if (!shopLoading && !selectedShopId) {
            setError("No shop found. Please contact support.");
        } else if (!shopLoading && selectedShopId) {
            // Since SSR loads the default shop, we only want to refetch if they manually change the shop
            // If they change shops, initialError might still be set, but we will clear it on fetch
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

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        return new Intl.DateTimeFormat('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric'
        }).format(d);
    };

    const filteredCustomers = useMemo(() => {
        if (!searchQuery.trim()) return customers;
        const query = searchQuery.toLowerCase();
        return customers.filter(c => 
            (c.name && c.name.toLowerCase().includes(query)) ||
            (c.phone && c.phone.includes(query)) ||
            (c.email && c.email.toLowerCase().includes(query))
        );
    }, [customers, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE));
    const paginatedCustomers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredCustomers, currentPage]);

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">Users</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your shop's users.</p>
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

                <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        Showing {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
                    </div>
                </div>

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
                                When customers register or place orders, they will appear here. Click 'Add Customer' to create one manually.
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-full overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-900">
                                        <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs uppercase tracking-widest font-black">Customer</th>
                                        <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs uppercase tracking-widest font-black">Contact</th>
                                        <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs uppercase tracking-widest font-black">Addresses</th>
                                        <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs uppercase tracking-widest font-black">Joined</th>
                                        <th className="px-5 py-3 font-medium text-gray-500 text-right text-xs uppercase tracking-widest font-black">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                    {paginatedCustomers.map((customer) => (
                                        <tr key={customer.customerId} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors align-top group">
                                            <td className="px-5 py-4 text-start">
                                                <div className="font-bold text-gray-900 dark:text-white/90 text-sm">{customer.name || 'Unknown'}</div>
                                                <div className="text-gray-400 text-[10px] mt-0.5 font-mono">{customer.customerId?.split('-')[0] || customer.customerId || '—'}</div>
                                            </td>
                                            <td className="px-5 py-4 text-start">
                                                <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">{customer.phone}</div>
                                                {customer.email && <div className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">{customer.email}</div>}
                                            </td>
                                            <td className="px-5 py-4 text-start">
                                                {customer.savedAddresses && customer.savedAddresses.length > 0 ? (
                                                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 text-sm font-medium">
                                                        <MapPin className="w-3.5 h-3.5 text-brand-400" />
                                                        <span>{customer.savedAddresses.length} saved</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-start">
                                                <div className="text-gray-600 dark:text-gray-300 text-sm font-medium whitespace-nowrap">
                                                    {formatDate(customer.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditCustomer(customer)}
                                                        className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors dark:hover:bg-brand-500/10"
                                                        title="Edit Customer"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCustomer(customer.customerId, customer.name)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10"
                                                        title="Remove Customer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
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
                {!loading && customers.length > 0 && totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Page <span className="font-medium text-gray-900 dark:text-white">{currentPage}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
                            >
                                <ChevronRight className="w-4 h-4" />
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
