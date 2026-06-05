"use client";
import React, { useState } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/format";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface TrendData {
  categories: string[];
  current: number[];
  previous: number[];
}

interface ComparisonProps {
  revenueTrend?: TrendData;
  profitTrend?: TrendData;
}

export default function PerformanceComparisonChart({ revenueTrend, profitTrend }: ComparisonProps) {
  const [activeTab, setActiveTab] = useState<"revenue" | "profit">("revenue");

  const activeData = activeTab === "revenue" ? revenueTrend : profitTrend;
  if (!activeData) return null;

  const totalCurrent = activeData.current.reduce((a, b) => a + b, 0);
  const totalPrevious = activeData.previous.reduce((a, b) => a + b, 0);
  const growth = totalPrevious > 0 ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 : 0;

  const series = [
    {
      name: `Current Period (${activeTab === 'revenue' ? 'Revenue' : 'Profit'})`,
      data: activeData.current,
    },
    {
      name: `Previous Period (${activeTab === 'revenue' ? 'Revenue' : 'Profit'})`,
      data: activeData.previous,
    },
  ];

  const options: ApexOptions = {
    colors: [activeTab === "revenue" ? "#465FFF" : "#039855", "#9CA3AF"],
    chart: {
      type: "area",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    markers: {
      size: activeData.current.length > 10 ? 3 : 4,
      strokeWidth: 2,
    },
    xaxis: {
      categories: activeData.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        rotate: -45,
        rotateAlways: false,
        hideOverlappingLabels: true,
        style: { colors: "#6B7280", fontSize: "10px" },
      },
      tickAmount: activeData.categories.length > 10 ? 10 : undefined,
    },
    yaxis: {
      labels: {
        style: { colors: "#6B7280", fontSize: "11px" },
        formatter: (val: number) => `₹${formatCurrency(val)}`.replace("₹₹", "₹"),
      },
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 3,
    },
    legend: {
      show: false // Custom legend used
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => `₹${formatCurrency(val)}`.replace("₹₹", "₹"),
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">Performance Comparison</h3>
          <p className="text-xs text-gray-500">Comparing current vs previous period performance</p>
          
          <div className="mt-6 flex flex-wrap gap-8">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Current Total</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">₹{formatCurrency(totalCurrent)}</span>
                    {activeTab === "revenue" && (
                        <span className={`flex items-center text-xs font-bold ${growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-1 opacity-60">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Previous Total</span>
                </div>
                <div>
                    <span className="text-xl font-bold text-gray-600 dark:text-gray-400">₹{formatCurrency(totalPrevious)}</span>
                </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 h-fit">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "revenue"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            By Revenue
          </button>
          <button
            onClick={() => setActiveTab("profit")}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "profit"
                ? "bg-emerald-50 text-emerald-600 shadow-sm dark:bg-emerald-900/20 dark:text-emerald-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            By Profit
          </button>
        </div>
      </div>

      <div className="h-[280px] w-full mt-4">
        <ReactApexChart options={options} series={series} type="area" height="100%" />
      </div>
    </div>
  );
}
