"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#090b14] relative overflow-hidden transition-colors selection:bg-[#17E5A7]/30">
            {/* Dynamic Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#17E5A7]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-[#86EF53]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
                
                {/* Subtle Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNSkiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
            </div>

            <div className="w-full max-w-[420px] relative z-10 px-5 sm:px-0">
                {/* Header Container */}
                <div className="text-center mb-10">
                    <div className="inline-flex justify-center items-center mb-4 relative">
                        {/* Glow behind logo */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#17E5A7] to-[#86EF53] blur-2xl opacity-20 dark:opacity-30 rounded-full scale-150"></div>
                        <div className="relative">
                            <Image
                                src="/ezyworkz_logo_new.svg"
                                alt="Ezyworkz Logo"
                                width={200}
                                height={60}
                                className="h-14 sm:h-16 w-auto object-contain drop-shadow-md"
                                priority
                                unoptimized
                            />
                        </div>
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Sign in to manage your store & operations
                    </p>
                </div>

                {/* Main Auth Card */}
                <div className="bg-white/80 dark:bg-[#11141f]/80 backdrop-blur-2xl p-7 sm:p-10 shadow-2xl shadow-gray-200/50 dark:shadow-black/50 rounded-3xl border border-gray-100 dark:border-white/[0.05] relative group">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-[#17E5A7] to-transparent opacity-50 group-hover:w-1/2 transition-all duration-500"></div>

                    {errorMsg && (
                        <div className="mb-6 bg-rose-50/80 dark:bg-rose-500/10 backdrop-blur-md border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm font-medium text-rose-600 dark:text-rose-400">{errorMsg}</div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider pl-1">
                                Email Address
                            </label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within/input:text-[#17E5A7] transition-colors">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-[#0b0f19]/50 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17E5A7]/30 focus:border-[#17E5A7] text-base font-medium text-gray-900 dark:text-white placeholder:text-gray-400 transition-all hover:bg-gray-100 dark:hover:bg-[#0b0f19]"
                                    placeholder="shop@ezyworkz.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center pl-1 pr-1">
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Password
                                </label>
                            </div>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within/input:text-[#17E5A7] transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-[#0b0f19]/50 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#17E5A7]/30 focus:border-[#17E5A7] text-base font-medium text-gray-900 dark:text-white placeholder:text-gray-400 transition-all hover:bg-gray-100 dark:hover:bg-[#0b0f19]"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="relative w-full flex justify-center items-center py-4 px-4 rounded-xl text-base font-bold text-gray-900 bg-gradient-to-r from-[#17E5A7] to-[#86EF53] hover:from-[#14d399] hover:to-[#7be049] focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#090b14] focus:ring-[#17E5A7] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] shadow-lg shadow-[#17E5A7]/25 overflow-hidden group/btn"
                            >
                                {/* Shine effect */}
                                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover/btn:animate-shine" />
                                
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <div className="flex items-center gap-2 relative z-10">
                                        Sign In to Portal
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer note */}
                <div className="mt-8 text-center flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <ShieldCheck size={16} className="text-[#17E5A7]" />
                    <span>Ezyworkz Secure Shop Authentication</span>
                </div>
            </div>
            
            {/* Custom Animation Styles */}
            <style jsx global>{`
                @keyframes shine {
                    100% { left: 200%; }
                }
                .animate-shine {
                    animation: shine 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}

