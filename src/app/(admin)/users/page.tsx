"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import apiClient from "@/lib/api/client";
import { Users, Loader2, AlertCircle, MapPin, Plus, Edit2, Trash2 } from "lucide-react";
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

export default function CustomersPage() {
    const { selectedShopId, isLoading: shopLoading } = useShop();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

    useEffect(() => {
        if (!shopLoading && selectedShopId) {
            fetchCustomers();
        } else if (!shopLoading && !selectedShopId) {
            setLoading(false);
            setError("No shop found. Please contact support.");
        }
    }, [selectedShopId, shopLoading]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/customers/${selectedShopId}`);
            setCustomers(response.data.data || response.data || []);
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

                <div className="relative overflow-hidden w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    {loading || shopLoading ? (
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
                                    {customers.map((customer) => (
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
