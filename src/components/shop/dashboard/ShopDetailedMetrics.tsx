"use client";
import React from "react";
import { formatCurrency, formatCompact } from "@/lib/format";
import {
    Store,
    Activity,
    CreditCard,
    TrendingUp,
    ShieldCheck,
    Star
} from "lucide-react";

interface ShopDetailedMetricsProps {
    stats?: any;
}

export const ShopDetailedMetrics = ({ stats }: ShopDetailedMetricsProps) => {
    if (!stats) return null;

    const { metrics = {}, financials = {} } = stats;
    const { shopMetrics = {} } = metrics;

    const dataPoints = [
        {
            title: "Total Shops",
            value: formatCompact(shopMetrics.total || 0),
            icon: <Store className="text-brand-600 size-5" />,
            bgColor: "bg-brand-50 dark:bg-brand-500/10",
            desc: "Onboarded merchants"
        },
        {
            title: "Active Shops",
            value: formatCompact(shopMetrics.active || 0),
            icon: <Activity className="text-success-600 size-5" />,
            bgColor: "bg-success-50 dark:bg-success-500/10",
            desc: "Shops currently online"
        },
        {
            title: "Platform Revenue",
            value: formatCurrency(financials.totalGrossRevenue || 0),
            icon: <TrendingUp className="text-indigo-600 size-5" />,
            bgColor: "bg-indigo-50 dark:bg-indigo-500/10",
            desc: "Aggregate lifetime sales"
        },
        {
            title: "Pending Payouts",
            value: formatCurrency(financials.totalPendingSettlements || 0),
            icon: <CreditCard className="text-error-600 size-5" />,
            bgColor: "bg-error-50 dark:bg-error-500/10",
            desc: "Unsettled shop balances"
        },
        {
            title: "Verified KYCs",
            value: `${shopMetrics.verifiedKycPercentage || 0}%`,
            icon: <ShieldCheck className="text-blue-600 size-5" />,
            bgColor: "bg-blue-50 dark:bg-blue-500/10",
            desc: "Compliance completion rate"
        },
        {
            title: "Avg. Shop Rating",
            value: (shopMetrics.avgRating || 0).toFixed(1),
            icon: <Star className="text-orange-600 size-5" />,
            bgColor: "bg-orange-50 dark:bg-orange-500/10",
            desc: "Across all active services"
        }
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6 mt-6">
            {dataPoints.map((item, index) => (
                <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/50 hover:border-brand-500/20 transition-colors cursor-default group shadow-sm shadow-gray-100/50">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-brand-500 transition-colors">
                                {item.title}
                            </span>
                            <h4 className="mt-2 text-xl font-black text-gray-900 dark:text-white/90 tracking-tight">
                                {item.value}
                            </h4>
                            <p className="mt-1 text-xs text-gray-400 font-medium dark:text-gray-500 italic">
                                {item.desc}
                            </p>
                        </div>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-transform group-hover:rotate-6 ${item.bgColor}`}>
                            {item.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
