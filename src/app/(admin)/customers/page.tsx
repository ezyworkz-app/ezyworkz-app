"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import apiClient from "@/lib/api/client";
import { Users, Loader2, AlertCircle, MapPin, Plus, Edit2 } from "lucide-react";
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

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric'
        }).format(d);
    };

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Customers</h1>
                        <p className="text-slate-400 mt-1">Manage your shop's customers.</p>
                    </div>
                    <button
                        onClick={handleAddCustomer}
                        className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Customer
                    </button>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm font-medium text-red-400">{error}</div>
                    </div>
                )}

                <div className="bg-[#0e1424] rounded-3xl border border-card-border shadow-sm overflow-hidden">
                    {loading || shopLoading ? (
                        <div className="flex justify-center items-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="flex justify-center mb-4">
                                <div className="bg-slate-800 p-4 rounded-full">
                                    <Users className="w-8 h-8 text-slate-400" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white">No customers yet</h3>
                            <p className="mt-2 text-slate-400 max-w-sm mx-auto">
                                When customers register or place orders, they will appear here. Click 'Add Customer' to create one manually.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-card-border bg-[#0B0F19] text-slate-400 text-sm">
                                        <th className="p-4 font-medium">Customer</th>
                                        <th className="p-4 font-medium">Contact</th>
                                        <th className="p-4 font-medium">Addresses</th>
                                        <th className="p-4 font-medium">Joined</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map((customer) => (
                                        <tr key={customer.customerId} className="border-b border-card-border hover:bg-white/5 transition-colors group">
                                            <td className="p-4">
                                                <div className="text-white font-medium">{customer.name}</div>
                                                <div className="text-slate-500 text-xs mt-0.5 font-mono">{customer.customerId.split('-')[0] || customer.customerId}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-slate-300 text-sm">{customer.phone}</div>
                                                {customer.email && <div className="text-slate-500 text-xs mt-0.5">{customer.email}</div>}
                                            </td>
                                            <td className="p-4">
                                                {customer.savedAddresses && customer.savedAddresses.length > 0 ? (
                                                    <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                                                        <MapPin className="w-3.5 h-3.5 text-teal-500" />
                                                        <span>{customer.savedAddresses.length} saved</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 text-sm">—</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-slate-400 text-sm whitespace-nowrap">
                                                {formatDate(customer.createdAt)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleEditCustomer(customer)}
                                                    className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Edit Customer"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
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
