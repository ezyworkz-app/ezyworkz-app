"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getDashboardStats } from "@/lib/actions/dashboard";

import DashboardRangeSelector from "@/components/dashboard/DashboardRangeSelector";
import PerformanceComparisonChart from "@/components/ecommerce/PerformanceComparisonChart";
import { OrderDetailedMetrics } from "@/components/ecommerce/OrderDetailedMetrics";
import { CancellationAnalytics } from "@/components/ecommerce/CancellationAnalytics";
import DailyFinancialsChart from "@/components/ecommerce/DailyFinancialsChart";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";

export default function OrdersDashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    <div className="h-4 w-72 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                </div>
                <div className="h-10 w-52 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
            <div className="h-72 w-full bg-gray-100 dark:bg-gray-800 rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

function DashboardContent() {
    const searchParams = useSearchParams();
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const range = searchParams.get("range");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    useEffect(() => {
        async function fetchDashboard() {
            setIsLoading(true);
            try {
                // Pass either a startDate/endDate object, or a range string
                const options = (startDate && endDate) ? { startDate, endDate } : (range || "Last 30 days");
                const res = await getDashboardStats(options);
                setStats(res);
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDashboard();
    }, [range, startDate, endDate]);

    if (isLoading) return <DashboardSkeleton />;

    return (
        <ProtectedRoute>
            <div className="space-y-6">
                {/* Header + RangeSelector */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Orders Dashboard</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Overview of order metrics and financials.</p>
                    </div>
                    <DashboardRangeSelector />
                </div>

                {/* Performance Trend Comparison */}
                <div className="w-full">
                    <PerformanceComparisonChart revenueTrend={stats?.charts?.revenueTrend} profitTrend={stats?.charts?.profitTrend} />
                </div>

                <OrderDetailedMetrics stats={stats} />
                <CancellationAnalytics data={stats?.cancellationAnalytics} />

                <div className="grid grid-cols-12 gap-4 md:gap-6 pt-4">
                    <div className="col-span-12">
                        <DailyFinancialsChart
                            financialCombined={stats?.charts?.financialCombined}
                            title={`Revenue & Profit Analysis${startDate && endDate ? ` (${startDate} to ${endDate})` : range ? ` (${range})` : ""}`}
                        />
                    </div>
                    <div className="col-span-12 space-y-6">
                        <EcommerceMetrics metrics={stats?.metrics} financials={stats?.financials} />
                        <MonthlySalesChart yearlySales={stats?.charts?.yearlySales} />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
