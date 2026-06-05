"use client";
import React from "react";
import { formatCurrency, formatCompact } from "@/lib/format";
import {
    Users,
    Activity,
    Wallet,
    Target,
    UserPlus,
    BarChart3
} from "lucide-react";

interface UserDetailedMetricsProps {
    stats?: any;
}

export const UserDetailedMetrics = ({ stats }: UserDetailedMetricsProps) => {
    if (!stats) return null;

    const { financials, metrics, advanced } = stats;

    const dataPoints = [
        {
            title: "Total Customers",
            value: formatCompact(metrics?.totalUsers || 0),
            icon: <Users className="text-brand-600 size-5" />,
            bgColor: "bg-brand-50 dark:bg-brand-500/10",
            desc: "Total registered users"
        },
        {
            title: "Active Customers",
            value: `${metrics?.userConversionRate || 0}%`,
            icon: <Activity className="text-success-600 size-5" />,
            bgColor: "bg-success-50 dark:bg-success-500/10",
            desc: "Users who have ordered"
        },
        {
            title: "Wallet Liability",
            value: formatCurrency(financials?.totalWalletBalance || 0),
            icon: <Wallet className="text-error-600 size-5" />,
            bgColor: "bg-error-50 dark:bg-error-500/10",
            desc: "Total platform credit"
        },
        {
            title: "Repeat Rate",
            value: `${advanced?.repeatPercentage || 0}%`,
            icon: <Target className="text-orange-600 size-5" />,
            bgColor: "bg-orange-50 dark:bg-orange-500/10",
            desc: "Returning customers"
        },
        {
            title: "Referral Efficiency",
            value: formatCompact(metrics?.totalReferrals || 0),
            icon: <UserPlus className="text-blue-600 size-5" />,
            bgColor: "bg-blue-50 dark:bg-blue-500/10",
            desc: `Avg. ${metrics?.referralSuccessRate || 0} per user`
        },
        {
            title: "Avg. Customer Value",
            value: formatCurrency(advanced?.avgCLV || 0),
            icon: <BarChart3 className="text-brand-600 size-5" />,
            bgColor: "bg-brand-50 dark:bg-brand-500/10",
            desc: "Mean revenue per ordering user"
        }
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6 mt-6">
            {dataPoints.map((item, index) => (
                <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/50 hover:border-brand-500/20 transition-colors cursor-default group">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-brand-500 transition-colors">
                                {item.title}
                            </span>
                            <h4 className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">
                                {item.value}
                            </h4>
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                {item.desc}
                            </p>
                        </div>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-transform group-hover:scale-110 ${item.bgColor}`}>
                            {item.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
