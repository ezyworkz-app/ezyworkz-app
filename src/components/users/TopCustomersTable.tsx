"use client";
import React from "react";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { ExternalLink, TrendingUp, Trophy } from "lucide-react";

interface TopCustomersTableProps {
  customers: Array<{
    userId: string;
    name: string;
    orderCount: number;
    totalSpend: number;
  }>;
}

export const TopCustomersTable: React.FC<TopCustomersTableProps> = ({ customers }) => {
  const maxSpend = Math.max(...customers.map(c => c.totalSpend), 1);

  const getSegment = (orders: number) => {
    if (orders >= 10) return { label: "VIP", color: "bg-brand-500/10 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300" };
    if (orders >= 4) return { label: "Regular", color: "bg-success-500/10 text-success-700 dark:bg-success-500/20 dark:text-success-300" };
    if (orders >= 2) return { label: "Occasional", color: "bg-warning-500/10 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300" };
    return { label: "New", color: "bg-error-500/10 text-error-700 dark:bg-error-500/20 dark:text-error-300" };
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Top Spenders (LTV)</h4>
          <TrendingUp className="text-success-500" size={16} />
        </div>
        <Link 
          href="/users" 
          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
        >
          View All Users &rarr;
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 pb-3">
              <th className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-3">Customer</th>
              <th className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-3 text-right">Orders</th>
              <th className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-3 text-right">LTV</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {customers.map((c, i) => {
              const segment = getSegment(c.orderCount);
              const percentage = (c.totalSpend / maxSpend) * 100;
              
              return (
              <tr key={c.userId} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors relative">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? "bg-warning-50 dark:bg-warning-500/10 text-warning-600" : 
                        i === 1 ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" :
                        i === 2 ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" :
                        "bg-brand-50 dark:bg-brand-500/10 text-brand-600"
                    }`}>
                      {i === 0 ? <Trophy size={14} /> : i + 1}
                    </div>
                    <div>
                      <Link 
                        href={`/users/${c.userId}`}
                        className="text-sm font-bold text-gray-800 dark:text-gray-200 hover:text-brand-500 transition-colors flex items-center gap-1"
                      >
                        {c.name}
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-500" />
                      </Link>
                      <div className="flex items-center mt-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${segment.color}`}>
                            {segment.label}
                          </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-right relative z-10">
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{c.orderCount}</span>
                </td>
                <td className="py-4 text-right relative min-w-[140px]">
                  <div className="absolute top-2 bottom-2 right-2 left-4 flex items-center pointer-events-none rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                     <div className="h-full bg-brand-500/10 dark:bg-brand-500/20 transition-all duration-1000 ml-auto" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white relative z-10 pr-4">{formatCurrency(c.totalSpend)}</span>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
