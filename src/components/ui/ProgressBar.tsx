"use client";
import React from "react";

interface ProgressBarProps {
    label?: string;
    value: number; // percentage
    color?: string;
    suffix?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    label,
    value,
    color = "#6366f1",
    suffix,
}) => {
    return (
        <div className="space-y-1.5">
            {(label || suffix) && (
                <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-gray-600">{label}</span>
                    <span className="text-gray-900">{suffix || `${value}%`}</span>
                </div>
            )}
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${value}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;
