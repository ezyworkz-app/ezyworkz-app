"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { ShopItem } from "@/types/shop-menu";
import { approveShopItemPrice, rejectShopItemPrice } from "@/lib/actions/shopServices";

interface PendingPricesTableProps {
  items: (ShopItem & { shopName: string })[];
}

export default function PendingPricesTable({ items: initialItems }: PendingPricesTableProps) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (itemId: string) => {
    setLoading(itemId);
    try {
      await approveShopItemPrice(itemId);
      alert("Price approved successfully");
      setItems((prev) => prev.filter((it) => it.shopServiceCategoryItemId !== itemId));
    } catch (err: any) {
      alert(err.message || "Failed to approve price");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (itemId: string) => {
    setLoading(itemId);
    try {
      await rejectShopItemPrice(itemId);
      alert("Price rejected successfully");
      setItems((prev) => prev.filter((it) => it.shopServiceCategoryItemId !== itemId));
    } catch (err: any) {
      alert(err.message || "Failed to reject price");
    } finally {
      setLoading(null);
    }
  };

  const renderPriceComparison = (item: ShopItem & { shopName: string }) => {
    const pending = item.pendingPriceUpdate;
    if (!pending) return "No pending update";

    const currentPrices = [];
    if (item.pricePerPiece) currentPrices.push(`₹${item.pricePerPiece} /pc`);
    if (item.pricePerKg) currentPrices.push(`₹${item.pricePerKg} /kg`);
    if (item.pricePerSft) currentPrices.push(`₹${item.pricePerSft} /sft`);

    const newPrices = [];
    if (pending.pricePerPiece) newPrices.push(`₹${pending.pricePerPiece} /pc`);
    if (pending.pricePerKg) newPrices.push(`₹${pending.pricePerKg} /kg`);
    if (pending.pricePerSft) newPrices.push(`₹${pending.pricePerSft} /sft`);

    return (
      <div className="flex flex-col gap-1">
        <div className="text-gray-400 line-through text-xs">
          {currentPrices.join(", ") || "No base price"}
        </div>
        <div className="text-success-600 font-medium">
          {newPrices.join(", ") || "No base price"}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Shop Name
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Item
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Price Comparison
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Requested At
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-5 py-10 text-center text-gray-500">
                  No pending price updates found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.shopServiceCategoryItemId}>
                  <TableCell className="px-5 py-4 text-start font-medium text-gray-800 dark:text-white/90">
                    {item.shopName}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800 dark:text-white/90">{item.name}</span>
                      <span className="text-xs text-gray-500">{item.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start">
                    {renderPriceComparison(item)}
                  </TableCell>
                  <TableCell suppressHydrationWarning className="px-5 py-4 text-start text-gray-500 text-theme-sm">
                    {item.pendingPriceUpdate?.requestedAt ? new Date(item.pendingPriceUpdate.requestedAt).toLocaleString() : "N/A"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-end">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApprove(item.shopServiceCategoryItemId)}
                        disabled={loading === item.shopServiceCategoryItemId}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-error-600 border-error-600 hover:bg-error-50"
                        onClick={() => handleReject(item.shopServiceCategoryItemId)}
                        disabled={loading === item.shopServiceCategoryItemId}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
