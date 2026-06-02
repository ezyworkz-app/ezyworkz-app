"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import apiClient from "@/lib/api/client";

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    shopId: string;
    onSuccess: () => void;
    customerToEdit?: {
        customerId: string;
        name: string;
        email: string;
        phone: string;
    } | null;
}

export function CustomerModal({ isOpen, onClose, shopId, onSuccess, customerToEdit }: CustomerModalProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (customerToEdit) {
            setName(customerToEdit.name || "");
            setPhone(customerToEdit.phone || "");
            setEmail(customerToEdit.email || "");
        } else {
            setName("");
            setPhone("");
            setEmail("");
        }
        setError("");
    }, [customerToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (customerToEdit) {
                await apiClient.put(`/customers/${shopId}/${customerToEdit.customerId}`, {
                    name,
                    email,
                });
            } else {
                await apiClient.post(`/customers/${shopId}`, {
                    name,
                    phone,
                    email,
                });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to save customer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0e1424] border border-card-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-semibold text-white">
                        {customerToEdit ? "Edit Customer" : "Add New Customer"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#151b2b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Phone Number</label>
                        <input
                            type="tel"
                            required={!customerToEdit}
                            disabled={!!customerToEdit} // Phone usually isn't editable in the backend for users, or requires auth flow
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-[#151b2b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="+91 9876543210"
                        />
                        {customerToEdit && (
                            <p className="text-xs text-slate-500">Phone numbers cannot be changed.</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Email Address (Optional)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#151b2b] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-300 font-medium hover:bg-white/5 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-400 focus:ring-2 focus:ring-teal-500/50 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Customer"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
