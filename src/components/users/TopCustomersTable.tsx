"use client";
import React from "react";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { ExternalLink, TrendingUp } from "lucide-react";

interface TopCustomersTableProps {
  customers: Array<{
    userId: string;
    name: string;
    orderCount: number;
    totalSpend: number;
  }>;
}

export const TopCustomersTable: React.FC<TopCustomersTableProps> = ({ customers }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Top Spenders (LTV)</h4>
        <TrendingUp className="text-success-500" size={16} />
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
            {customers.map((c, i) => (
              <tr key={c.userId} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-[10px] font-bold text-brand-600">
                      {i + 1}
                    </div>
                    <Link 
                      href={`/users/${c.userId}`}
                      className="text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-brand-500 transition-colors flex items-center gap-1"
                    >
                      {c.name}
                      <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{c.orderCount}</span>
                </td>
                <td className="py-3 text-right">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{formatCurrency(c.totalSpend)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
