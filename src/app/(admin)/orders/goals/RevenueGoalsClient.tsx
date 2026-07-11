"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import RevenueRoadmap from "@/components/ecommerce/RevenueRoadmap";
import PerformanceComparisonChart from "@/components/ecommerce/PerformanceComparisonChart";
import { TrendingUp, Target as TargetIcon, Lightbulb } from "lucide-react";

export function GoalsSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex flex-col gap-3 pb-8 border-b border-gray-100 dark:border-gray-800">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="h-8 w-72 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-4 w-96 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            </div>
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-5 h-80 bg-gray-100 dark:bg-gray-800 rounded-3xl" />
                <div className="col-span-12 lg:col-span-7 h-80 bg-gray-100 dark:bg-gray-800 rounded-3xl" />
                <div className="col-span-12 h-72 bg-gray-100 dark:bg-gray-800 rounded-3xl" />
            </div>
        </div>
    );
}

export default function RevenueGoalsClient({ initialStats }: { initialStats: any }) {
    const stats = initialStats;

    if (!stats) return <GoalsSkeleton />;

    return (
        <ProtectedRoute>
            <div className="space-y-8 pb-20 max-w-[1600px] mx-auto">

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-8 dark:border-gray-800">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-brand-600">
                            <TargetIcon className="size-5" />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Strategic Hub</span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white">Revenue Command Center</h2>
                        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                            Analyze Month-to-Date achievement and optimize daily performance.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Gauge: Monthly Target */}
                    <div className="col-span-12 lg:col-span-6 xl:col-span-5">
                        <MonthlyTarget financials={stats?.financials} />
                    </div>

                    {/* Revenue Roadmap */}
                    <div className="col-span-12 lg:col-span-6 xl:col-span-7">
                        <RevenueRoadmap
                            sales={stats?.financials?.totalSales || 0}
                            initialTarget={300000}
                        />
                    </div>

                    {/* Performance Comparison Chart */}
                    <div className="col-span-12">
                        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
                                        <TrendingUp className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Performance Comparison</h3>
                                        <p className="text-sm font-medium text-gray-400 italic">Historical performance trends vs the current period.</p>
                                    </div>
                                </div>
                            </div>
                            <PerformanceComparisonChart
                                revenueTrend={stats?.charts?.revenueTrend}
                                profitTrend={stats?.charts?.profitTrend}
                            />
                        </div>
                    </div>

                    {/* Strategy & Insights Row */}
                    <div className="col-span-12 lg:col-span-4">
                        <div className="h-full p-8 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none transition-transform hover:scale-[1.02] flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-4">
                                <Lightbulb className="size-6 text-indigo-200" />
                                <h4 className="text-base font-black uppercase tracking-widest">Growth Playbook</h4>
                            </div>
                            <p className="text-sm font-medium text-indigo-50 leading-relaxed">
                                Based on your required pace, consider running a limited-time &quot;Flash Sale&quot; or a &quot;Loyalty Bonus&quot; for repeat customers to bridge the current gap.
                            </p>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                            <div className="p-8 rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
                                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-4">Profitability Analysis</h4>
                                <p className="text-base font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Maintain your current margins. A slight increase in AOV (Average Order Value) could reduce your daily order target by 12%.
                                </p>
                            </div>
                            <div className="p-8 rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
                                <h4 className="text-xs font-black uppercase tracking-widest text-brand-500 mb-4">Retention Strategy</h4>
                                <p className="text-base font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Re-engaging repeat customers with exclusive deals or loyalty rewards can quickly accelerate you toward your monthly revenue target.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </ProtectedRoute>
    );
}
