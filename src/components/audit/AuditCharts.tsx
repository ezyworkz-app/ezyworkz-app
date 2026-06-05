"use client";
import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AuditChartsProps {
    timeline: { date: string; count: number }[];
    types: { name: string; value: number }[];
    funnel: { SHOP_VISITED: number; SERVICE_SELECTED: number; CHECKOUT_STARTED: number; ORDER_PLACED: number };
}

export default function AuditCharts({ timeline, types, funnel }: AuditChartsProps) {
    const funnelSteps = [
        { name: "Shop Visits", value: funnel.SHOP_VISITED || 0 },
        { name: "Service Selection", value: funnel.SERVICE_SELECTED || 0 },
        { name: "Checkout Started", value: funnel.CHECKOUT_STARTED || 0 },
        { name: "Orders Placed", value: funnel.ORDER_PLACED || 0 },
    ];
    const lineOptions: ApexOptions = {
        colors: ["#465FFF"],
        chart: {
            fontFamily: "Outfit, sans-serif",
            type: "area",
            height: 300,
            toolbar: { show: false },
            zoom: { enabled: false },
        },
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 3 },
        grid: {
            borderColor: "rgba(0,0,0,0.05)",
            strokeDashArray: 3,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } },
        },
        xaxis: {
            categories: timeline.map(t => t.date),
            labels: { style: { colors: "#9CA3AF", fontSize: "10px" } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: { style: { colors: "#6b7280", fontSize: "11px" } },
        },
        tooltip: { theme: "dark" },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0,
                stops: [0, 90, 100]
            }
        },
    };

    const donutOptions: ApexOptions = {
        colors: ["#465FFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#9CA3AF"],
        chart: {
            fontFamily: "Outfit, sans-serif",
            type: "donut",
        },
        labels: types.map(t => t.name.replace(/_/g, " ")),
        legend: {
            position: "bottom",
            fontFamily: "Outfit",
            fontWeight: 500,
            fontSize: "12px",
            labels: { colors: "#6b7280" },
            markers: {
                strokeWidth: 0,
            }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: "75%",
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: "Total Logs",
                            fontSize: "12px",
                            color: "#6b7280",
                            formatter: () => types.reduce((a, b) => a + b.value, 0).toString()
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false },
        stroke: { show: false },
        tooltip: { theme: "dark" }
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline Chart */}
                <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="mb-4">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Activity Timeline</h4>
                        <p className="text-xs text-gray-500">Log frequency over the last 30 days</p>
                    </div>
                    <div className="h-[300px]">
                        <ReactApexChart options={lineOptions} series={[{ name: "Logs", data: timeline.map(t => t.count) }]} type="area" height={300} />
                    </div>
                </div>

                {/* Type Distribution */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="mb-4">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Action Mix</h4>
                        <p className="text-xs text-gray-500">Distribution of triggered actions</p>
                    </div>
                    <div className="h-[300px] flex items-center justify-center">
                        <ReactApexChart options={donutOptions} series={types.map(t => t.value)} type="donut" width="100%" />
                    </div>
                </div>
            </div>

            {/* Conversion Funnel */}
            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Conversion Funnel</h4>
                    <p className="text-xs text-gray-500">User progression from entry to booking</p>
                </div>
                
                <div className="space-y-4">
                    {funnelSteps.map((step, idx) => {
                        const maxValue = funnelSteps[0].value || 1;
                        const width = (step.value / maxValue) * 100;
                        const prevValue = idx > 0 ? funnelSteps[idx-1].value : null;
                        const dropOff = prevValue ? Math.round((step.value / prevValue) * 100) : null;

                        return (
                            <div key={step.name} className="relative">
                                <div className="flex items-center justify-between mb-1.5 px-1">
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{step.name}</span>
                                    <div className="flex items-center gap-3">
                                        {dropOff !== null && (
                                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                {dropOff}% Conv.
                                            </span>
                                        )}
                                        <span className="text-sm font-black text-gray-900 dark:text-white">{step.value}</span>
                                    </div>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                    <div 
                                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-1000 ease-out" 
                                        style={{ width: `${Math.max(width, 2)}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {funnelSteps[0].value > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800/50 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Overall Conversion Rate</span>
                        <span className="text-lg font-black text-brand-500">
                            {Math.round((funnel.ORDER_PLACED / (funnel.SHOP_VISITED || 1)) * 100)}%
                        </span>
                    </div>
                )}
            </div>
        </>
    );
}
