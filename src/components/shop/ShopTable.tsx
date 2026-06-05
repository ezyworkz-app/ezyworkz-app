import React, { useState } from "react";
import { Edit, Trash2, Search, ChevronUp, ChevronDown, ArrowUpDown, Tag } from "lucide-react";

import Button from "../ui/Button";
import Input from "../ui/Input";
import { Shop } from "@/types/Shop";
import Link from "next/link";

export interface ShopTableProps {
  shops: Shop[];
  onEdit: (shop: Shop) => void;
  sortBy?: "createdAt" | "totalOrders";
  sortOrder?: "asc" | "desc";
  onSort?: (criterion: "createdAt" | "totalOrders") => void;
}

const ShopTable: React.FC<ShopTableProps> = ({
  shops,
  onEdit,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  /* ─────────────── helpers ─────────────── */
  const formatDate = (ts?: string) =>
    ts
      ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(ts))
      : "Never";

  const filtered = shops.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.shopId.toLowerCase().includes(q)
    );
  });

  const SortIndicator = ({ criterion }: { criterion: "createdAt" | "totalOrders" }) => {
    if (sortBy !== criterion) return <ArrowUpDown className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortOrder === "asc" ? <ChevronUp className="h-3 w-3 text-brand-500" /> : <ChevronDown className="h-3 w-3 text-brand-500" />;
  };

  /* ─────────────── render ─────────────── */
  return (
    <div className="overflow-hidden shadow ring-1 ring-gray-200 ring-opacity-5 rounded-lg">
      {/* search */}
      <div className="p-4 bg-white">
        <Input
          placeholder="Search shops…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="max-w-md"
        />
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="border-b border-gray-100 dark:border-white/[0.05]">
            <tr>
              <th 
                className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400 sm:pl-6 cursor-pointer hover:bg-gray-50 transition-colors group"
                onClick={() => onSort?.("createdAt")}
              >
                <div className="flex items-center gap-1.5 leading-none">
                  <span>Merchant / Joined</span>
                  <SortIndicator criterion="createdAt" />
                </div>
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Shop details
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Services
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Contact
              </th>
              <th 
                className="px-5 py-3 font-medium text-gray-500 text-center text-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors group"
                onClick={() => onSort("totalOrders")}
              >
                <div className="flex flex-col items-center leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span>Performance</span>
                    <SortIndicator criterion="totalOrders" />
                  </div>
                  <span className="text-[10px] text-gray-300 font-medium normal-case tracking-normal whitespace-nowrap mt-0.5">
                    (Total / Cancel)
                  </span>
                </div>
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Status
              </th>
              <th className="relative py-3 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.length ? (
              filtered.map((shop) => (
                <tr key={shop.shopId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="whitespace-nowrap pl-6 pr-4 py-5 text-start">
                    <div className="flex flex-col gap-1.5">
                      <Link 
                        href={`/shops/${shop.shopId}/details`} 
                        className="text-theme-sm text-brand-500 font-medium tracking-tight hover:underline leading-none"
                      >
                        {shop.shopId}
                      </Link>
                      <div className="text-[10px] text-gray-400 font-medium">
                        {formatDate(shop.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-medium text-gray-900 text-theme-sm leading-none">{shop.name || "Unnamed Shop"}</div>
                    {shop.address?.area && (
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400 font-medium leading-none">
                        <span>{shop.address.area}</span>
                      </div>
                    )}
                    <div className="text-gray-400 text-[10px] mt-1.5 font-medium">{shop.email}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-5">
                    <div className="flex flex-col gap-2 text-start">
                      <Link 
                        href={`/shops/${shop.shopId}/services`} 
                        className="text-[10px] font-bold text-brand-500 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-100/50 hover:bg-brand-500 hover:text-white transition-all w-fit"
                      >
                        Services
                      </Link>
                      <Link
                        href={`/shops/pending-prices?shopId=${shop.shopId}`}
                        className="text-[10px] text-warning-600 font-bold bg-warning-50 px-2.5 py-1 rounded-md border border-warning-100/50 hover:bg-warning-500 hover:text-white transition-all w-fit"
                      >
                        Price Approval
                      </Link>
                      <Link
                        href={`/shops/${shop.shopId}/offers`}
                        className="inline-flex items-center gap-1 text-[10px] text-purple-600 font-bold bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100/50 hover:bg-purple-500 hover:text-white transition-all w-fit"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        Offers
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-theme-sm text-gray-800 text-start font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{shop.phone || "—"}</span>
                      {shop.alternatePhone && (
                        <span className="text-[10px] text-gray-400 font-normal">Alt: {shop.alternatePhone}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-5 text-sm text-center">
                    <div className="flex items-center justify-center gap-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-success-50 text-success-700 border border-success-100 min-w-[28px] justify-center">
                        {shop.totalOrders || 0}
                      </span>
                      <span className="text-gray-100">/</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-error-50 text-error-700 border border-error-100 min-w-[28px] justify-center">
                        {shop.cancelledOrders || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold border capitalize ${
                      shop.status === 'approved' ? 'bg-success-50 text-success-700 border-success-100' :
                      shop.status === 'in_progress' ? 'bg-warning-50 text-warning-700 border-warning-100' :
                      shop.status === 'suspended' ? 'bg-error-50 text-error-700 border-error-100' :
                      'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                      {shop.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-5 pl-3 pr-6 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(shop)}
                        className="text-brand-500 hover:bg-brand-50 h-9 px-4 rounded-xl border border-transparent hover:border-brand-100"
                        leftIcon={<Edit className="h-4 w-4" />}
                      >
                        <span className="text-theme-xs font-bold">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        // onClick={() => onDelete(shop)}
                        className="text-error-500 hover:bg-error-50 h-9 px-4 rounded-xl border border-transparent hover:border-error-100"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                      >
                        <span className="text-theme-xs font-bold">Delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  No shops found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShopTable;
