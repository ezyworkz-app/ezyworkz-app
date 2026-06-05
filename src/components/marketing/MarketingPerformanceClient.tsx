"use client";
import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { getDashboardStats } from "@/lib/actions/dashboard";
import CampaignPerformance from "@/components/ecommerce/CampaignPerformance";
import Badge from "../ui/badge/Badge";
import { ArrowUpIcon, ArrowDownIcon } from "@/icons";
import { formatCompact } from "@/lib/format";
import { RefreshCw, TrendingUp } from "lucide-react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

/* ─── Styles ─────────────────────────────────────────────────────── */
const palette: Record<string, string> = {
  brand:   "border-brand-100 from-brand-50 dark:border-brand-500/20 dark:from-brand-900/20",
  blue:    "border-blue-100 from-blue-50 dark:border-blue-500/20 dark:from-blue-900/20",
  emerald: "border-emerald-100 from-emerald-50 dark:border-emerald-500/20 dark:from-emerald-900/20",
  violet:  "border-violet-100 from-violet-50 dark:border-violet-500/20 dark:from-violet-900/20",
  amber:   "border-amber-100 from-amber-50 dark:border-amber-500/20 dark:from-amber-900/20",
};

const textPalette: Record<string, string> = {
  brand:   "text-brand-600/70",
  blue:    "text-blue-600/70",
  emerald: "text-emerald-600/70",
  violet:  "text-violet-600/70",
  amber:   "text-amber-600/70",
};

/* ─── Stat Card ──────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  color,
  trend,
  change,
}: {
  label: string;
  value: string;
  sub?: string;
  color: "brand" | "blue" | "emerald" | "violet" | "amber";
  trend?: "up" | "down";
  change?: number;
}) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br to-white p-5 shadow-sm dark:to-gray-900 md:p-6 ${palette[color]}`}>
      <div className="flex items-end justify-between">
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${textPalette[color]}`}>
            {label}
          </span>
          <h4 className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {value}
          </h4>
          {sub && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>
          )}
        </div>
        {trend !== undefined && change !== undefined && (
          <Badge
            color={trend === "down" ? "error" : "success"}
            className="font-black text-[10px] self-start mt-1"
          >
            {trend === "down" ? <ArrowDownIcon /> : <ArrowUpIcon />}
            {Math.abs(change)}%
          </Badge>
        )}
      </div>
    </div>
  );
}

/* ─── Main Client ────────────────────────────────────────────────── */
export default function MarketingPerformanceClient() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState("Last 30 days");
  const [customLabel, setCustomLabel] = useState("");

  const fetchData = useCallback(async (rangeOrDates: any) => {
    setIsLoading(true);
    try {
      const data = await getDashboardStats(rangeOrDates);
      setStats(data);
      if (typeof rangeOrDates === 'object' && rangeOrDates.startDate) {
        setCustomLabel(`${rangeOrDates.startDate} → ${rangeOrDates.endDate}`);
      } else {
        setCustomLabel("");
      }
    } catch (error) {
      console.error("Failed to fetch marketing stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const acq = stats?.acquisition || {};
  const hasSpend = (acq.acquisitionCombined || []).some((d: any) => d.marketingSpend > 0);

  // Spend vs Revenue vs Users Series
  const chartSeries = [
    {
      name: "Marketing Spend",
      data: (acq.acquisitionCombined || []).map((d: any) => d.marketingSpend || 0),
    },
    {
      name: "Acquisition Revenue",
      data: (acq.acquisitionCombined || []).map((d: any) => d.newUserRevenue || 0),
    },
    {
      name: "Attributed Users",
      data: (acq.acquisitionCombined || []).map((d: any) => d.conversions || 0),
    },
  ];

  const chartOptions: ApexOptions = {
    colors: ["#F59E0B", "#465FFF", "#10B981"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 350,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: { curve: "smooth", width: 3 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: "rgba(0,0,0,0.05)",
      strokeDashArray: 3,
      xaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: (acq.acquisitionCombined || []).map((d: any) => d.date),
      labels: { style: { colors: "#9CA3AF", fontSize: "12px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#9CA3AF", fontSize: "12px" },
        formatter: (v) => `₹${formatCompact(v)}`,
      },
    },
    tooltip: {
      theme: "dark",
      x: { show: true },
      y: { 
        formatter: (v, { seriesIndex }) => {
            if (seriesIndex === 2) return `${v.toLocaleString()} users`;
            return `₹${v.toLocaleString()}`;
        }
      },
    },
    legend: { position: "top", horizontalAlign: "right", fontWeight: 700 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            Marketing Command Center
            {isLoading && <RefreshCw className="animate-spin text-brand-500" size={20} />}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitor ad spend efficiency, ROAS, and acquisition growth.
            {customLabel && <span className="ml-2 text-brand-500 font-bold">{customLabel}</span>}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="h-11 pl-4 pr-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all uppercase tracking-wider hover:border-brand-500/30 shadow-sm"
            >
              {["Today", "Yesterday", "Last 7 days", "Last 30 days", "Last 90 days"].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button onClick={() => fetchData(range)} className="h-11 w-11 flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-brand-500 transition-colors shadow-sm">
                <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 md:gap-6">
        <StatCard
          label="Total Ad Spend"
          value={`₹${formatCompact(acq.marketingSpend || 0)}`}
          sub="Google Ads focus"
          color="amber"
          trend={acq.marketingSpendMetrics?.trend}
          change={acq.marketingSpendMetrics?.change}
        />
        <StatCard
          label="Blended ROAS"
          value={`${(acq.roas || 0).toFixed(2)}x`}
          sub="Rev / Spend ratio"
          color="emerald"
        />
        <StatCard
          label="Avg. CAC"
          value={`₹${Math.round(acq.cac || 0)}`}
          sub="Cost per new user"
          color="blue"
        />
        <StatCard
          label="New Users (Ads)"
          value={formatCompact(acq.totalConversions || 0)}
          sub="Attributed conversions"
          color="emerald"
        />
        <StatCard
          label="Total Impressions"
          value={formatCompact(acq.totalImpressions || 0)}
          sub="Ad visibility"
          color="violet"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Spend vs Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Spend vs. Revenue</h3>
              <p className="text-xs text-gray-500">Correlation between marketing investment and acquisition revenue</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                <TrendingUp size={12} />
                High Efficiency
            </div>
          </div>
          <div className="-ml-4 h-[350px]">
            {isLoading ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading charts...</div>
            ) : (
                <ReactApexChart options={chartOptions} series={chartSeries} type="area" height="100%" />
            )}
          </div>
        </div>

        {/* Small breakdown or additional stat */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 flex flex-col justify-center text-center">
            <div className="p-8 rounded-full bg-brand-50 dark:bg-brand-500/10 w-fit mx-auto mb-6">
                <TrendingUp size={40} className="text-brand-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Efficiency Rating</h3>
            <p className="text-sm text-gray-500 mb-6">Your marketing performance is currently optimized for user growth.</p>
            
            <div className="space-y-4 text-left">
                {[
                    { label: "New User Share", value: "65%", color: "bg-brand-500" },
                    { label: "Repeat Order ROAS", value: "8.4x", color: "bg-emerald-500" },
                    { label: "Channel Diversification", value: "Low", color: "bg-amber-500" }
                ].map(item => (
                    <div key={item.label}>
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-1">
                            <span className="text-gray-400">{item.label}</span>
                            <span className="text-gray-900 dark:text-white">{item.value}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full`} style={{ width: item.value.includes('%') ? item.value : '75%' }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Campaign Detailed Performance */}
      <div>
        <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Granular Campaign Performance</h3>
            <p className="text-xs text-gray-500">Individual ad performance from linked Google Ads accounts</p>
        </div>
        <CampaignPerformance />
      </div>
    </div>
  );
}
