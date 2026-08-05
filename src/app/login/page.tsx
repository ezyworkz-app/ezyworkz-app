"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        try {
            await login({ email, password });
        } catch (err: any) {
            setErrorMsg(err.message || "Invalid credentials. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-[#0b0f19] relative overflow-hidden transition-colors">
            {/* Ambient Background Glows */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-700/15 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md space-y-8 relative z-10">
                {/* Header / Logo */}
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl shadow-brand-500/10 flex items-center justify-center">
                            <Image
                                src="/logo-dark.png"
                                alt="Ezyworkz Logo"
                                width={140}
                                height={45}
                                className="h-10 w-auto object-contain"
                                priority
                                unoptimized
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                            Shop Portal
                        </h2>
                        <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Sign in to manage your store, orders & operations
                        </p>
                    </div>
                </div>

                {/* Card Container */}
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl shadow-gray-200/50 dark:shadow-none sm:rounded-3xl sm:px-10 border border-gray-200/80 dark:border-gray-800">
                    {errorMsg && (
                        <div className="mb-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">{errorMsg}</div>
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                Email Address
                            </label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 transition-all"
                                    placeholder="shop@ezyworkz.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                Password
                            </label>
                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-brand-500/25 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition-all"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Sign In to Portal"
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer note */}
                <div className="text-center flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                    <ShieldCheck size={14} className="text-brand-500" />
                    <span>Ezyworkz Secure Shop Authentication</span>
                </div>
            </div>
        </div>
    );
}
