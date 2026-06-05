"use client";
import React, { useState } from "react";
import AcquisitionAnalytics from "@/components/ecommerce/AcquisitionAnalytics";
import CampaignPerformance from "@/components/ecommerce/CampaignPerformance";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { RefreshCw } from "lucide-react";

interface UserAcquisitionClientProps {
    initialStats: any;
}

const RANGES = [
    "Today",
    "Last 7 days",
    "Last 30 days",
    "Last 3 months",
    "Last 12 months",
];

const today = () => new Date().toISOString().split("T")[0];

export const UserAcquisitionClient = ({ initialStats }: UserAcquisitionClientProps) => {
    const [stats, setStats]           = useState(initialStats);
    const [range, setRange]           = useState("Last 30 days");
    const [isLoading, setIsLoading]   = useState(false);
    const [showCustom, setShowCustom] = useState(false);
    const [startDate, setStartDate]   = useState("");
    const [endDate, setEndDate]       = useState("");
    const [customLabel, setCustomLabel] = useState("");

    const fetchByRange = async (r: string) => {
        setIsLoading(true);
        try {
            const data = await getDashboardStats(r);
            setStats(data);
        } catch (e) {
            console.error("Failed to fetch acquisition stats:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchByDates = async (from: string, to: string) => {
        setIsLoading(true);
        try {
            const data = await getDashboardStats({ startDate: from, endDate: to });
            setStats(data);
            setCustomLabel(`${from} → ${to}`);
        } catch (e) {
            console.error("Failed to fetch acquisition stats:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectChange = (val: string) => {
        if (val === "custom") {
            setShowCustom(true);
            return;
        }
        setShowCustom(false);
        setCustomLabel("");
        setRange(val);
        fetchByRange(val);
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
                        Acquisition &amp; Retention
                        {isLoading && <RefreshCw className="animate-spin text-brand-500" size={16} />}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        New user growth, order conversion and repeat behaviour.
                        {customLabel && <span className="ml-2 text-brand-500 font-semibold">{customLabel}</span>}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Preset range select */}
                    <select
                        id="acquisition-range-selector"
                        value={showCustom ? "custom" : range}
                        onChange={(e) => handleSelectChange(e.target.value)}
                        className="h-10 pl-4 pr-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all uppercase tracking-wider hover:border-brand-500/30"
                    >
                        {RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                        <option value="custom">📅 Custom Range...</option>
                    </select>

                    {/* Custom date inputs */}
                    {showCustom && (
                        <>
                            <input
                                type="date"
                                id="acq-start-date"
                                max={today()}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <span className="text-sm text-gray-400">to</span>
                            <input
                                type="date"
                                id="acq-end-date"
                                max={today()}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <button
                                id="acq-apply-range"
                                onClick={handleApply}
                                disabled={!startDate || !endDate || isLoading}
                                className="h-10 px-4 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
                            >
                                Apply
                            </button>
                            <button
                                id="acq-clear-range"
                                onClick={() => { setShowCustom(false); setCustomLabel(""); setStartDate(""); setEndDate(""); }}
                                className="h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                ✕
                            </button>
                        </>
                    )}
                </div>
            </div>

            <AcquisitionAnalytics acquisition={stats?.acquisition} />

            <CampaignPerformance />
        </div>
    );
};
