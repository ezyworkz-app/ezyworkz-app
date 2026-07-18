import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import apiClient from "@/lib/api/client";

const CATEGORIES = [
    { value: "BUILDING_ADVANCE", label: "Building Advance / Deposit (Fixed)" },
    { value: "EQUIPMENT", label: "Machinery & Equipment (Fixed)" },
    { value: "INITIAL_SETUP", label: "Initial Interior Setup (Fixed)" },
    { value: "LICENSING", label: "Licensing & Registration (Fixed)" },
    { value: "RENT", label: "Monthly Rent (Running)" },
    { value: "UTILITIES", label: "Utilities - Water, Electricity (Running)" },
    { value: "SALARY", label: "Staff Salary (Running)" },
    { value: "SUPPLIES", label: "Supplies - Detergent, etc. (Running)" },
    { value: "MAINTENANCE", label: "Maintenance & Repairs (Running)" },
    { value: "MARKETING", label: "Marketing & Advertising (Running)" },
    { value: "FOOD", label: "Food & Beverage (Running)" },
    { value: "OTHER", label: "Other" },
];

interface AddExpenseModalProps {
    shopId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    expenseToEdit?: {
        expenseId: string;
        category: string;
        amount: number;
        description?: string;
        date: string;
    } | null;
}

export function AddExpenseModal({ shopId, isOpen, onClose, onSuccess, expenseToEdit }: AddExpenseModalProps) {
    const [formData, setFormData] = useState({
        amount: "",
        category: "UTILITIES",
        description: "",
        date: new Date().toISOString().split('T')[0],
    });
    const [customCategoryName, setCustomCategoryName] = useState("");
    const [customCategoryType, setCustomCategoryType] = useState<"OPEX" | "CAPEX">("OPEX");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (expenseToEdit) {
            const isStandard = CATEGORIES.some(c => c.value === expenseToEdit.category);
            let cat = expenseToEdit.category;
            let customName = "";
            let customType: "OPEX" | "CAPEX" = "OPEX";
            
            if (!isStandard) {
                cat = "OTHER";
                if (expenseToEdit.category.startsWith("CAPEX_CUSTOM:")) {
                    customType = "CAPEX";
                    customName = expenseToEdit.category.split(":")[1].replace(/_/g, ' ');
                } else if (expenseToEdit.category.startsWith("OPEX_CUSTOM:")) {
                    customType = "OPEX";
                    customName = expenseToEdit.category.split(":")[1].replace(/_/g, ' ');
                }
            }

            setFormData({
                amount: expenseToEdit.amount.toString(),
                category: cat,
                description: expenseToEdit.description || "",
                date: new Date(expenseToEdit.date).toISOString().split('T')[0],
            });
            setCustomCategoryName(customName);
            setCustomCategoryType(customType);
        } else {
            setFormData({
                amount: "",
                category: "UTILITIES",
                description: "",
                date: new Date().toISOString().split('T')[0],
            });
            setCustomCategoryName("");
            setCustomCategoryType("OPEX");
        }
    }, [expenseToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!shopId) {
            setError("No shop selected.");
            return;
        }

        if (!formData.amount || isNaN(Number(formData.amount))) {
            setError("Please enter a valid amount.");
            return;
        }

        if (formData.category === "OTHER" && !customCategoryName.trim()) {
            setError("Please enter a custom category name.");
            return;
        }

        setLoading(true);
        setError(null);

        let finalCategory = formData.category;
        if (formData.category === "OTHER") {
            finalCategory = `${customCategoryType}_CUSTOM:${customCategoryName.trim().toUpperCase().replace(/\s+/g, '_')}`;
        }

        try {
            if (expenseToEdit) {
                await apiClient.put(`/shops/${shopId}/expenses/${expenseToEdit.expenseId}`, {
                    amount: Number(formData.amount),
                    category: finalCategory,
                    description: formData.description,
                    date: new Date(formData.date).toISOString(),
                });
            } else {
                await apiClient.post(`/shops/${shopId}/expenses`, {
                    amount: Number(formData.amount),
                    category: finalCategory,
                    description: formData.description,
                    date: new Date(formData.date).toISOString(),
                });
            }

            onSuccess();
            onClose();
            // Reset form
            setFormData({
                amount: "",
                category: "UTILITIES",
                description: "",
                date: new Date().toISOString().split('T')[0],
            });
        } catch (err: any) {
            setError(err.message || "Failed to create expense");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-up">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl overflow-hidden">
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex justify-between items-center mb-6 relative">
                    <h2 className="text-xl font-bold text-gray-900">{expenseToEdit ? "Edit Expense" : "Record Expense"}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 relative">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Amount (₹)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Category</label>
                        <select
                            required
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {formData.category === "OTHER" && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1.5">Custom Category Name</label>
                                <input
                                    type="text"
                                    required
                                    value={customCategoryName}
                                    onChange={(e) => setCustomCategoryName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                                    placeholder="e.g. Software Subscriptions"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1.5">Expense Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="customType"
                                            value="OPEX"
                                            checked={customCategoryType === "OPEX"}
                                            onChange={() => setCustomCategoryType("OPEX")}
                                            className="text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700">Running Cost (OPEX)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="customType"
                                            value="CAPEX"
                                            checked={customCategoryType === "CAPEX"}
                                            onChange={() => setCustomCategoryType("CAPEX")}
                                            className="text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700">Fixed Cost (CAPEX)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1.5">Description (Optional)</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none h-20"
                            placeholder="e.g., Initial store setup"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors bg-white border border-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {expenseToEdit ? "Update Expense" : "Save Expense"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
