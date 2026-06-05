"use client";
import React from "react";

interface ProgressCircleProps {
    value: number; // 0 to 100
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
    subLabel?: string;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
    value,
    size = 120,
    strokeWidth = 8,
    color = "#6366f1", // indigo-500
    label,
    subLabel,
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#e5e7eb" // gray-200
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {label && <span className="text-xl font-bold text-gray-900">{label}</span>}
                {subLabel && <span className="text-[10px] text-gray-500 uppercase font-medium">{subLabel}</span>}
            </div>
        </div>
    );
};

export default ProgressCircle;
