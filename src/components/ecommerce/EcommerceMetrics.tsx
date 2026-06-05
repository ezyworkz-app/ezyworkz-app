"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon } from "@/icons";

import { formatCompact } from "@/lib/format";

interface MetricsProps {
  metrics?: {
    totalUsers: number;
    totalOrders: number;
    userMetrics: { change: number; trend: string };
    orderMetrics: { change: number; trend: string };
  };
  financials?: {
    totalSales: number;
  };
}

export const EcommerceMetrics = ({ metrics, financials }: MetricsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5 shadow-sm dark:border-brand-500/20 dark:from-brand-900/20 dark:to-gray-900 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-white/60 rounded-xl shadow-inner dark:bg-brand-500/10">
          <GroupIcon className="text-brand-600 size-6 dark:text-brand-400" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600/70">
              Customers
            </span>
            <h4 className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
              {formatCompact(metrics?.totalUsers || 0)}
            </h4>
          </div>
          <Badge color={metrics?.userMetrics?.trend === "down" ? "error" : "success"} className="font-black text-[10px]">
            {metrics?.userMetrics?.trend === "down" ? <ArrowDownIcon /> : <ArrowUpIcon />}
            {metrics?.userMetrics?.change || 0}%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm dark:border-blue-500/20 dark:from-blue-900/20 dark:to-gray-900 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-white/60 rounded-xl shadow-inner dark:bg-blue-500/10">
          <BoxIconLine className="text-blue-600 size-6 dark:text-blue-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600/70">
              Orders
            </span>
            <h4 className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
              {formatCompact(metrics?.totalOrders || 0)}
            </h4>
          </div>

          <Badge color={metrics?.orderMetrics?.trend === "down" ? "error" : "success"} className="font-black text-[10px]">
            {metrics?.orderMetrics?.trend === "down" ? <ArrowDownIcon className="text-error-500" /> : <ArrowUpIcon />}
            {metrics?.orderMetrics?.change || 0}%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
};
