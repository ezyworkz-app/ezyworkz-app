"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, Loader2, AlertCircle, Store } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
        <div className="flex-1 min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 animate-fade-in-up">
                <div className="flex justify-center">
                    <div className="bg-[#0e1424] border border-card-border p-4 rounded-2xl shadow-lg relative">
                        <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-2xl" />
                        <Store className="w-10 h-10 text-teal-400 relative z-10" />
                    </div>
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-white">
                    Shop Portal
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                    Sign in to manage your laundromat
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="bg-[#0e1424] py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-card-border backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute -right-16 -top-16 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

                    {errorMsg && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 relative z-10">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm font-medium text-red-400">{errorMsg}</div>
                        </div>
                    )}

                    <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">
                                Email Address
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 border border-card-border rounded-xl focus:outline-none focus:border-teal-500/50 sm:text-sm text-white bg-[#0e1424] transition-colors"
                                    placeholder="shop@ezyworkz.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">
                                Password
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 border border-card-border rounded-xl focus:outline-none focus:border-teal-500/50 sm:text-sm text-white bg-[#0e1424] transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
