import { useState } from "react";
import { Loader2, X } from "lucide-react";
import apiClient from "@/lib/api/client";

const CATEGORIES = [
    { value: "UTILITIES", label: "Utilities (Water, Electricity)" },
    { value: "MAINTENANCE", label: "Maintenance & Repairs" },
    { value: "SUPPLIES", label: "Supplies (Detergent, Softener)" },
    { value: "RENT", label: "Rent" },
    { value: "SALARY", label: "Staff Salary" },
    { value: "MARKETING", label: "Marketing" },
    { value: "OTHER", label: "Other" },
];

interface AddExpenseModalProps {
    shopId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddExpenseModal({ shopId, isOpen, onClose, onSuccess }: AddExpenseModalProps) {
    const [formData, setFormData] = useState({
        amount: "",
        category: "UTILITIES",
        description: "",
        date: new Date().toISOString().split('T')[0],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

        setLoading(true);
        setError(null);

        try {
            await apiClient.post(`/shops/${shopId}/expenses`, {
                amount: Number(formData.amount),
                category: formData.category,
                description: formData.description,
                date: new Date(formData.date).toISOString(),
            });

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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-[#0e1424] border border-card-border rounded-3xl p-6 shadow-2xl overflow-hidden">
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex justify-between items-center mb-6 relative">
                    <h2 className="text-xl font-bold text-white">Record Expense</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 relative">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Amount (₹)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#0e1424] border border-card-border text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#0e1424] border border-card-border text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
                        <select
                            required
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0e1424] border border-card-border text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Description (Optional)</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0e1424] border border-card-border text-white focus:outline-none focus:border-teal-500/50 transition-colors resize-none h-20"
                            placeholder="e.g., Monthly electricity bill"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Expense
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
