"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import { UserSegment } from "@/types/user";
import { GroupIcon, ShootingStarIcon, TimeIcon } from "@/icons";

interface SegmentationStatsProps {
    stats: Record<UserSegment, number>;
}

const SegmentationStats: React.FC<SegmentationStatsProps> = ({ stats }) => {
    const segments = [
        {
            id: "FIRST_TIME" as UserSegment,
            title: "First-Time Users",
            value: stats.FIRST_TIME || 0,
            icon: <ShootingStarIcon className="text-white" />,
            bgColor: "bg-indigo-500",
            gradient: "from-indigo-500/20 to-transparent",
            description: "Registered but never ordered",
            tag: "High Potential"
        },
        {
            id: "INACTIVE_ONE_TIME" as UserSegment,
            title: "Inactive One-Time",
            value: stats.INACTIVE_ONE_TIME || 0,
            icon: <UserIcon className="text-white" />,
            bgColor: "bg-orange-500",
            gradient: "from-orange-500/20 to-transparent",
            description: "1 order, inactive > 45 days",
            tag: "Churn Risk"
        },
        {
            id: "INACTIVE_FREQUENT" as UserSegment,
            title: "Inactive Frequent",
            value: stats.INACTIVE_FREQUENT || 0,
            icon: <GroupIcon className="text-white" />,
            bgColor: "bg-error-500",
            gradient: "from-error-500/20 to-transparent",
            description: "> 1 order, inactive > 45 days",
            tag: "Critical"
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 h-full">
            {segments.map((segment) => (
                <div key={segment.id} className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50 flex flex-col justify-between h-full">
                    {/* Background Gradient Effect */}
                    <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${segment.gradient} blur-2xl transition-all group-hover:scale-110`} />
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`flex items-center justify-center w-12 h-12 ${segment.bgColor} shadow-lg rounded-xl`}>
                                {segment.icon}
                            </div>
                            <div className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                                {segment.tag}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                {segment.title}
                            </span>
                            <div className="flex items-baseline gap-2">
                                <h4 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                                    {segment.value.toLocaleString()}
                                </h4>
                                <span className="text-xs font-medium text-gray-400">Total</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/5">
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                {segment.description}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Simple UserIcon since it's not in the main icons file or easily accessible
const UserIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor" />
    </svg>
);

export default SegmentationStats;
