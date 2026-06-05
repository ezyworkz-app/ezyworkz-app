"use client";
import React, { useState } from "react";
import { UserDetailedMetrics } from "@/components/users/UserDetailedMetrics";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import { UserTrendChart } from "@/components/users/UserTrendChart";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { RefreshCw, BarChart } from "lucide-react";
import { UserSegmentChart } from "./UserSegmentChart";
import { TopCustomersTable } from "./TopCustomersTable";
import { FrequencyDistributionChart } from "./FrequencyDistributionChart";
import TopAreasCard from "./TopAreasCard";

interface UserDashboardClientProps {
    initialStats: any;
}

const RANGES = ["Today", "Last 7 days", "Last 30 days", "Last 3 months", "Last 12 months"];
const todayStr = () => new Date().toISOString().split("T")[0];

export const UserDashboardClient = ({ initialStats }: UserDashboardClientProps) => {
    const [stats, setStats]             = useState(initialStats);
    const [range, setRange]             = useState("Last 30 days");
    const [isLoading, setIsLoading]     = useState(false);
    const [showCustom, setShowCustom]   = useState(false);
    const [startDate, setStartDate]     = useState("");
    const [endDate, setEndDate]         = useState("");
    const [customLabel, setCustomLabel] = useState("");

    const fetchByRange = async (r: string) => {
        setIsLoading(true);
        try { const data = await getDashboardStats(r); setStats(data); }
        catch (e) { console.error("Failed to fetch dashboard stats:", e); }
        finally { setIsLoading(false); }
    };

    const fetchByDates = async (from: string, to: string) => {
        setIsLoading(true);
        try {
            const data = await getDashboardStats({ startDate: from, endDate: to });
            setStats(data);
            setCustomLabel(`${from} → ${to}`);
        } catch (e) { console.error("Failed to fetch dashboard stats:", e); }
        finally { setIsLoading(false); }
    };

    const handleSelectChange = (val: string) => {
        if (val === "custom") { setShowCustom(true); return; }
        setShowCustom(false); setCustomLabel(""); setRange(val); fetchByRange(val);
    };

    const handleApply = () => {
        if (!startDate || !endDate) return;
        if (startDate > endDate) { alert("Start date must be before end date."); return; }
        fetchByDates(startDate, endDate);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 uppercase tracking-tight flex items-center gap-2">
                        User Analytics
                        {isLoading && <RefreshCw className="animate-spin text-brand-500" size={16} />}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Business overview and performance per user.
                        {customLabel && <span className="ml-2 text-brand-500 font-semibold">{customLabel}</span>}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        id="user-dashboard-range-selector"
                        value={showCustom ? "custom" : range}
                        onChange={(e) => handleSelectChange(e.target.value)}
                        className="h-10 pl-4 pr-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all uppercase tracking-wider hover:border-brand-500/30"
                    >
                        {RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                        <option value="custom">📅 Custom Range...</option>
                    </select>

                    {showCustom && (
                        <>
                            <input type="date" id="user-dash-start" max={todayStr()} value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                            <span className="text-sm text-gray-400">to</span>
                            <input type="date" id="user-dash-end" max={todayStr()} value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                            <button id="user-dash-apply" onClick={handleApply}
                                disabled={!startDate || !endDate || isLoading}
                                className="h-10 px-4 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors">
                                Apply
                            </button>
                            <button id="user-dash-clear"
                                onClick={() => { setShowCustom(false); setCustomLabel(""); setStartDate(""); setEndDate(""); }}
                                className="h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">✕
                            </button>
                        </>
                    )}
                </div>
            </div>

            <UserDetailedMetrics stats={stats} />

            <div className="space-y-6 pt-4">
                {/* Trend Charts - Full Width */}
                <div className="grid grid-cols-1 gap-6">
                    <UserTrendChart 
                        title="User Acquisition"
                        categories={stats?.charts?.userTrends?.categories || []}
                        currentSeries={stats?.charts?.userTrends?.current || []}
                        previousSeries={stats?.charts?.userTrends?.previous || []}
                        currentLabel="Current Period"
                        previousLabel="Previous Period"
                        color="#465fff"
                    />
                    <UserTrendChart 
                        title="Service Volume"
                        categories={stats?.charts?.orderTrends?.categories || []}
                        currentSeries={stats?.charts?.orderTrends?.current || []}
                        previousSeries={stats?.charts?.orderTrends?.previous || []}
                        currentLabel="Current Period"
                        previousLabel="Previous Period"
                        color="#10B981"
                    />
                </div>

                {/* Summary & Retention - One Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/50">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Acquisition Summary</h3>
                        <EcommerceMetrics metrics={stats?.metrics} />
                        <div className="mt-6 p-4 bg-brand-50/50 dark:bg-brand-500/5 rounded-xl border border-brand-100 dark:border-brand-500/10">
                            <p className="text-sm text-brand-700 dark:text-brand-300 leading-relaxed font-medium">
                                Our user base has grown by <span className="font-bold underline">{stats?.metrics?.userMetrics?.change || 0}%</span> in the selected period ({range}).
                                The referral system has contributed <span className="font-bold underline">{stats?.metrics?.totalReferrals || 0}</span> successful sign-ups overall.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/50">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Churn & Retention</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Churn Rate</span>
                                <span className={(stats?.advanced?.churnRate || 0) > 20 ? "text-error-500 font-bold" : "text-success-500 font-bold"}>
                                    {stats?.advanced?.churnRate || 0}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                <div
                                    className="bg-brand-500 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(100, stats?.advanced?.churnRate || 0)}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Repeat Customer Rate</span>
                                <span className="text-brand-500 font-bold">
                                    {(stats?.advanced?.repeatPercentage || 0)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                <div
                                    className="bg-success-500 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(100, stats?.advanced?.repeatPercentage || 0)}%` }}
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                                    A healthy churn rate for on-demand services is typically below 15%.
                                    Repeat customer rate indicates how many users find the service "sticky".
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Behavioral Distributions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <UserSegmentChart data={stats?.advanced?.segmentDistribution || {}} />
                    <FrequencyDistributionChart data={stats?.advanced?.frequencyDistribution || {}} />
                </div>

                {/* Top Areas */}
                <TopAreasCard />

                {/* Top Spenders Table */}
                <div className="animate-in fade-in slide-in-from-bottom duration-700 pb-10">
                    <TopCustomersTable customers={stats?.advanced?.topCustomers || []} />
                </div>
            </div>
        </div>
    );
};
