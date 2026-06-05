"use client";

import React, { useState } from "react";
import { TrendingUp, Zap, Percent, Wallet, Clock, Check, RefreshCcw } from "lucide-react";
import { ShopSettlement } from "@/types/shop-settlement";
import ShopFinanceTrendChart from "./ShopFinanceTrendChart";

interface SettlementsAnalyticsProps {
  allPaidSettlements: ShopSettlement[];
  pendingSettlements: ShopSettlement[];
}

export default function SettlementsAnalytics({
  allPaidSettlements,
  pendingSettlements,
}: SettlementsAnalyticsProps) {
  const [chartTimeframe, setChartTimeframe] = useState<"monthly" | "weekly">("monthly");

  const paid = allPaidSettlements.reduce(
    (acc, s) => ({
      gross: acc.gross + (s.shopGrossAmount || 0),
      bonus: acc.bonus + (s.shopPriorityAmount || 0),
      commission: acc.commission + (s.shopCommissionAmount || 0),
      logistics: acc.logistics + (s.shopLogisticsCost || 0),
      net: acc.net + (s.shopTotalAmount || 0),
    }),
    { gross: 0, bonus: 0, commission: 0, logistics: 0, net: 0 }
  );

  const pending = pendingSettlements.reduce(
    (acc, s) => ({ total: acc.total + (s.shopTotalAmount || 0), count: acc.count + 1 }),
    { total: 0, count: 0 }
  );

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const kpis = [
    {
      label: "Pending Payouts",
      value: `₹${fmt(pending.total)}`,
      sub: `${pending.count} unsettled`,
      icon: <Clock size={18} />,
      color: "brand" as const,
    },
    {
      label: "Lifetime Net Paid",
      value: `₹${fmt(paid.net)}`,
      sub: `${allPaidSettlements.length} orders`,
      icon: <Wallet size={18} />,
      color: "success" as const,
    },
    {
      label: "Lifetime Gross",
      value: `₹${fmt(paid.gross)}`,
      sub: "Before commission",
      icon: <TrendingUp size={18} />,
      color: "indigo" as const,
    },
    {
      label: "Total Commissions",
      value: `₹${fmt(paid.commission)}`,
      sub: "Platform earnings",
      icon: <Percent size={18} />,
      color: "error" as const,
    },
    {
      label: "Total Bonuses",
      value: `₹${fmt(paid.bonus)}`,
      sub: "Express + One Day",
      icon: <Zap size={18} />,
      color: "warning" as const,
    },
    {
      label: "Total Logistics",
      value: `₹${fmt(paid.logistics)}`,
      sub: "Shop-handled delivery",
      icon: <RefreshCcw size={18} />,
      color: "blue" as const,
    },
  ];

  return (
    <div className="space-y-6 pt-2">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Payout Trend Chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-theme-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">
              Payout Trends
            </h3>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
              Historical gross, net & logistics over time
            </p>
          </div>
          <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700 self-start sm:self-auto">
            {(["weekly", "monthly"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf)}
                className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all capitalize tracking-wide ${
                  chartTimeframe === tf
                    ? "bg-white dark:bg-gray-700 text-brand-500 shadow-sm"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <ShopFinanceTrendChart settlements={allPaidSettlements} timeframe={chartTimeframe} />
      </div>

      {/* Breakdown Summary */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-theme-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Lifetime Breakdown
          </h3>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
            Cumulative across all settled orders
          </p>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {[
            { label: "Gross Revenue", value: paid.gross, note: "Shop base + addons before fees", color: "text-gray-900 dark:text-white" },
            { label: "Priority Bonuses", value: paid.bonus, note: "Express & One Day top-ups", color: "text-indigo-600 dark:text-indigo-400", prefix: "+" },
            { label: "Platform Commission", value: paid.commission, note: "Deducted from gross + bonus", color: "text-error-600 dark:text-error-400", prefix: "−" },
            { label: "Logistics Fees", value: paid.logistics, note: "Shop-handled delivery reimbursement", color: "text-blue-light-600 dark:text-blue-light-400", prefix: "+" },
            { label: "Net Settled", value: paid.net, note: "Total actually paid to shop", color: "text-success-600 dark:text-success-400", bold: true },
          ].map((row) => (
            <div key={row.label} className={`flex items-center justify-between px-6 py-3.5 ${row.bold ? "bg-success-50/30 dark:bg-success-500/5" : "hover:bg-gray-50/50 dark:hover:bg-white/[0.01]"}`}>
              <div>
                <p className={`text-[11px] font-black uppercase tracking-wide ${row.bold ? "text-success-700 dark:text-success-400" : "text-gray-700 dark:text-gray-300"}`}>
                  {row.label}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{row.note}</p>
              </div>
              <span className={`text-sm font-black tabular-nums ${row.color}`}>
                {row.prefix ?? ""}₹{fmt(row.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type KpiColor = "brand" | "success" | "indigo" | "error" | "warning" | "blue";

function KpiCard({
  label, value, sub, icon, color,
}: {
  label: string; value: string; sub?: string; icon: React.ReactNode; color: KpiColor;
}) {
  const palette: Record<KpiColor, { bg: string; icon: string; value: string }> = {
    brand:   { bg: "bg-brand-50 dark:bg-brand-500/10",     icon: "text-brand-500",          value: "text-brand-700 dark:text-brand-400" },
    success: { bg: "bg-success-50 dark:bg-success-500/10", icon: "text-success-500",        value: "text-success-700 dark:text-success-400" },
    indigo:  { bg: "bg-indigo-50 dark:bg-indigo-500/10",   icon: "text-indigo-500",         value: "text-indigo-700 dark:text-indigo-400" },
    error:   { bg: "bg-error-50 dark:bg-error-500/10",     icon: "text-error-500",          value: "text-error-700 dark:text-error-400" },
    warning: { bg: "bg-warning-50 dark:bg-warning-500/10", icon: "text-warning-500",        value: "text-warning-700 dark:text-warning-400" },
    blue:    { bg: "bg-blue-light-50 dark:bg-blue-light-500/10", icon: "text-blue-light-500", value: "text-blue-light-700 dark:text-blue-light-400" },
  };
  const p = palette[color];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-brand-200 dark:hover:border-brand-700/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest truncate">
            {label}
          </p>
          <p className={`text-xl font-black tracking-tight mt-1.5 ${p.value}`}>{value}</p>
          {sub && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1">{sub}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${p.bg}`}>
          <span className={p.icon}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
