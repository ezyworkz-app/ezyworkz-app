"use client";
import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { AlertCircle, ArrowDownRight, ArrowUpRight, LineChart, Store, Tag, TrendingDown } from "lucide-react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface CancellationAnalyticsProps {
    data?: {
        topReasons: { reason: string; count: number; topShops?: { shopName: string; count: number }[] }[];
        topShopsWithCancellations: { shopName: string; count: number }[];
        totalCancelled: number;
        totalCancelledPrevious?: number;
        trend?: {
            categories: string[];
            current: number[];
            previous: number[];
        };
    };
}

export const CancellationAnalytics = ({ data }: CancellationAnalyticsProps) => {
    if (!data) return null;

    const { topReasons, topShopsWithCancellations, totalCancelled, totalCancelledPrevious, trend } = data;

    const reasonsSeries = topReasons.map(r => r.count);
    const reasonsLabels = topReasons.map(r => r.reason);

    const shopsSeries = topShopsWithCancellations.map(s => s.count);
    const shopsLabels = topShopsWithCancellations.map(s => s.shopName);

    // Calculate trend percentage
    const diff = totalCancelled - (totalCancelledPrevious || 0);
    const trendPercentage = totalCancelledPrevious ? (diff / totalCancelledPrevious) * 100 : (totalCancelled > 0 ? 100 : 0);
    const isTrendUp = diff > 0;

    const barOptions: ApexOptions = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            fontFamily: "Outfit, sans-serif",
            animations: {
                enabled: true,
                speed: 800,
            }
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                horizontal: true,
                barHeight: '60%',
                distributed: true,
                dataLabels: {
                    position: 'top',
                },
            }
        },
        dataLabels: {
            enabled: true,
            textAnchor: 'start',
            style: { 
                fontSize: '10px',
                fontWeight: 900,
                colors: ['#6B7280'] // Medium gray for better visibility outside bars
            },
            formatter: function (val, opt) {
                return opt.w.globals.labels[opt.dataPointIndex] + " (" + val + ")"
            },
            offsetX: 10,
            dropShadow: { enabled: false }
        },
        colors: ['#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#B91C1C'],
        xaxis: {
            categories: reasonsLabels,
            labels: { show: true, style: { colors: '#9CA3AF' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: { show: false }
        },
        grid: { 
            show: true,
            borderColor: '#F3F4F6',
            strokeDashArray: 4,
            xaxis: {
                lines: { show: true }
            }
        },
        tooltip: {
            theme: 'dark',
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const reasonObj = topReasons[dataPointIndex];
                if (!reasonObj) return '';
                
                const shopList = reasonObj.topShops?.map(s => 
                    `<div class="flex justify-between gap-4 text-[10px] py-1 border-b border-white/5 last:border-0">
                        <span class="text-gray-400 font-bold uppercase truncate max-w-[120px]">${s.shopName}</span>
                        <span class="text-white font-black">${s.count}</span>
                    </div>`
                ).join('') || '<div class="text-[10px] text-gray-500 italic">No shop data</div>';

                return `<div class="p-4 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl min-w-[220px]">
                    <div class="flex items-center gap-2 mb-3 border-b border-gray-800 pb-2">
                        <div class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                        <span class="text-[11px] font-black text-white uppercase tracking-tight">${reasonObj.reason}</span>
                    </div>
                    <div class="space-y-1">
                        <div class="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex justify-between items-center">
                            <span>Top Affected Shops</span>
                            <span class="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 font-black">${reasonObj.count}</span>
                        </div>
                        <div class="max-h-[150px] overflow-y-auto no-scrollbar">
                            ${shopList}
                        </div>
                    </div>
                </div>`;
            }
        },
        legend: { show: false }
    };

    const shopsBarOptions: ApexOptions = {
        ...barOptions,
        colors: ['#A5B4FC', '#818CF8', '#6366F1', '#4F46E5', '#4338CA'],
        dataLabels: {
            ...barOptions.dataLabels,
            style: { 
                fontSize: '10px',
                fontWeight: 900,
                colors: ['#6366F1'] 
            },
            formatter: function (val, opt) {
                return opt.w.globals.labels[opt.dataPointIndex] + " (" + val + ")"
            },
        },
        xaxis: {
            categories: shopsLabels,
            labels: { show: true, style: { colors: '#9CA3AF' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        tooltip: {
            theme: 'dark',
            y: { 
                title: { formatter: () => 'Cancellations: ' },
                formatter: (val) => val.toString()
            }
        }
    };

    const trendOptions: ApexOptions = {
        chart: {
            type: 'line',
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: "Outfit, sans-serif",
            animations: {
                enabled: true,
                speed: 800,
                animateGradually: { enabled: true, delay: 150 },
                dynamicAnimation: { enabled: true, speed: 350 }
            },
            dropShadow: {
                enabled: true,
                top: 10,
                left: 0,
                blur: 10,
                color: '#EF4444',
                opacity: 0.15
            }
        },
        stroke: {
            curve: 'smooth',
            width: [4, 2],
            dashArray: [0, 8]
        },
        colors: ['#EF4444', '#9CA3AF'],
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'vertical',
                shadeIntensity: 0.5,
                gradientToColors: ['#F87171', '#D1D5DB'],
                inverseColors: false,
                opacityFrom: [1, 0.4],
                opacityTo: [0.9, 0.1],
                stops: [0, 100]
            }
        },
        xaxis: {
            categories: trend?.categories || [],
            labels: { 
                style: { colors: '#9CA3AF', fontSize: '10px', fontWeight: 700 },
                offsetY: 5
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
            tooltip: { enabled: false }
        },
        yaxis: {
            labels: { 
                style: { colors: '#9CA3AF', fontSize: '10px', fontWeight: 700 },
                formatter: (val) => val.toFixed(0)
            }
        },
        grid: {
            borderColor: '#F3F4F6',
            strokeDashArray: 4,
            padding: { left: 20, right: 20, bottom: 10 },
            yaxis: { lines: { show: true } },
            xaxis: { lines: { show: false } }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            fontFamily: "Outfit, sans-serif",
            fontWeight: 800,
            fontSize: '11px',
            markers: { size: 8, offsetX: -5 },
            itemMargin: { horizontal: 20, vertical: 5 },
            labels: { colors: '#6B7280' },
            formatter: (name) => name.toUpperCase()
        },
        markers: {
            size: [5, 0],
            colors: ['#EF4444'],
            strokeColors: '#fff',
            strokeWidth: 3,
            hover: { size: 7, sizeOffset: 3 }
        },
        tooltip: {
            theme: 'dark',
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const currentVal = series[0][dataPointIndex];
                const prevVal = series[1][dataPointIndex];
                const category = w.globals.categoryLabels[dataPointIndex];
                
                const delta = currentVal - prevVal;
                const isPositive = delta > 0;
                
                return `<div class="p-4 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl min-w-[180px]">
                    <div class="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                        <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">${category} Analysis</span>
                        <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    </div>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Current Period</span>
                            <span class="text-white font-black text-sm">${currentVal}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Previous Period</span>
                            <span class="text-gray-500 font-black text-sm">${prevVal}</span>
                        </div>
                        <div class="pt-2 border-t border-gray-800 flex justify-between items-center">
                            <span class="text-[8px] font-black text-gray-500 uppercase tracking-widest">Net Change</span>
                            <span class="text-[10px] font-black ${isPositive ? 'text-red-500' : 'text-green-500'}">
                                ${isPositive ? '↑' : '↓'} ${Math.abs(delta)} Orders
                            </span>
                        </div>
                    </div>
                </div>`;
            }
        }
    };

    return (
        <div className="space-y-6 mt-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                        <TrendingDown className="text-red-600 size-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Cancellation Intelligence</h3>
                        <p className="text-sm text-gray-500 font-medium italic">Uncovering failure patterns & leakage clusters</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-[10px] uppercase tracking-[0.1em] shadow-sm transition-all duration-500 backdrop-blur-md ${
                        isTrendUp 
                        ? 'bg-red-50/50 dark:bg-red-900/10 text-red-600 border-red-100/50 dark:border-red-900/20' 
                        : 'bg-green-50/50 dark:bg-green-900/10 text-green-600 border-green-100/50 dark:border-green-900/20'
                    }`}>
                        {isTrendUp ? <ArrowUpRight className="size-4 animate-bounce" /> : <ArrowDownRight className="size-4 animate-bounce" />}
                        <span>{Math.abs(trendPercentage).toFixed(1)}% <span className="opacity-40 ml-1 font-bold">PoP Trend</span></span>
                    </div>
                    <div className="flex items-center gap-3 bg-gradient-to-br from-red-600 to-red-700 px-5 py-2.5 rounded-2xl shadow-[0_12px_24px_-8px_rgba(220,38,38,0.4)] border border-red-500/50 group cursor-default">
                        <AlertCircle className="text-white size-5 group-hover:rotate-12 transition-transform" />
                        <span className="text-white font-black text-xl leading-none flex items-baseline gap-1">
                            {totalCancelled} <span className="text-[10px] font-bold uppercase opacity-70 tracking-widest">Leaks</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Trend Chart (Line Chart) */}
            <div className="col-span-12">
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[3rem] p-10 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-red-500/10 transition-all duration-1000" />
                    
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-[1.5rem] shadow-inner group-hover:scale-105 transition-all duration-500 group-hover:rotate-3">
                                <LineChart className="text-red-600 size-6" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Volatility Timeline</h4>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-gray-200 dark:bg-gray-800"></span>
                                    Cancellations over period (PoP)
                                </p>
                            </div>
                        </div>
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Performance delta</span>
                            <span className={`text-lg font-black ${isTrendUp ? 'text-red-600' : 'text-green-600'}`}>
                                {isTrendUp ? '+' : '-'}{Math.abs(diff)} <span className="text-xs uppercase ml-1">Orders</span>
                            </span>
                        </div>
                    </div>
                    
                    <div className="relative z-10">
                        {trend ? (
                            <ReactApexChart 
                                options={trendOptions} 
                                series={[
                                    { name: 'Current Period', data: trend.current },
                                    { name: 'Previous Period', data: trend.previous }
                                ]} 
                                type="line" 
                                height={300} 
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                                <TrendingDown className="size-12 mb-4 opacity-10" />
                                <p className="font-bold uppercase tracking-tighter">No historical trend data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Top Reasons Chart */}
                <div className="col-span-12 lg:col-span-6">
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm h-full relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-red-500/10 transition-all" />
                        
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-inner">
                                <Tag className="text-red-600 size-6" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase">Primary Leakage Reasons</h4>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Customer Feedback Analysis</p>
                            </div>
                        </div>
                        
                        <div className="relative z-10">
                            {topReasons.length > 0 ? (
                                <ReactApexChart 
                                    options={barOptions} 
                                    series={[{ name: 'Cancellations', data: reasonsSeries }]} 
                                    type="bar" 
                                    height={350} 
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[350px] text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                                    <AlertCircle className="size-16 mb-4 opacity-10" />
                                    <p className="font-bold text-gray-300 uppercase tracking-tighter">No cancellation data for this period</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Shops Chart */}
                <div className="col-span-12 lg:col-span-6">
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm h-full relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/10 transition-all" />
                        
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl shadow-inner">
                                <Store className="text-indigo-600 size-6" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase">Vendor Vulnerability</h4>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Shop Cancellation Clusters</p>
                            </div>
                        </div>

                        <div className="relative z-10">
                            {topShopsWithCancellations.length > 0 ? (
                                <ReactApexChart 
                                    options={shopsBarOptions} 
                                    series={[{ name: 'Cancellations', data: shopsSeries }]} 
                                    type="bar" 
                                    height={350} 
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[350px] text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                                    <Store className="size-16 mb-4 opacity-10" />
                                    <p className="font-bold text-gray-300 uppercase tracking-tighter">Perfect retention across all shops</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
