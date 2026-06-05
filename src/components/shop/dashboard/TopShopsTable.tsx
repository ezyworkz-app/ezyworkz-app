"use client";
import React from "react";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { ExternalLink, TrendingUp, Award } from "lucide-react";

interface TopShopsTableProps {
  shops: Array<{
    shopId: string;
    name: string;
    orderCount: number;
    totalRevenue: number;
  }>;
}

export const TopShopsTable: React.FC<TopShopsTableProps> = ({ shops }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900/50 shadow-sm shadow-gray-100/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Top Performing Shops</h4>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">By Total Revenue (LTV)</p>
        </div>
        <Award className="text-indigo-500" size={18} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 pb-3">
              <th className="text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3">Merchant</th>
              <th className="text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3 text-right">Orders</th>
              <th className="text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {shops.map((s, i) => (
              <tr key={s.shopId} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-600">
                      {i + 1}
                    </div>
                    <Link 
                      href={`/shops/${s.shopId}/details`}
                      className="text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-brand-500 transition-colors flex items-center gap-1"
                    >
                      {s.name}
                      <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{s.orderCount}</span>
                </td>
                <td className="py-3 text-right">
                  <span className="text-xs font-black text-gray-900 dark:text-white">{formatCurrency(s.totalRevenue)}</span>
                </td>
              </tr>
            ))}
            {shops.length === 0 && (
              <tr>
                <td colSpan={3} className="py-10 text-center text-xs text-gray-400 font-medium uppercase tracking-widest">
                  No data available for this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
