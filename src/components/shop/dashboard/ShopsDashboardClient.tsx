"use client";
import React, { useState, useEffect } from "react";
import { ShopDetailedMetrics } from "./ShopDetailedMetrics";
import { TopShopsTable } from "./TopShopsTable";
import { UserTrendChart } from "@/components/users/UserTrendChart"; // Reusing for shops
import { getDashboardStats } from "@/lib/actions/dashboard";
import { ChevronDown, RefreshCw, BarChart, Rocket } from "lucide-react";

interface ShopsDashboardClientProps {
    initialStats: any;
}

export const ShopsDashboardClient = ({ initialStats }: ShopsDashboardClientProps) => {
    const [stats, setStats] = useState(initialStats);
    const [range, setRange] = useState("Last 30 days");
    const [isLoading, setIsLoading] = useState(false);

    const ranges = [
        "Today",
        "Last 7 days",
        "Last 30 days",
        "Last 3 months",
        "Last 12 months"
    ];

    const fetchStats = async (selectedRange: string) => {
        setIsLoading(true);
        try {
            const data = await getDashboardStats(selectedRange);
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch shops stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (range !== "Last 30 days") {
            fetchStats(range);
        }
    }, [range]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                        Shops Ecosystem Analytics
                        {isLoading && <RefreshCw className="animate-spin text-brand-500" size={16} />}
                    </h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Performance overview across all partner merchants.</p>
                </div>

                <div className="relative group min-w-[160px]">
                    <select
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                        className="w-full h-10 pl-4 pr-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all uppercase tracking-wider hover:border-brand-500/30"
                    >
                        {ranges.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-brand-500 transition-colors" size={14} />
                </div>
            </div>

            {/* Top Level KPIs */}
            <ShopDetailedMetrics stats={stats} />

            <div className="space-y-6 pt-4">
                {/* Trend Charts */}
                <div className="grid grid-cols-1 gap-6">
                    <UserTrendChart 
                        title="Shop Onboarding Growth"
                        categories={stats?.charts?.shopTrends?.categories || []}
                        currentSeries={stats?.charts?.shopTrends?.current || []}
                        previousSeries={stats?.charts?.shopTrends?.previous || []}
                        currentLabel="Current Period"
                        previousLabel="Previous Period"
                        color="#6366f1"
                    />
                    <UserTrendChart 
                        title="Aggregated Sales Volume"
                        categories={stats?.charts?.orderTrends?.categories || []}
                        currentSeries={stats?.charts?.orderTrends?.current || []}
                        previousSeries={stats?.charts?.orderTrends?.previous || []}
                        currentLabel="Revenue (Current)"
                        previousLabel="Revenue (Previous)"
                        color="#12b76a"
                    />
                </div>

                {/* Secondary Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Growth Summary Card */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/50 shadow-sm shadow-gray-100/50">
                        <div className="flex items-center gap-3 mb-4">
                          <Rocket className="text-brand-500" size={20} />
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">Growth Insight</h3>
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                            The shop ecosystem has expanded by <span className="font-black text-brand-600 underline">+{stats?.metrics?.shopMetrics?.growthRate || 0}%</span> during this period. 
                            Currently, <span className="font-black text-indigo-600 underline">{stats?.metrics?.shopMetrics?.verifiedCount || 0} shops</span> have completed their full KYC and Bank verification.
                          </p>
                          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-xl border border-indigo-100 dark:border-indigo-500/10">
                            <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-black uppercase tracking-widest">
                              PRO TIP: SHORTER SETTLEMENT CYCLES (WEEKLY) CORRELATE WITH 12% HIGHER MERCHANT LOYALTY SCORES.
                            </p>
                          </div>
                        </div>
                    </div>

                    {/* Top Shops Leaderboard */}
                    <TopShopsTable shops={stats?.advanced?.topShops || []} />
                </div>
            </div>
        </div>
    );
};
