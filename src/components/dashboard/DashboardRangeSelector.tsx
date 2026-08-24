"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Select from "../ui/Select";

const RANGE_OPTIONS = [
    { value: "Today", label: "Today" },
    { value: "Last 7 days", label: "Weekly (Last 7 days)" },
    { value: "Last 30 days", label: "Monthly (Last 30 days)" },
    { value: "Last 3 months", label: "Quarterly (Last 3 months)" },
    { value: "Last 12 months", label: "Yearly (Last 12 months)" },
    { value: "custom", label: "📅 Custom Range..." },
];

/**
 * The range used when the URL carries no `range` param.
 *
 * MUST match the fallback used when fetching (OrdersDashboardClient) and the
 * default in the backend's getDashboardStats. This selector used to fall back
 * to "Last 7 days" while both of those defaulted to "Last 30 days", so a fresh
 * page load showed a dropdown reading "Weekly (Last 7 days)" above a chart
 * containing 30 days of data.
 */
export const DEFAULT_DASHBOARD_RANGE = "Last 30 days";

export default function DashboardRangeSelector() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentRange = searchParams.get("range") || DEFAULT_DASHBOARD_RANGE;
    const currentStart = searchParams.get("startDate") || "";
    const currentEnd = searchParams.get("endDate") || "";

    // Show custom picker if URL has explicit dates
    const isCustomActive = !!(currentStart && currentEnd);
    const [showCustom, setShowCustom] = useState(isCustomActive);
    const [startDate, setStartDate] = useState(currentStart);
    const [endDate, setEndDate] = useState(currentEnd);

    const today = new Date().toISOString().split("T")[0];

    const handleRangeChange = (value: string) => {
        if (value === "custom") {
            setShowCustom(true);
            return;
        }
        setShowCustom(false);
        const params = new URLSearchParams();
        params.set("range", value);
        router.push(`?${params.toString()}`);
    };

    const handleApply = () => {
        if (!startDate || !endDate) return;
        if (startDate > endDate) {
            alert("Start date must be before end date.");
            return;
        }
        const params = new URLSearchParams();
        params.set("startDate", startDate);
        params.set("endDate", endDate);
        router.push(`?${params.toString()}`);
    };

    const selectValue = isCustomActive ? "custom" : currentRange;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-48">
                <Select
                    id="dashboard-range-selector"
                    options={RANGE_OPTIONS}
                    value={selectValue}
                    onChange={handleRangeChange}
                    className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-brand-500"
                />
            </div>

            {showCustom && (
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="date"
                        id="custom-start-date"
                        max={today}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">to</span>
                    <input
                        type="date"
                        id="custom-end-date"
                        max={today}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                        id="apply-custom-range"
                        onClick={handleApply}
                        disabled={!startDate || !endDate}
                        className="h-10 px-4 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Apply
                    </button>
                    {isCustomActive && (
                        <button
                            id="clear-custom-range"
                            onClick={() => {
                                setShowCustom(false);
                                setStartDate("");
                                setEndDate("");
                                router.push(`?range=${encodeURIComponent(DEFAULT_DASHBOARD_RANGE)}`);
                            }}
                            className="h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            ✕ Clear
                        </button>
                    )}
                </div>
            )}

            {isCustomActive && (
                <span className="text-xs text-brand-500 font-medium">
                    {currentStart} → {currentEnd}
                </span>
            )}
        </div>
    );
}
