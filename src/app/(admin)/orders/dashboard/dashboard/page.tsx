import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import { OrderDetailedMetrics } from "@/components/ecommerce/OrderDetailedMetrics";
import DailyFinancialsChart from "@/components/ecommerce/DailyFinancialsChart";
import DashboardRangeSelector from "@/components/dashboard/DashboardRangeSelector";
import PerformanceComparisonChart from "@/components/ecommerce/PerformanceComparisonChart";
import { CancellationAnalytics } from "@/components/ecommerce/CancellationAnalytics";
import { apiFetch } from "@/lib/api";

export const metadata: Metadata = {
    title: "Orders Dashboard | Launezy Admin",
    description: "Launezy Admin Orders Dashboard",
};

interface DashboardPageProps {
    searchParams: Promise<{ range?: string; startDate?: string; endDate?: string }>;
}

export default async function OrdersDashboard({ searchParams }: DashboardPageProps) {
    const params = await searchParams;
    const range = params.range || "Last 7 days";
    const { startDate, endDate } = params;

    let stats = null;
    try {
        // Build query string: prefer explicit dates over preset range
        const query = (startDate && endDate)
            ? `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
            : `range=${encodeURIComponent(range)}`;

        const res = await apiFetch(`/api/v1/admin/dashboard/stats?${query}`);
        if (res.ok) {
            const json = await res.json();
            stats = json.data;
        }
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Orders Dashboard</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Overview of order metrics and financials.</p>
                </div>
                <DashboardRangeSelector />
            </div>

            {/* Performance Trend Comparison */}
            <div className="w-full">
                <PerformanceComparisonChart 
                    revenueTrend={stats?.charts?.revenueTrend} 
                    profitTrend={stats?.charts?.profitTrend} 
                />
            </div>

            <OrderDetailedMetrics stats={stats} />

            <CancellationAnalytics data={stats?.cancellationAnalytics} />

            <div className="grid grid-cols-12 gap-4 md:gap-6 pt-4">
                <div className="col-span-12">
                    <DailyFinancialsChart financialCombined={stats?.charts?.financialCombined} title={`Financial Performance (${startDate && endDate ? `${startDate} to ${endDate}` : range})`} />
                </div>
                
                <div className="col-span-12 space-y-6">
                    <EcommerceMetrics metrics={stats?.metrics} financials={stats?.financials} />
                    <MonthlySalesChart yearlySales={stats?.charts?.yearlySales} />
                </div>
            </div>
        </div>
    );
}
