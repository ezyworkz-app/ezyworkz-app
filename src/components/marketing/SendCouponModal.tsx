"use client";
import React, { useState } from "react";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { X } from "lucide-react";

interface SendCouponModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (data: { couponCode: string; title: string; body: string }) => Promise<void>;
    userName: string;
    segment: string;
}

const SendCouponModal: React.FC<SendCouponModalProps> = ({ isOpen, onClose, onSend, userName, segment }) => {
    const [couponCode, setCouponCode] = useState("EZYWORKZ20");
    const [title, setTitle] = useState("We Miss You! 🎁");
    const [body, setBody] = useState(`Hi ${userName}, get 20% off your next order with code EZYWORKZ20. Valid across all shops!`);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSend({ couponCode, title, body });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden flex flex-col md:flex-row">
                {/* Left Side: Preview */}
                <div className="w-full md:w-1/2 bg-gray-50 dark:bg-white/[0.02] p-8 border-r border-gray-100 dark:border-white/5 flex flex-col justify-center">
                    <div className="mb-6">
                        <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest bg-brand-50 px-2 py-1 rounded-md">Live Preview</span>
                        <h4 className="text-xl font-black text-gray-900 dark:text-white mt-2 tracking-tight">Notification Glance</h4>
                    </div>
                    
                    {/* Phone Mockup Preview */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-xl border border-gray-200 dark:border-white/10 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-brand-500/30">L</div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Ezyworkz</span>
                                <span className="text-[10px] font-medium text-gray-300">Just now</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h5 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{title || "Your Title Here"}</h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">{body || "Your message content will appear here..."}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-brand-500">OPEN APP</span>
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                            </div>
                        </div>
                    </div>
                    
                    <p className="mt-8 text-[10px] text-gray-400 text-center font-medium italic">
                        "Your campaign will be delivered to {userName}'s device matching their timezone settings."
                    </p>
                </div>

                {/* Right Side: Form */}
                <form onSubmit={handleSubmit} className="w-full md:w-1/2 p-8 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Campaign Config</h3>
                            <p className="text-xs font-medium text-gray-500 mt-1">Refining segment: <span className="text-brand-500 font-bold">{segment}</span></p>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Exclusive Code</label>
                            <Input
                                placeholder="e.g. SPECIAL25"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                required
                                className="font-mono font-bold text-brand-600"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Catchy Headline</label>
                            <Input
                                placeholder="Notification title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Personalized Message</label>
                            <textarea
                                className="w-full h-32 p-4 text-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none shadow-inner"
                                placeholder="Mention the value proposition..."
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="submit"
                            className="flex-1 h-12 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? "Launching..." : "Launch Campaign"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SendCouponModal;
