"use client";

import { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import apiClient from "@/lib/api/client";
import { Plus, WalletCards, Loader2, AlertCircle, IndianRupee, TrendingDown, Building2, Trash2, Edit2, ChevronLeft, ChevronRight, PieChart, Activity } from "lucide-react";
import { AddExpenseModal } from "./AddExpenseModal";
import { CategoryDonutChart, SpendingTrendChart } from "@/components/ecommerce/ExpenseCharts";
import Link from "next/link";

interface Expense {
    expenseId: string;
    category: string;
    amount: number;
    description?: string;
    date: string;
}

interface ExpensesViewProps {
    activeTab: "ALL" | "OPEX" | "CAPEX";
    initialExpenses?: Expense[];
    error?: string;
}

function StatCard({ title, amount, icon, color, trend }: { title: string, amount: number, icon: React.ReactNode, color: "purple" | "blue" | "orange", trend?: number }) {
    const colors = {
        purple: "bg-purple-100 text-purple-600",
        blue: "bg-blue-100 text-blue-600",
        orange: "bg-orange-100 text-orange-600"
    };
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4 relative overflow-hidden">
            <div className={`${colors[color]} p-4 rounded-xl flex-shrink-0`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl font-bold text-gray-900 truncate">{new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                    }).format(amount)}</p>
                    {trend !== undefined && (
                        <span className={`text-xs font-semibold ${trend > 0 ? "text-red-600" : trend < 0 ? "text-emerald-600" : "text-gray-400"}`}>
                            {trend > 0 ? "↑" : trend < 0 ? "↓" : ""}{Math.abs(trend)}% MoM
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export function ExpensesView({ activeTab, initialExpenses = [], error: initialError = "" }: ExpensesViewProps) {
    const { selectedShopId, isLoading: shopLoading } = useShop();
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(initialError);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [timeFilter, setTimeFilter] = useState<"THIS_MONTH" | "LAST_MONTH" | "ALL_TIME">("THIS_MONTH");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleDelete = async (expenseId: string) => {
        if (!confirm("Are you sure you want to delete this expense?")) return;
        
        try {
            setError("");
            setDeletingId(expenseId);
            await apiClient.delete(`/shops/${selectedShopId}/expenses/${expenseId}`);
            setExpenses(prev => prev.filter(e => e.expenseId !== expenseId));
        } catch (err: any) {
            setError(err.message || "Failed to delete expense");
        } finally {
            setDeletingId(null);
        }
    };

    useEffect(() => {
        if (!shopLoading && !selectedShopId) {
            setError("No shop found. Please contact support.");
        } else if (!shopLoading && selectedShopId) {
            if (expenses.length === 0 && !initialError) {
                fetchExpenses();
            }
        }
    }, [selectedShopId, shopLoading]);

    const fetchExpenses = async () => {
        if (!selectedShopId) return;
        try {
            setLoading(true);
            setError("");
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

    const isCapital = (cat: string) => ["BUILDING_ADVANCE", "EQUIPMENT", "INITIAL_SETUP", "LICENSING", "CAPITAL_COST"].includes(cat) || cat.startsWith("CAPEX_CUSTOM:");

    const formatCategoryLabel = (cat: string) => {
        if (cat.startsWith("CAPEX_CUSTOM:") || cat.startsWith("OPEX_CUSTOM:")) {
            return cat.split(":")[1].replace(/_/g, ' ');
        }
        return cat.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const filteredExpenses = useMemo(() => expenses.filter(exp => {
        // First filter by type
        if (activeTab === "CAPEX" && !isCapital(exp.category)) return false;
        if (activeTab === "OPEX" && isCapital(exp.category)) return false;

        // Apply time filter
        if (timeFilter === "ALL_TIME") return true;

        const expDate = new Date(exp.date);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        if (timeFilter === "THIS_MONTH") {
            return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
        }
        
        if (timeFilter === "LAST_MONTH") {
            const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
            return expDate.getMonth() === lastMonthDate.getMonth() && expDate.getFullYear() === lastMonthDate.getFullYear();
        }
        
        return true;
    }), [expenses, activeTab, timeFilter]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, timeFilter, filteredExpenses.length]);

    const metrics = useMemo(() => {
        let total = 0;
        let capital = 0;
        let operatingTotal = 0;
        let lastMonthTotal = 0;
        let lastMonthCapital = 0;
        let lastMonthOperating = 0;

        const categoryTotals: Record<string, number> = {};

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);

        filteredExpenses.forEach(exp => {
            total += exp.amount;
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
            
            if (isCapital(exp.category)) {
                capital += exp.amount;
            } else {
                operatingTotal += exp.amount;
            }
        });

        if (timeFilter === "THIS_MONTH") {
            expenses.forEach(exp => {
                const expDate = new Date(exp.date);
                if (expDate.getMonth() === lastMonthDate.getMonth() && expDate.getFullYear() === lastMonthDate.getFullYear()) {
                    if (activeTab === "ALL" || (activeTab === "CAPEX" && isCapital(exp.category)) || (activeTab === "OPEX" && !isCapital(exp.category))) {
                        lastMonthTotal += exp.amount;
                        if (isCapital(exp.category)) lastMonthCapital += exp.amount;
                        else lastMonthOperating += exp.amount;
                    }
                }
            });
        }

        const calcTrend = (current: number, previous: number) => {
            if (previous === 0) return undefined;
            return Math.round(((current - previous) / previous) * 100);
        };

        return { 
            total, capital, operatingTotal, categoryTotals,
            trendTotal: calcTrend(total, lastMonthTotal),
            trendCapital: calcTrend(capital, lastMonthCapital),
            trendOperating: calcTrend(operatingTotal, lastMonthOperating)
        };
    }, [filteredExpenses, expenses, activeTab, timeFilter]);

    const paginatedExpenses = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredExpenses.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredExpenses, currentPage]);

    const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8 bg-gray-50 min-h-screen">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Expenses Dashboard</h1>
                        <p className="text-gray-500 mt-1">Strategic overview of your shop's cash outflow.</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Record Expense
                    </button>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm font-medium text-red-600">{error}</div>
                    </div>
                )}

                <div className="flex gap-2 mb-6">
                    {(["THIS_MONTH", "LAST_MONTH", "ALL_TIME"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setTimeFilter(tab)}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm ${
                                timeFilter === tab 
                                    ? "bg-gray-900 text-white border-transparent" 
                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            {tab === "THIS_MONTH" ? "This Month" : tab === "LAST_MONTH" ? "Last Month" : "All Time"}
                        </button>
                    ))}
                </div>

                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {activeTab === "ALL" && (
                            <>
                                <StatCard title="Total Expenses" amount={metrics.total} trend={metrics.trendTotal} icon={<IndianRupee className="w-6 h-6" />} color="purple" />
                                <StatCard title="Fixed Cost (CAPEX)" amount={metrics.capital} trend={metrics.trendCapital} icon={<Building2 className="w-6 h-6" />} color="blue" />
                                <StatCard title="Running Cost (OPEX)" amount={metrics.operatingTotal} trend={metrics.trendOperating} icon={<TrendingDown className="w-6 h-6" />} color="orange" />
                            </>
                        )}
                        {activeTab === "CAPEX" && (
                            <>
                                <StatCard title="Total Fixed Cost" amount={metrics.capital} trend={metrics.trendCapital} icon={<Building2 className="w-6 h-6" />} color="blue" />
                                {Object.entries(metrics.categoryTotals).filter(([cat]) => isCapital(cat)).map(([cat, amount]) => (
                                    <StatCard key={cat} title={formatCategoryLabel(cat)} amount={amount} icon={<Building2 className="w-6 h-6" />} color="blue" />
                                ))}
                            </>
                        )}
                        {activeTab === "OPEX" && (
                            <>
                                <StatCard title="Total Running Cost" amount={metrics.operatingTotal} trend={metrics.trendOperating} icon={<TrendingDown className="w-6 h-6" />} color="orange" />
                                {Object.entries(metrics.categoryTotals).filter(([cat]) => !isCapital(cat)).map(([cat, amount]) => (
                                    <StatCard key={cat} title={formatCategoryLabel(cat)} amount={amount} icon={<TrendingDown className="w-6 h-6" />} color="orange" />
                                ))}
                            </>
                        )}
                    </div>
                )}

                {!loading && filteredExpenses.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 text-gray-800 font-bold">
                                <Activity className="w-5 h-5 text-purple-600" />
                                <h3>Spending Trend</h3>
                            </div>
                            <SpendingTrendChart expenses={filteredExpenses} />
                        </div>
                        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 text-gray-800 font-bold">
                                <PieChart className="w-5 h-5 text-purple-600" />
                                <h3>Category Breakdown</h3>
                            </div>
                            <CategoryDonutChart expenses={filteredExpenses} />
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900">Recent Transactions</h3>
                        <span className="text-sm font-medium text-gray-500">{filteredExpenses.length} total entries</span>
                    </div>
                    {loading || (shopLoading && expenses.length === 0) ? (
                        <div className="flex justify-center items-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="flex justify-center mb-4">
                                <div className="bg-gray-100 p-4 rounded-full">
                                    <WalletCards className="w-8 h-8 text-gray-400" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">No expenses found</h3>
                            <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                                No expenses exist for this category or time period. Click the button above to add an expense.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-white text-gray-500 text-sm">
                                            <th className="p-4 font-medium pl-6">Date</th>
                                            <th className="p-4 font-medium">Category</th>
                                            <th className="p-4 font-medium">Description</th>
                                            <th className="p-4 font-medium text-right">Amount</th>
                                            <th className="p-4 font-medium text-right pr-6">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedExpenses.map((expense) => (
                                            <tr key={expense.expenseId} className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
                                                <td className="p-4 pl-6 text-gray-900 text-sm whitespace-nowrap">
                                                    {formatDate(expense.date)}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                                        isCapital(expense.category) 
                                                            ? "bg-blue-50 text-blue-700 border border-blue-200" 
                                                            : "bg-orange-50 text-orange-700 border border-orange-200"
                                                    }`}>
                                                        {formatCategoryLabel(expense.category)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-600 text-sm max-w-xs truncate">
                                                    {expense.description || "—"}
                                                </td>
                                                <td className="p-4 text-gray-900 font-bold text-right whitespace-nowrap">
                                                    {formatCurrency(expense.amount)}
                                                </td>
                                                <td className="p-4 text-right pr-6 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleEdit(expense)}
                                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors mr-1"
                                                        title="Edit expense"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(expense.expenseId)}
                                                        disabled={deletingId === expense.expenseId}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Delete expense"
                                                    >
                                                        {deletingId === expense.expenseId ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
                                    <div className="text-sm text-gray-500 pl-2">
                                        Showing <span className="font-medium text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredExpenses.length)}</span> of <span className="font-medium text-gray-900">{filteredExpenses.length}</span> entries
                                    </div>
                                    <div className="flex items-center gap-2 pr-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <div className="text-sm font-medium text-gray-700 px-2">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <AddExpenseModal 
                    shopId={selectedShopId || ""} 
                    isOpen={isModalOpen} 
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingExpense(null);
                    }} 
                    onSuccess={() => {
                        fetchExpenses();
                        setEditingExpense(null);
                    }} 
                    expenseToEdit={editingExpense}
                />
            </main>
        </ProtectedRoute>
    );
}
