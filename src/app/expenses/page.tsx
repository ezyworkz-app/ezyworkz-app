"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import apiClient from "@/lib/api/client";
import { Plus, WalletCards, Loader2, AlertCircle } from "lucide-react";
import { AddExpenseModal } from "./AddExpenseModal";

interface Expense {
    expenseId: string;
    category: string;
    amount: number;
    description?: string;
    date: string;
}

export default function ExpensesPage() {
    const { selectedShopId, isLoading: shopLoading } = useShop();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!shopLoading && selectedShopId) {
            fetchExpenses();
        } else if (!shopLoading && !selectedShopId) {
            setLoading(false);
            setError("No shop found. Please contact support.");
        }
    }, [selectedShopId, shopLoading]);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/shops/${selectedShopId}/expenses`);
            setExpenses(response.data.expenses || []);
        } catch (err: any) {
            setError(err.message || "Failed to load expenses");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric' 
        }).format(d);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Expenses</h1>
                        <p className="text-slate-400 mt-1">Manage and track your shop's expenses.</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Expense
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
                    ) : expenses.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="flex justify-center mb-4">
                                <div className="bg-slate-800 p-4 rounded-full">
                                    <WalletCards className="w-8 h-8 text-slate-400" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white">No expenses yet</h3>
                            <p className="mt-2 text-slate-400 max-w-sm mx-auto">
                                You haven't recorded any expenses. Click the button above to add your first expense.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-card-border bg-[#0B0F19] text-slate-400 text-sm">
                                        <th className="p-4 font-medium">Date</th>
                                        <th className="p-4 font-medium">Category</th>
                                        <th className="p-4 font-medium">Description</th>
                                        <th className="p-4 font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map((expense) => (
                                        <tr key={expense.expenseId} className="border-b border-card-border hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-white text-sm whitespace-nowrap">
                                                {formatDate(expense.date)}
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 capitalize">
                                                    {expense.category.replace('_', ' ').toLowerCase()}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-300 text-sm max-w-md truncate">
                                                {expense.description || "—"}
                                            </td>
                                            <td className="p-4 text-white font-semibold text-right whitespace-nowrap">
                                                {formatCurrency(expense.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <AddExpenseModal 
                    shopId={selectedShopId} 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={fetchExpenses} 
                />
            </main>
        </ProtectedRoute>
    );
}
