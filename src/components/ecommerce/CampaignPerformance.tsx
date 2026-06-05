"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getCampaignPerformance } from "@/lib/actions/dashboard";
import { formatCompact } from "@/lib/format";
import { RefreshCw, TrendingUp, ArrowUpDown, BarChart3, MousePointer2 } from "lucide-react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Campaign {
    campaignId: string;
    campaignName: string;
    accountId: string;
    accountName: string;
    status: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpa: number;
}

type SortKey = "spend" | "impressions" | "clicks" | "conversions" | "ctr" | "cpc" | "cpa";

const STATUS_COLORS: Record<string, string> = {
    ENABLED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    PAUSED:  "bg-amber-100  text-amber-700  dark:bg-amber-500/10  dark:text-amber-400",
    REMOVED: "bg-gray-100   text-gray-500   dark:bg-gray-500/10   dark:text-gray-400",
};

const today = () => new Date().toISOString().split("T")[0];
const daysAgo = (n: number) => {
    const d = new Date(); d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
};

export default function CampaignPerformance() {
    const [campaigns, setCampaigns]   = useState<Campaign[]>([]);
    const [isLoading, setIsLoading]   = useState(false);
    const [startDate, setStartDate]   = useState(daysAgo(30));
    const [endDate, setEndDate]       = useState(today());
    const [showCustom, setShowCustom] = useState(false);
    const [draftStart, setDraftStart] = useState(daysAgo(30));
    const [draftEnd, setDraftEnd]     = useState(today());
    const [sortBy, setSortBy]         = useState<SortKey>("spend");
    const [error, setError]           = useState<string | null>(null);

    const fetchCampaigns = useCallback(async (from: string, to: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getCampaignPerformance(from, to);
            setCampaigns(data || []);
        } catch (e: any) {
            setError("Failed to load campaign data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchCampaigns(startDate, endDate); }, [fetchCampaigns, startDate, endDate]);

    const handlePreset = (days: number) => {
        const from = daysAgo(days);
        const to   = today();
        setStartDate(from); setEndDate(to);
        setShowCustom(false);
        fetchCampaigns(from, to);
    };

    const handleApply = () => {
        if (!draftStart || !draftEnd) return;
        if (draftStart > draftEnd) { alert("Start date must be before end date."); return; }
        setStartDate(draftStart); setEndDate(draftEnd);
        setShowCustom(false);
        fetchCampaigns(draftStart, draftEnd);
    };

    const sorted = [...campaigns]
        .map(c => ({
            ...c,
            cpa: c.conversions > 0 ? parseFloat((c.spend / c.conversions).toFixed(2)) : 0
        }))
        .sort((a, b) => {
            const valA = a[sortBy] as number;
            const valB = b[sortBy] as number;
            return valB - valA;
        });

    const top = sorted[0];

    const chartData = [...campaigns]
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 5);

    const chartOptions: ApexOptions = {
        colors: ["#F59E0B", "#465FFF", "#10B981"],
        chart: {
            fontFamily: "Outfit, sans-serif",
            type: "bar",
            height: 280,
            toolbar: { show: false },
            zoom: { enabled: false },
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: true,
                barHeight: "85%",
                dataLabels: { position: "top" },
            },
        },
        legend: {
            show: true,
            position: "top",
            horizontalAlign: "left",
            fontWeight: 700,
            offsetY: -10,
        },
        dataLabels: {
            enabled: true,
            textAnchor: "start",
            offsetX: 10,
            style: { fontSize: "10px", fontWeight: 700, colors: ["#9CA3AF"] },
            formatter: function(val: any, opts: any) {
                if (opts.seriesIndex === 0) return `₹${formatCompact(val)}`;
                return formatCompact(val);
            }
        },
        grid: {
            borderColor: "rgba(0,0,0,0.05)",
            strokeDashArray: 3,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } },
        },
        xaxis: {
            categories: chartData.map(c => c.campaignName),
            labels: { 
                style: { colors: "#9CA3AF", fontSize: "10px" },
                formatter: (v) => typeof v === 'number' ? formatCompact(v) : v
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: { colors: "#6b7280", fontSize: "11px", fontWeight: 600 },
                maxWidth: 300,
            },
        },
        tooltip: {
            theme: "dark",
            shared: true,
            intersect: false,
            y: {
                formatter: function(val: any, opts: any) {
                    if (opts.seriesIndex === 0) return `₹${val.toLocaleString()}`;
                    if (opts.seriesIndex === 2) return `${val.toLocaleString()} signups`;
                    return `${val.toLocaleString()} clicks`;
                }
            }
        },
    };

    const chartSeries = [
        { name: "Ad Spend", data: chartData.map(c => c.spend) },
        { name: "Total Clicks", data: chartData.map(c => c.clicks) },
        { name: "New Users", data: chartData.map(c => c.conversions) }
    ];

    const SortButton = ({ col, label, align = "right" }: { col: SortKey; label: string; align?: "left" | "right" }) => (
        <button
            onClick={() => setSortBy(col)}
            className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                align === "right" ? "justify-end w-full" : "justify-start"
            } ${
                sortBy === col ? "text-brand-500" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
        >
            {label}
            <ArrowUpDown size={10} className={sortBy === col ? "text-brand-500" : "text-gray-300"} />
        </button>
    );

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="text-brand-500" size={18} />
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Campaign Performance</p>
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
                        Which ads yielded most users?
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {startDate} → {endDate}
                        {isLoading && <RefreshCw className="inline ml-2 animate-spin text-brand-500" size={12} />}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {[7, 30, 90].map(n => (
                        <button key={n} onClick={() => handlePreset(n)}
                            className={`h-8 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                                !showCustom && startDate === daysAgo(n) && endDate === today()
                                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                                    : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-brand-500/50"
                            }`}>
                            {n}d
                        </button>
                    ))}
                    <button onClick={() => setShowCustom(v => !v)}
                        className={`h-8 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                            showCustom
                                ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                                : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-brand-500/50"
                        }`}>
                        📅 Custom
                    </button>
                    <button onClick={() => fetchCampaigns(startDate, endDate)} disabled={isLoading}
                        className="h-8 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-brand-500/50 transition-colors">
                        <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {showCustom && (
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <input type="date" max={today()} value={draftStart} onChange={e => setDraftStart(e.target.value)}
                        className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <span className="text-sm text-gray-400">to</span>
                    <input type="date" max={today()} value={draftEnd} onChange={e => setDraftEnd(e.target.value)}
                        className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <button onClick={handleApply} disabled={!draftStart || !draftEnd}
                        className="h-9 px-4 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors">
                        Apply
                    </button>
                </div>
            )}

            {!error && campaigns.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-4 border-y border-gray-50 dark:border-gray-800">
                    <div className="lg:col-span-1 space-y-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500">Insights</p>
                            <h4 className="font-bold text-gray-900 dark:text-white">Performance Mix</h4>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                Ad Spend (₹)
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                Total Clicks
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                New Users
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed italic border-l-2 border-brand-500/20 pl-3">
                            Visualizing the funnel from spend to clicks to actual signups (Conversions) per campaign.
                        </p>
                    </div>
                    <div className="lg:col-span-3 min-h-[280px] -ml-6">
                        {isLoading ? (
                             <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading charts...</div>
                        ) : (
                            <ReactApexChart options={chartOptions} series={chartSeries} type="bar" height={280} />
                        )}
                    </div>
                </div>
            )}

            {top && top.spend > 0 && !showCustom && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-brand-50 to-emerald-50 dark:from-brand-500/10 dark:to-emerald-500/10 border border-brand-100 dark:border-brand-500/20">
                    <div className="text-2xl">🏆</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500">Top Performing Campaign</p>
                        <p className="font-bold text-gray-900 dark:text-white">{top.campaignName}</p>
                        <p className="text-xs text-gray-500">{top.accountName}</p>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-right shrink-0">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase">Spend</p>
                            <p className="font-black text-gray-900 dark:text-white">₹{formatCompact(top.spend)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase">Clicks</p>
                            <p className="font-black text-gray-900 dark:text-white">{formatCompact(top.clicks)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase">Users</p>
                            <p className="font-black text-emerald-600">{formatCompact(top.conversions)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Cost/User</p>
                            <p className="font-black text-brand-500">₹{top.cpa}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase">CTR</p>
                            <p className="font-black text-emerald-600">{top.ctr}%</p>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm text-rose-600 dark:text-rose-400">
                    {error}
                </div>
            )}

            {!error && (
                <div className="overflow-x-auto">
                    {sorted.length === 0 && !isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-3xl mb-2">📊</p>
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No campaign data yet</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm min-w-[800px]">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800">
                                    <th className="pb-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Campaign</th>
                                    <th className="pb-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Status</th>
                                    <th className="pb-4 px-2 text-right"><SortButton col="spend"       label="Spend"      align="right" /></th>
                                    <th className="pb-4 px-2 text-right"><SortButton col="clicks"      label="Clicks"     align="right" /></th>
                                    <th className="pb-4 px-2 text-right"><SortButton col="conversions" label="Users"      align="right" /></th>
                                    <th className="pb-4 px-2 text-right"><SortButton col="cpa"         label="Cost/User"  align="right" /></th>
                                    <th className="pb-4 px-2 text-right"><SortButton col="ctr"         label="CTR"        align="right" /></th>
                                    <th className="pb-4 pl-2 text-right"><SortButton col="cpc"         label="CPC"        align="right" /></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                {sorted.map((c, i) => (
                                    <tr key={c.campaignId} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="py-4 pr-4 text-left">
                                            <div className="flex items-center gap-3">
                                                <span className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                                                    i === 0 ? "bg-amber-100 text-amber-700" :
                                                    i === 1 ? "bg-gray-100 text-gray-500" :
                                                    i === 2 ? "bg-orange-100 text-orange-600" :
                                                    "bg-gray-50 text-gray-400"
                                                }`}>{i + 1}</span>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 dark:text-white line-clamp-2 max-w-[220px] leading-[1.2]">{c.campaignName}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide font-medium">{c.accountName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 pr-4 text-left">
                                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[c.status] || STATUS_COLORS.REMOVED}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right px-2 font-black text-gray-900 dark:text-white">₹{formatCompact(c.spend)}</td>
                                        <td className="py-4 text-right px-2 font-semibold text-gray-500 dark:text-gray-400">{formatCompact(c.clicks)}</td>
                                        <td className="py-4 text-right px-2 font-black text-emerald-600 dark:text-emerald-400">{formatCompact(c.conversions)}</td>
                                        <td className="py-4 text-right px-2 font-black text-violet-600 dark:text-violet-400">₹{c.cpa}</td>
                                        <td className="py-4 text-right px-2 font-semibold text-blue-600 dark:text-blue-400">{c.ctr}%</td>
                                        <td className="py-4 text-right pl-2 font-medium text-gray-500 dark:text-gray-400">₹{c.cpc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {sorted.length > 0 && (
                <p className="text-[10px] text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-800 pt-3">
                    CTR = clicks ÷ impressions · CPC = spend ÷ clicks · Sorted by <span className="font-bold">{sortBy}</span> · Click column headers to re-sort · Data from Google Ads API
                </p>
            )}
        </div>
    );
}
