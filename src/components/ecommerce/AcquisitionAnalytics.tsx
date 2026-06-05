"use client";
import React from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import Badge from "../ui/badge/Badge";
import { ArrowUpIcon, ArrowDownIcon } from "@/icons";
import { formatCompact } from "@/lib/format";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

/* ─── Types ──────────────────────────────────────────────────────── */
interface AcquisitionData {
  newUsersCount: number;
  newUserOrdersCount: number;
  repeatOrdersCount: number;
  repeatOrderRate: number;
  newUserOrderConversionRate: number;
  cac: number;
  avgTimeToFirstOrder: number;
  newUsersWhoOrderedCount: number;
  newUserOrderMetrics: { change: number; trend: string };
  repeatOrderMetrics: { change: number; trend: string };
  acquisitionCombined: Array<{
    date: string;
    newUsers: number;
    newUserOrders: number;
    repeatOrders: number;
    totalOrders: number;
    marketingSpend: number;
  }>;
  newUserOrderTrend: { categories: string[]; current: number[]; previous: number[] };
  repeatOrderTrend: { categories: string[]; current: number[]; previous: number[] };
  newUserRevenue: number;
  repeatRevenue: number;
  roas: number;
  repeatUsersCount: number;
  dowBreakdown: Array<{ day: string; newUserOrders: number; repeatOrders: number; avgSpend: number; totalOrders: number }>;
}

interface Props {
  acquisition?: AcquisitionData;
}

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
  color: "brand" | "blue" | "emerald" | "violet" | "amber" | "rose" | "sky";
  trend?: string;
  change?: number;
}) {
  const palette: Record<string, string> = {
    brand:   "border-brand-100 from-brand-50 dark:border-brand-500/20 dark:from-brand-900/20",
    blue:    "border-blue-100 from-blue-50 dark:border-blue-500/20 dark:from-blue-900/20",
    emerald: "border-emerald-100 from-emerald-50 dark:border-emerald-500/20 dark:from-emerald-900/20",
    violet:  "border-violet-100 from-violet-50 dark:border-violet-500/20 dark:from-violet-900/20",
    amber:   "border-amber-100 from-amber-50 dark:border-amber-500/20 dark:from-amber-900/20",
    rose:    "border-rose-100 from-rose-50 dark:border-rose-500/20 dark:from-rose-900/20",
    sky:     "border-sky-100 from-sky-50 dark:border-sky-500/20 dark:from-sky-900/20",
  };
  const textPalette: Record<string, string> = {
    brand:   "text-brand-600/70",
    blue:    "text-blue-600/70",
    emerald: "text-emerald-600/70",
    violet:  "text-violet-600/70",
    amber:   "text-amber-600/70",
    rose:    "text-rose-600/70",
    sky:     "text-sky-600/70",
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br to-white p-5 shadow-sm dark:to-gray-900 md:p-6 ${palette[color]}`}>
      <div className="flex items-end justify-between">
        <div>
          <span className={`text-xs font-bold uppercase tracking-widest ${textPalette[color]}`}>
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

/* ─── Mini Trend Chart ───────────────────────────────────────────── */
function TrendMiniChart({
  title,
  sub,
  trend,
  color,
}: {
  title: string;
  sub: string;
  trend: { categories: string[]; current: number[]; previous: number[] };
  color: string;
}) {
  const options: ApexOptions = {
    colors: [color, "#D1D5DB"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 110,
      sparkline: { enabled: false },
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: [2, 1.5], dashArray: [0, 4] },
    fill: {
      type: ["gradient", "solid"],
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.3,
        opacityFrom: 0.25,
        opacityTo: 0.0,
      },
      opacity: [1, 0],
    },
    xaxis: {
      categories: trend.categories,
      labels: {
        show: true,
        style: { colors: "#9CA3AF", fontSize: "9px" },
        rotate: 0,
        hideOverlappingLabels: true,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: false },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 2,
      padding: { left: 0, right: 0, top: 0, bottom: 0 },
    },
    legend: { show: false },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (v: number) => formatCompact(v) },
    },
  };

  const series = [
    { name: "This period", data: trend.current },
    { name: "Previous",    data: trend.previous },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</p>
      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{sub}</p>
      <div className="-mx-2 mt-3">
        <ReactApexChart options={options} series={series} type="area" height={110} />
      </div>
    </div>
  );
}

/* ─── Conversion Funnel ──────────────────────────────────────── */
function ConversionFunnel({
  registered,
  converted,
  retained,
}: {
  registered: number;
  converted: number;
  retained: number;
}) {
  const steps = [
    { label: "Registered", value: registered, color: "bg-brand-500", text: "text-brand-600" },
    { label: "Placed First Order", value: converted, color: "bg-emerald-500", text: "text-emerald-600" },
    { label: "Became Repeat Buyer", value: retained, color: "bg-violet-500", text: "text-violet-600" },
  ];
  const max = registered || 1;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Conversion Funnel</p>
      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Registered → ordered → retained</p>
      <div className="mt-5 space-y-4">
        {steps.map((step, i) => {
          const pct = max > 0 ? Math.round((step.value / max) * 100) : 0;
          const dropOff = i > 0 ? Math.round(((steps[i - 1].value - step.value) / (steps[i - 1].value || 1)) * 100) : null;
          return (
            <div key={step.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{step.label}</span>
                <div className="flex items-center gap-2">
                  {dropOff !== null && (
                    <span className="text-[10px] text-rose-500 font-bold">−{dropOff}%</span>
                  )}
                  <span className={`text-sm font-black ${step.text}`}>{step.value.toLocaleString()}</span>
                </div>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-3 rounded-full ${step.color} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-gray-400">{pct}% of registered users</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Revenue Split ──────────────────────────────────────────── */
function RevenueSplit({
  newUserRevenue,
  repeatRevenue,
}: {
  newUserRevenue: number;
  repeatRevenue: number;
}) {
  const total = newUserRevenue + repeatRevenue || 1;
  const newPct = Math.round((newUserRevenue / total) * 100);
  const repeatPct = 100 - newPct;

  const series = [newUserRevenue, repeatRevenue];
  const options: ApexOptions = {
    chart: { type: "donut", fontFamily: "Outfit, sans-serif", sparkline: { enabled: false } },
    colors: ["#465FFF", "#039855"],
    labels: ["New User Revenue", "Repeat Revenue"],
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              fontSize: "11px",
              fontFamily: "Outfit",
              color: "#9CA3AF",
              formatter: () => `₹${formatCompact(total)}`,
            },
          },
        },
      },
    },
    tooltip: {
      y: { formatter: (v: number) => `₹${formatCompact(v)}` },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Revenue Split</p>
      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">New user vs repeat order revenue</p>
      <div className="mt-4 flex items-center gap-6">
        <div className="w-36 shrink-0">
          <ReactApexChart options={options} series={series} type="donut" height={144} />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#465FFF]" />
                New Users
              </span>
              <span className="text-xs font-black text-[#465FFF]">{newPct}%</span>
            </div>
            <p className="mt-0.5 text-sm font-bold text-gray-800 dark:text-white">₹{formatCompact(newUserRevenue)}</p>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                Repeat Buyers
              </span>
              <span className="text-xs font-black text-emerald-600">{repeatPct}%</span>
            </div>
            <p className="mt-0.5 text-sm font-bold text-gray-800 dark:text-white">₹{formatCompact(repeatRevenue)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Day-of-Week Chart ──────────────────────────────────────── */
function DayOfWeekChart({
  dow,
}: {
  dow: Array<{ day: string; newUserOrders: number; repeatOrders: number; avgSpend: number; totalOrders: number }>;
}) {
  const hasSpend = dow.some(d => d.avgSpend > 0);

  const options: ApexOptions = {
    colors: ["#465FFF", "#039855", "#F59E0B"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 200,
      stacked: false,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 3,
        borderRadiusApplication: "end",
      } as any,
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: [0, 0, 2.5],
      curve: "smooth",
      colors: ["transparent", "transparent", "#F59E0B"],
    },
    xaxis: {
      categories: dow.map(d => d.day),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#6B7280", fontSize: "11px" } },
    },
    yaxis: hasSpend ? [
      {
        title: { text: "Orders", style: { color: "#6B7280", fontSize: "11px", fontFamily: "Outfit" } },
        labels: { style: { colors: "#6B7280", fontSize: "11px" }, formatter: (v: number) => String(Math.round(v)) },
      },
      { show: false },
      {
        opposite: true,
        title: { text: "Avg Spend (₹)", style: { color: "#6B7280", fontSize: "11px", fontFamily: "Outfit" } },
        labels: { style: { colors: "#6B7280", fontSize: "11px" }, formatter: (v: number) => `₹${Math.round(v)}` },
      },
    ] : {
      labels: { style: { colors: "#6B7280", fontSize: "11px" }, formatter: (v: number) => String(Math.round(v)) },
    },
    grid: { borderColor: "#F3F4F6", strokeDashArray: 2, xaxis: { lines: { show: false } } },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      fontWeight: 500,
      fontSize: "12px",
      markers: { size: 5 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (v: number, { seriesIndex }) =>
          seriesIndex === 2 ? `₹${Math.round(v)}` : `${Math.round(v)} orders`,
      },
    },
  };

  const series = [
    { name: "New User Orders", type: "bar",  data: dow.map(d => d.newUserOrders) },
    { name: "Repeat Orders",   type: "bar",  data: dow.map(d => d.repeatOrders) },
    ...(hasSpend ? [{ name: "Avg Ad Spend", type: "line", data: dow.map(d => d.avgSpend) }] : []),
  ] as any;

  const bestDay = dow.reduce((best, d) =>
    d.avgSpend > 0 && (d.totalOrders / d.avgSpend) > ((best.totalOrders || 0) / (best.avgSpend || 1))
      ? d : best
  , dow[0]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Orders by Day of Week</p>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Which days drive new vs repeat orders{hasSpend ? " — with avg daily ad spend" : ""}
          </p>
        </div>
        {hasSpend && bestDay?.avgSpend > 0 && (
          <div className="text-right shrink-0 ml-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Best ROI Day</p>
            <p className="text-lg font-black text-gray-800 dark:text-white">{bestDay.day}</p>
            <p className="text-[10px] text-gray-400">{bestDay.totalOrders} orders · ₹{Math.round(bestDay.avgSpend)} spend</p>
          </div>
        )}
      </div>
      <div className="-mx-2 mt-3">
        <ReactApexChart options={options} series={series} type="bar" height={200} />
      </div>
    </div>
  );
}

/* ─── Spend vs Acquisitions Chart ───────────────────────────── */
function SpendVsAcquisitions({
  combined,
  categories,
}: {
  combined: Array<{ newUserOrders: number; repeatOrders: number; marketingSpend: number }>;
  categories: string[];
}) {
  const hasSpend = combined.some(d => d.marketingSpend > 0);
  if (!hasSpend) return null;

  const options: ApexOptions = {
    colors: ["#465FFF", "#039855", "#F59E0B"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 280,
      stacked: false,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        borderRadius: 3,
        borderRadiusApplication: "end",
      } as any,
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: [0, 0, 2.5],
      curve: "smooth",
      colors: ["transparent", "transparent", "#F59E0B"],
    },
    xaxis: {
      categories,
      tickAmount: Math.min(categories.length, 14),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { hideOverlappingLabels: true, style: { colors: "#6B7280", fontSize: "11px" } },
    },
    yaxis: [
      {
        title: { text: "Orders", style: { color: "#6B7280", fontSize: "11px", fontFamily: "Outfit" } },
        labels: { style: { colors: "#6B7280", fontSize: "11px" }, formatter: (v: number) => String(Math.round(v)) },
      },
      { show: false },
      {
        opposite: true,
        title: { text: "Ad Spend (₹)", style: { color: "#F59E0B", fontSize: "11px", fontFamily: "Outfit" } },
        labels: { style: { colors: "#6B7280", fontSize: "11px" }, formatter: (v: number) => `₹${formatCompact(v)}` },
      },
    ],
    grid: { borderColor: "#F3F4F6", strokeDashArray: 2, xaxis: { lines: { show: false } } },
    fill: { opacity: [0.9, 0.9, 1] },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      fontWeight: 500,
      fontSize: "12px",
      markers: { size: 5 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (v: number, { seriesIndex }) =>
          seriesIndex === 2 ? `₹${formatCompact(v)}` : `${Math.round(v)} orders`,
      },
    },
  };

  const series = [
    { name: "New User Orders", type: "bar",  data: combined.map(d => d.newUserOrders),   yAxisIndex: 0 },
    { name: "Repeat Orders",   type: "bar",  data: combined.map(d => d.repeatOrders),    yAxisIndex: 0 },
    { name: "Ad Spend",        type: "line", data: combined.map(d => d.marketingSpend),  yAxisIndex: 2 },
  ] as any;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Ad Spend vs Order Results
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Does spending more on ads drive more orders? Amber line = ad spend, bars = orders.
        </p>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[680px] xl:min-w-full pl-2">
          <ReactApexChart options={options} series={series} type="bar" height={280} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function AcquisitionAnalytics({ acquisition }: Props) {
  const data = acquisition;
  const combined = data?.acquisitionCombined ?? [];

  const categories = combined.map(d => {
    const date = new Date(d.date + "T00:00:00");
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  });

  const chartOptions: ApexOptions = {
    colors: ["#465FFF", "#039855", "#F59E0B"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 340,
      stacked: false,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last",
      } as any,
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: [0, 0, 2.5],
      curve: "smooth",
      colors: ["transparent", "transparent", "#F59E0B"],
    },
    xaxis: {
      categories,
      tickAmount: Math.min(categories.length, 14),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        hideOverlappingLabels: true,
        style: { colors: "#6B7280", fontSize: "11px" },
      },
    },
    yaxis: {
      title: {
        text: "Count",
        style: { color: "#6B7280", fontSize: "11px", fontFamily: "Outfit" },
      },
      labels: {
        style: { colors: "#6B7280", fontSize: "11px" },
        formatter: (v: number) => String(Math.round(v)),
      },
      min: 0,
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    fill: { opacity: [0.9, 0.9, 1] },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      fontWeight: 500,
      fontSize: "12px",
      markers: { size: 5 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (v: number, { seriesIndex }) =>
          seriesIndex === 2
            ? `${Math.round(v)} users`
            : `${Math.round(v)} orders`,
      },
    },
  };

  const chartSeries = [
    {
      name: "New User Orders",
      type: "bar",
      data: combined.map(d => d.newUserOrders),
    },
    {
      name: "Repeat Orders",
      type: "bar",
      data: combined.map(d => d.repeatOrders),
    },
    {
      name: "New Registrations",
      type: "line",
      data: combined.map(d => d.newUsers),
    },
  ] as any;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white">
          Acquisition & Retention
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          New user growth, order conversion and repeat behaviour
        </p>
      </div>

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6">
        <StatCard
          label="New Users"
          value={formatCompact(data?.newUsersCount ?? 0)}
          color="brand"
          trend={data?.newUserOrderMetrics?.trend}
          change={data?.newUserOrderMetrics?.change}
        />
        <StatCard
          label="New User Orders"
          value={formatCompact(data?.newUserOrdersCount ?? 0)}
          sub="First-ever orders"
          color="blue"
          trend={data?.newUserOrderMetrics?.trend}
          change={data?.newUserOrderMetrics?.change}
        />
        <StatCard
          label="Repeat Orders"
          value={formatCompact(data?.repeatOrdersCount ?? 0)}
          sub="From returning users"
          color="emerald"
          trend={data?.repeatOrderMetrics?.trend}
          change={data?.repeatOrderMetrics?.change}
        />
        <StatCard
          label="Repeat Rate"
          value={`${data?.repeatOrderRate ?? 0}%`}
          sub="of total orders"
          color="violet"
        />
      </div>

      {/* Secondary metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <StatCard
          label="New User Conversion"
          value={`${data?.newUserOrderConversionRate ?? 0}%`}
          sub={`${data?.newUsersWhoOrderedCount ?? 0} of ${data?.newUsersCount ?? 0} new users ordered`}
          color="amber"
        />
        <StatCard
          label="Cost per Acquisition"
          value={data?.cac ? `₹${data.cac.toFixed(0)}` : "—"}
          sub="Marketing spend ÷ converted new users"
          color="rose"
        />
        <StatCard
          label="Avg Time to First Order"
          value={data?.avgTimeToFirstOrder !== undefined ? `${data.avgTimeToFirstOrder}d` : "—"}
          sub="Days from signup to first order"
          color="sky"
        />
        <StatCard
          label="ROAS"
          value={data?.roas ? `${data.roas}x` : "—"}
          sub="New-user revenue per ₹1 ad spend"
          color="emerald"
        />
      </div>

      {/* Breakdown chart */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Order Acquisition Breakdown
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            New user orders vs repeat orders, overlaid with daily new registrations
          </p>
        </div>

        {combined.length > 0 ? (
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <div className="-ml-5 min-w-[680px] xl:min-w-full pl-2">
              <ReactApexChart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height={340}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">
            No data for selected period
          </div>
        )}
      </div>

      {/* Spend vs Acquisitions */}
      <SpendVsAcquisitions combined={combined} categories={categories} />

      {/* Trend comparison mini-charts */}
      {data?.newUserOrderTrend && data?.repeatOrderTrend && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
          <TrendMiniChart
            title="New User Orders"
            sub="This period vs previous"
            trend={data.newUserOrderTrend}
            color="#465FFF"
          />
          <TrendMiniChart
            title="Repeat Orders"
            sub="This period vs previous"
            trend={data.repeatOrderTrend}
            color="#039855"
          />
        </div>
      )}

      {/* Conversion funnel + Revenue split */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        <ConversionFunnel
          registered={data?.newUsersCount ?? 0}
          converted={data?.newUsersWhoOrderedCount ?? 0}
          retained={data?.repeatUsersCount ?? 0}
        />
        <RevenueSplit
          newUserRevenue={data?.newUserRevenue ?? 0}
          repeatRevenue={data?.repeatRevenue ?? 0}
        />
      </div>

      {/* Day-of-week breakdown */}
      {data?.dowBreakdown && data.dowBreakdown.length > 0 && (
        <DayOfWeekChart dow={data.dowBreakdown} />
      )}
    </div>
  );
}
