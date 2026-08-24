"use client";
import React from "react";
import { formatCurrency, formatCompact } from "@/lib/format";
import {
    Banknote,
    TrendingUp,
    CreditCard,
    AlertCircle,
    Store,
    ShoppingBag,
    Receipt
} from "lucide-react";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface DetailedMetricsProps {
    stats?: any;
}

export const OrderDetailedMetrics = ({ stats }: DetailedMetricsProps) => {
    if (!stats) return null;

    const { financials, metrics } = stats;

    const revenueTotal = (financials?.totalServiceRevenue || 0) + 
                         (financials?.totalTaxRevenue || 0) + 
                         (financials?.totalDeliveryRevenue || 0) + 
                         (financials?.totalFeesRevenue || 0);

    const auditTotal = revenueTotal; // Usually Audit matches Gross Revenue (The 100% pie)

    const dailyDataPoints = [
        {
            title: "Today's Sales",
            value: formatCurrency(financials?.todaySales || 0),
            icon: <Banknote className="text-brand-600 size-5" />,
            gradient: "from-brand-50 to-brand-100/50 dark:from-brand-900/20 dark:to-brand-800/10",
            desc: "Revenue collected today"
        },
        {
            title: "Today's Profit",
            value: formatCurrency(financials?.todayProfit || 0),
            icon: <TrendingUp className="text-emerald-600 size-5" />,
            gradient: "from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10",
            desc: "Net profit after marketing/costs"
        },
        {
            title: "Today's Expenses",
            value: formatCurrency(financials?.todayExpenses || 0),
            icon: <Receipt className="text-orange-600 size-5" />,
            gradient: "from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10",
            desc: "Daily operational costs"
        },
        {
            title: "Today's Orders",
            value: formatCompact(financials?.todayOrdersCount || 0),
            icon: <ShoppingBag className="text-blue-600 size-5" />,
            gradient: "from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10",
            desc: "Total volume today"
        }
    ];

    const revenueDataPoints = [
        {
            title: "Net Revenue (Collected)",
            value: formatCurrency(financials?.totalSales || 0),
            percentage: revenueTotal > 0 ? (financials?.totalSales / revenueTotal) * 100 : 0,
            icon: <Banknote className="text-brand-700 size-6" />,
            gradient: "from-brand-100 to-indigo-50 dark:from-brand-900/40 dark:to-indigo-900/20",
            desc: "Actually paid by customers (After discounts)",
            featured: true
        },
        {
            title: "Total Discounts",
            value: formatCurrency(financials?.totalDiscount || 0),
            percentage: revenueTotal > 0 ? (financials?.totalDiscount / revenueTotal) * 100 : 0,
            icon: <CreditCard className="text-purple-600 size-5" />,
            gradient: "from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/10",
            desc: "Amount deducted via coupons/codes"
        },
        {
            title: "Service Revenue",
            value: formatCurrency(financials?.totalServiceRevenue || 0),
            percentage: revenueTotal > 0 ? (financials?.totalServiceRevenue / revenueTotal) * 100 : 0,
            icon: <Receipt className="text-indigo-600 size-5" />,
            gradient: "from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/10",
            desc: "Base service amount (Before discounts)"
        },
        {
            title: "Taxes (GST)",
            value: formatCurrency(financials?.totalTaxRevenue || 0),
            percentage: revenueTotal > 0 ? (financials?.totalTaxRevenue / revenueTotal) * 100 : 0,
            icon: <Banknote className="text-purple-600 size-5" />,
            gradient: "from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/10",
            desc: "Government tax collected"
        },
        {
            title: "Delivery Revenue",
            value: formatCurrency(financials?.totalDeliveryRevenue || 0),
            percentage: revenueTotal > 0 ? (financials?.totalDeliveryRevenue / revenueTotal) * 100 : 0,
            icon: <ShoppingBag className="text-brand-600 size-5" />,
            gradient: "from-brand-50 to-sky-50 dark:from-brand-900/20 dark:to-sky-900/10",
            desc: "Revenue from delivery fees"
        },
        {
            title: "Low Cart Fees",
            value: formatCurrency(financials?.totalFeesRevenue || 0),
            percentage: revenueTotal > 0 ? (financials?.totalFeesRevenue / revenueTotal) * 100 : 0,
            icon: <CreditCard className="text-violet-600 size-5" />,
            gradient: "from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/10",
            desc: "Minimum order threshold fees"
        }
    ];

    const auditDataPoints = [
        {
            title: "Net Profit (True)",
            value: formatCurrency(financials?.totalProfitStored || 0),
            percentage: auditTotal > 0 ? (financials?.totalProfitStored / auditTotal) * 100 : 0,
            icon: <TrendingUp className="text-emerald-600 size-6" />,
            gradient: "from-emerald-100 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/20",
            desc: "Final bottom line after all costs",
            featured: true
        },
        {
            title: "Shop Payouts",
            value: formatCurrency(financials?.totalPayout || 0),
            percentage: auditTotal > 0 ? (financials?.totalPayout / auditTotal) * 100 : 0,
            icon: <Store className="text-blue-600 size-5" />,
            gradient: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/10",
            desc: "Total owed to vendors"
        },
        {
            title: "Logistics Costs",
            value: formatCurrency(financials?.totalLogistics || 0),
            percentage: auditTotal > 0 ? (financials?.totalLogistics / auditTotal) * 100 : 0,
            icon: <Receipt className="text-orange-600 size-5" />,
            gradient: "from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10",
            desc: "Porter / Rapido expenses"
        },
        {
            title: "Marketing Spend",
            value: formatCurrency(financials?.totalMarketingSpend || 0),
            percentage: auditTotal > 0 ? (financials?.totalMarketingSpend / auditTotal) * 100 : 0,
            icon: <TrendingUp className="text-pink-600 size-5" />,
            gradient: "from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/10",
            desc: "Google Ads / Acquisition cost"
        },
        {
            title: "Discounts & Promo",
            value: formatCurrency(financials?.totalDiscount || 0),
            percentage: auditTotal > 0 ? (financials?.totalDiscount / auditTotal) * 100 : 0,
            icon: <CreditCard className="text-purple-600 size-5" />,
            gradient: "from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/10",
            desc: "Total loss to promotions"
        },
        {
            title: "Compensation",
            value: formatCurrency(financials?.totalComp || 0),
            percentage: auditTotal > 0 ? (financials?.totalComp / auditTotal) * 100 : 0,
            icon: <AlertCircle className="text-red-600 size-5" />,
            gradient: "from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/10",
            desc: "Amount given as compensation"
        }
    ];

    const getDonutOptions = (type: 'revenue' | 'audit'): ApexOptions => {
        const isRevenue = type === 'revenue';
        return {
            chart: { type: "donut", fontFamily: "Outfit, sans-serif" },
            dataLabels: { enabled: false },
            plotOptions: {
                pie: {
                    donut: {
                        size: "72%",
                        labels: {
                            show: true,
                            name: { show: true, fontSize: "11px", fontWeight: 600, color: "#6B7280", offsetY: -8 },
                            value: { 
                                show: true, fontSize: "16px", fontWeight: 800, color: "#111827", offsetY: 4,
                                formatter: (val: string) => `₹${formatCurrency(Number(val))}`.replace("₹₹", "₹")
                            },
                            total: {
                                show: true,
                                label: isRevenue ? "GROSS" : "TOTAL", fontSize: "9px", fontWeight: 700, color: "#9CA3AF",
                                formatter: (w) => {
                                    const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                                    return `₹${formatCurrency(total)}`.replace("₹₹", "₹");
                                }
                            }
                        }
                    }
                }
            },
            colors: isRevenue 
                ? ["#7159AB", "#826CBB", "#B7ADDE", "#D2CBEB"] 
                : ["#039855", "#465FFF", "#F79009", "#FD4394", "#7A5AF8", "#D92D20"],
            labels: isRevenue 
                ? ["Service", "Tax", "Delivery", "Low Cart"] 
                : ["Profit", "Payouts", "Logistics", "Marketing", "Promo", "Comp"],
            legend: { show: false },
            stroke: { show: false },
            tooltip: { y: { formatter: (val) => `₹${formatCurrency(val)}`.replace("₹₹", "₹") } }
        };
    };

    const renderCard = (item: any, index: number) => (
        <div key={index} className={`relative overflow-hidden rounded-xl border ${item.featured ? 'border-brand-200 shadow-sm' : 'border-gray-100'} bg-gradient-to-br ${item.gradient} p-4 dark:border-gray-800`}>
            <div className="flex items-start justify-between">
                <div className="z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            {item.title}
                        </span>
                        {item.percentage !== undefined && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${item.featured ? 'bg-brand-200/50 text-brand-800' : 'bg-white/50 text-gray-700 dark:bg-black/20 dark:text-gray-300'}`}>
                                {item.percentage.toFixed(1)}%
                            </span>
                        )}
                    </div>
                    <h4 className={`mt-1.5 ${item.featured ? 'text-2xl' : 'text-lg'} font-black text-gray-900 dark:text-white`}>
                        {item.value}
                    </h4>
                    <p className="mt-0.5 text-[10px] font-medium text-gray-500/80 dark:text-gray-400/80">
                        {item.desc}
                    </p>
                </div>
                <div className={`z-10 flex items-center justify-center ${item.featured ? 'w-10 h-10' : 'w-8 h-8'} rounded-full bg-white/60 shadow-inner dark:bg-black/20`}>
                    {item.icon}
                </div>
            </div>
            
            {/* Visual backdrop for percentage */}
            {item.featured && item.percentage !== undefined && (
                <div 
                    className="absolute bottom-0 left-0 h-1.5 bg-brand-500/20 transition-all duration-1000" 
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
            )}
        </div>
    );

      return (
        <div className="space-y-12 mt-6">
            {/* 💎 Business Health Pillars (Must-Have Metrics) */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="text-brand-600 size-5" />
                    <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Business Health Pillars</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Primary Net Revenue */}
                    <div className="relative overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-brand-50 to-indigo-50 p-6 shadow-sm dark:border-brand-500/20 dark:from-brand-900/40 dark:to-indigo-900/20">
                        <div className="flex items-start justify-between">
                            <div className="z-10">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-brand-600">Net Revenue</span>
                                    {revenueTotal > 0 && (
                                        <span className="rounded-full bg-brand-200/50 px-2 py-0.5 text-[10px] font-black text-brand-800">
                                            {((financials?.totalSales / revenueTotal) * 100).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                                <h4 className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                                    {formatCurrency(financials?.totalSales || 0)}
                                </h4>
                                <p className="mt-1 text-xs font-medium text-gray-400">Total cash collected after all discounts</p>
                            </div>
                            <div className="z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 text-brand-600 shadow-sm dark:bg-brand-500/20 dark:text-brand-400">
                                <Banknote className="size-6" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-2 bg-brand-500/30" style={{ width: '100%' }} />
                    </div>

                    {/* Primary Net Profit */}
                    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm dark:border-emerald-500/20 dark:from-emerald-900/40 dark:to-teal-900/20">
                        <div className="flex items-start justify-between">
                            <div className="z-10">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Net Profit (True)</span>
                                    {revenueTotal > 0 && (
                                        <span className="rounded-full bg-emerald-200/50 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                                            {((financials?.totalProfitStored / revenueTotal) * 100).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                                <h4 className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                                    {formatCurrency(financials?.totalProfitStored || 0)}
                                </h4>
                                <p className="mt-1 text-xs font-medium text-gray-400">Your actual bottom line profit</p>
                            </div>
                            <div className="z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 text-emerald-600 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-400">
                                <TrendingUp className="size-6" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-2 bg-emerald-500" style={{ width: `${Math.min((financials?.totalProfitStored / financials?.totalSales) * 100, 100)}%` }} />
                    </div>

                    {/* Primary Marketing Spend */}
                    <div className="relative overflow-hidden rounded-2xl border-2 border-rose-100 bg-gradient-to-br from-rose-50 to-pink-50 p-6 shadow-sm dark:border-rose-500/20 dark:from-rose-900/40 dark:to-pink-900/20">
                        <div className="flex items-start justify-between">
                            <div className="z-10">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-rose-600">Marketing Spend</span>
                                    {revenueTotal > 0 && (
                                        <span className="rounded-full bg-rose-200/50 px-2 py-0.5 text-[10px] font-black text-rose-800">
                                            {((financials?.totalMarketingSpend / revenueTotal) * 100).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                                <h4 className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                                    {formatCurrency(financials?.totalMarketingSpend || 0)}
                                </h4>
                                <p className="mt-1 text-xs font-medium text-gray-400">Google Ads acquisition investment</p>
                            </div>
                            <div className="z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 text-rose-600 shadow-sm dark:bg-rose-500/20 dark:text-rose-400">
                                <CreditCard className="size-6" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 h-2 bg-rose-500/30" style={{ width: `${Math.min((financials?.totalMarketingSpend / financials?.totalSales) * 100, 100)}%` }} />
                    </div>
                </div>
            </div>

            {/* ⚡ Operational Pulse (Today's Performance) */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-800">
                    <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">Operational Pulse (Today)</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
                    {dailyDataPoints.map(renderCard)}
                </div>
            </div>

            {/* 📊 Detailed Audits (Donut Sections) */}
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                {/* Revenue Breakdown Unified */}
                <div className="space-y-4 bg-gray-50/20 dark:bg-gray-800/20 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
                        <h3 className="text-md font-bold text-gray-800 dark:text-white/90">Revenue Composition</h3>
                    </div>
                    <div className="grid grid-cols-12 gap-6 items-start">
                        <div className="col-span-12 md:col-span-4 flex justify-center">
                            {(() => {
                                const revSeries = [(financials.totalServiceRevenue || 0), (financials.totalTaxRevenue || 0), (financials.totalDeliveryRevenue || 0), (financials.totalFeesRevenue || 0)];
                                const hasData = revSeries.some(v => v > 0);
                                return hasData ? (
                                    <ReactApexChart 
                                        options={getDonutOptions('revenue')} 
                                        series={revSeries} 
                                        type="donut" 
                                        height={200} 
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[200px] text-gray-300 dark:text-gray-600">
                                        <div className="w-24 h-24 rounded-full border-4 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-center">No Data</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="col-span-12 md:col-span-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {revenueDataPoints.map(renderCard)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Audit Unified */}
                <div className="space-y-4 bg-gray-50/20 dark:bg-gray-800/20 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                        <h3 className="text-md font-bold text-gray-800 dark:text-white/90">Cost & Audit Breakdown</h3>
                    </div>
                    <div className="grid grid-cols-12 gap-6 items-start">
                        <div className="col-span-12 md:col-span-4 flex justify-center">
                            {(() => {
                                const auditSeries = [(financials.totalProfitStored || 0), (financials.totalPayout || 0), (financials.totalLogistics || 0), (financials.totalMarketingSpend || 0), (financials.totalDiscount || 0), (financials.totalComp || 0)];
                                const hasData = auditSeries.some(v => v > 0);
                                return hasData ? (
                                    <ReactApexChart 
                                        options={getDonutOptions('audit')} 
                                        series={auditSeries} 
                                        type="donut" 
                                        height={200} 
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[200px] text-gray-300 dark:text-gray-600">
                                        <div className="w-24 h-24 rounded-full border-4 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-center">No Data</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="col-span-12 md:col-span-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {auditDataPoints.map(renderCard)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
