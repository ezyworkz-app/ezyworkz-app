"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { Flag, ArrowUpIcon, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

interface RevenueRoadmapProps {
    sales: number;
    initialTarget?: number;
}

export default function RevenueRoadmap({ sales, initialTarget = 300000 }: RevenueRoadmapProps) {
    const [target, setTarget] = useState(initialTarget);
    
    // Date Logic
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysRemaining = Math.max(daysInMonth - currentDay + 1, 1);
    const daysPassed = currentDay;

    // Load target from localStorage and sync with other components
    useEffect(() => {
        const loadTarget = () => {
            const saved = localStorage.getItem('monthly_revenue_target');
            if (saved) {
                setTarget(Number(saved));
            }
        };

        loadTarget();

        // Listen for internal target updates from the gauge
        window.addEventListener('revenue_target_updated', loadTarget);
        return () => window.removeEventListener('revenue_target_updated', loadTarget);
    }, []);

    const remaining = Math.max(target - sales, 0);
    const requiredDaily = remaining / daysRemaining;
    const currentDailyAvg = sales / daysPassed;
    const progress = Math.min((sales / target) * 100, 100);

    // Pace Logic
    const isAhead = currentDailyAvg >= requiredDaily;
    const paceDiff = Math.abs(currentDailyAvg - requiredDaily);
    
    return (
        <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900/40 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
                        <Flag className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Revenue Roadmap</h3>
                        <p className="text-[10px] font-medium text-gray-400">Strategic Pace Analysis</p>
                    </div>
                </div>

                {/* Pace Status Badge */}
                {progress < 100 ? (
                    <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 border ${
                        isAhead 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20' 
                        : 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20'
                    }`}>
                        {isAhead ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                        <span className="text-[10px] font-black uppercase tracking-tight">
                            {isAhead ? 'On Track' : 'Behind Pace'}
                        </span>
                    </div>
                ) : (
                    <div className="px-3 py-1 rounded-full flex items-center gap-1.5 border bg-brand-50 border-brand-100 text-brand-600 dark:bg-brand-500/10 dark:border-brand-500/20">
                        <TrendingUp className="size-3" />
                        <span className="text-[10px] font-black uppercase tracking-tight">Target Met</span>
                    </div>
                )}
            </div>
            
            <div className="space-y-6">
                {/* Visual Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Achievement Progress</span>
                        <span className="text-lg font-black text-gray-900 dark:text-white">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
                        <div 
                            className="h-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-1000 ease-out shadow-lg shadow-brand-200 dark:shadow-none"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                    {/* Target Row */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-400">Monthly Target</span>
                        <span className="text-base font-black text-gray-900 dark:text-white">
                            {formatCurrency(target)}
                        </span>
                    </div>

                    {/* Earned Row */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-400">Total Earned</span>
                        <div className="flex items-center gap-2 text-emerald-600">
                            <span className="text-base font-black">{formatCurrency(sales)}</span>
                            <ArrowUpIcon className="size-3" />
                        </div>
                    </div>

                    {/* Gap Row */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-400">Remaining Gap</span>
                        <span className="text-base font-black text-brand-600">
                            {formatCurrency(remaining)}
                        </span>
                    </div>

                    {/* Daily Rate Row - Call to Action */}
                    <div className="mt-8 p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 dark:from-gray-900/60 dark:to-gray-900 dark:border-gray-800 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:scale-125 transition-transform">
                            <TrendingUp className="size-16 text-brand-500" />
                        </div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-brand-500">Required Daily Pace</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                                        {formatCurrency(requiredDaily)}
                                    </span>
                                </div>
                                <span className="block text-[10px] font-medium text-gray-400">
                                    {daysRemaining} days strictly remaining
                                </span>
                            </div>
                            <div className="text-right">
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-gray-800 border shadow-sm ${isAhead ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    <span className="text-[9px] font-black">
                                        {isAhead ? 'EXCEEDING AVG' : 'ABOVE CURRENT AVG'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
