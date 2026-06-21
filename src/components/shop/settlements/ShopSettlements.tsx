"use client";

import React, { useEffect, useState, useTransition, useMemo } from "react";
import {
  getSettlementsForShop,
  settleBulk,
  revertBulkSettlements,
  syncSettlementAmountsFromOrders,
  backfillSettlements,
  updateSettlementGrossAmount,
  updateSettlementLogisticsCost,
  purgeOrphanedSettlements,
  deleteBulkSettlements,
} from "@/lib/actions/settlements";
import { getShopById, getShopKyc } from "@/lib/actions/shops";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  Check, Loader2, RefreshCcw, ExternalLink, MessageCircle, FileText,
  Calendar as CalendarIcon, Filter, XCircle, User, TrendingUp,
  Edit2, Save, X, Clock, Trash2, AlertTriangle, BarChart2, List,
} from "lucide-react";
import { ShopSettlement } from "@/types/shop-settlement";
import { Shop, ShopKyc } from "@/types/Shop";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DatePicker from "@/components/form/date-picker";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Pagination from "@/components/tables/Pagination";
import SettlementsAnalytics from "./SettlementsAnalytics";

const PAGE_SIZE = 15;

interface ShopSettlementsProps {
  shopId: string;
}

export default function ShopSettlements({ shopId }: ShopSettlementsProps) {
  const [outerTab, setOuterTab] = useState<"settlements" | "analytics">("settlements");
  const [activeTab, setActiveTab] = useState<"unpaid" | "paid">("unpaid");
  const [unpaidSettlements, setUnpaidSettlements] = useState<ShopSettlement[]>([]);
  const [paidSettlements, setPaidSettlements] = useState<ShopSettlement[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editingLogisticsId, setEditingLogisticsId] = useState<string | null>(null);
  const [editLogisticsAmount, setEditLogisticsAmount] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [resetKey, setResetKey] = useState<number>(0);
  const [isPurging, setIsPurging] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);
  const [isReverting, setIsReverting] = useState(false);
  const [revertResult, setRevertResult] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("date-desc");

  const settlements = activeTab === "unpaid" ? unpaidSettlements : paidSettlements;

  const sortDesc = (arr: ShopSettlement[]) =>
    [...arr].sort((a, b) => {
      const dA = new Date(a.orderCreatedAt || a.createdAt || 0).getTime();
      const dB = new Date(b.orderCreatedAt || b.createdAt || 0).getTime();
      return dB - dA;
    });

  const fetchData = async () => {
    setLoading(true);
    const [unpaidRes, paidRes, shopRes] = await Promise.all([
      getSettlementsForShop(shopId, "unpaid"),
      getSettlementsForShop(shopId, "paid"),
      getShopById(shopId),
    ]);
    if (unpaidRes.success) setUnpaidSettlements(sortDesc(unpaidRes.data || []));
    if (paidRes.success) setPaidSettlements(sortDesc(paidRes.data || []));
    if (shopRes) setShop(shopRes);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [shopId]);
  useEffect(() => { setSelectedIds([]); setCurrentPage(1); }, [activeTab]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const handleSettle = async () => {
    if (selectedIds.length === 0) return;
    const zeroAmountCount = filteredSettlements.filter(
      (s) => selectedIds.includes(s.shopSettlementId) && (!s.shopTotalAmount || s.shopTotalAmount === 0)
    ).length;
    if (zeroAmountCount > 0) {
      const ok = confirm(
        `${zeroAmountCount} selected settlement${zeroAmountCount > 1 ? "s have" : " has"} ₹0 gross amount.\n\n` +
        `Processing these will mark them as paid WITHOUT updating shopPayout (your manually-entered values are safe).\n\n` +
        `Set the gross amount first if you want payout recalculated. Continue anyway?`
      );
      if (!ok) return;
    }
    startTransition(async () => {
      const res = await settleBulk(selectedIds, shopId);
      if (res.success) { setSelectedIds([]); await fetchData(); }
      else alert(res.error || "Failed to settle payouts");
    });
  };

  const handleRevert = async () => {
    if (selectedIds.length === 0) return;
    const ok = confirm(
      `Revert ${selectedIds.length} settlement${selectedIds.length > 1 ? "s" : ""} back to Unpaid?\n\n` +
      `This undoes the "Process" action — settlements will move back to the Unpaid tab.\n` +
      `Note: shopPayout values on orders are NOT restored (set gross amount and reprocess to fix those).`
    );
    if (!ok) return;
    setIsReverting(true);
    setRevertResult(null);
    try {
      const res = await revertBulkSettlements(selectedIds, shopId);
      if (res.success) {
        const reverted = (res.data as any[]).filter((r) => r.success && !r.skipped).length;
        setRevertResult(`Reverted ${reverted} settlement${reverted !== 1 ? "s" : ""} to Unpaid. Now set the gross amount on each and reprocess.`);
        setSelectedIds([]);
        await fetchData();
      } else {
        setRevertResult(`Failed: ${res.error}`);
      }
    } finally {
      setIsReverting(false);
    }
  };

  const handleSyncAmounts = async () => {
    const ok = confirm(
      `This will update all paid settlements with ₹0 gross amount to use the order's shopPayout value.\n\nContinue?`
    );
    if (!ok) return;
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncSettlementAmountsFromOrders(shopId);
      if (res.success) {
        setSyncResult(res.updatedCount === 0
          ? "All settlements already have amounts set."
          : `Updated ${res.updatedCount} settlement${res.updatedCount !== 1 ? "s" : ""} with payout amounts.`
        );
        await fetchData();
      } else {
        setSyncResult(`Failed: ${res.error}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleWhatsAppNotify = () => {
    if (selectedIds.length === 0 || !shop) return;
    const sel = filteredSettlements.filter((s) => selectedIds.includes(s.shopSettlementId));
    const orderIds = sel.map((s) => s.orderId.split("-").pop()).join(", ");
    const total = sel.reduce((sum, s) => sum + (s.shopTotalAmount || 0), 0);
    const msg = `Hi ${shop.name}, we have settled the following orders: ${orderIds}. Total Payout: ₹${total.toFixed(2)}. Please check your dashboard for details.`;
    let phone = shop.phone.replace(/[^\d+]/g, "");
    if (!phone.startsWith("+") && phone.length === 10) phone = "91" + phone;
    window.open(`https://wa.me/${phone}/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleUpdateGross = async (id: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount)) return;
    startTransition(async () => {
      const res = await updateSettlementGrossAmount(id, amount, shopId);
      if (res.success) { setEditingId(null); await fetchData(); }
      else alert(res.error || "Failed to update amount");
    });
  };

  const handleUpdateLogistics = async (id: string) => {
    const amount = parseFloat(editLogisticsAmount);
    if (isNaN(amount)) return;
    startTransition(async () => {
      const res = await updateSettlementLogisticsCost(id, amount, shopId);
      if (res.success) { setEditingLogisticsId(null); await fetchData(); }
      else alert(res.error || "Failed to update logistics cost");
    });
  };

  const handlePurgeOrphaned = async () => {
    if (!confirm("This will permanently delete all settlements whose orders have been deleted. Continue?")) return;
    setIsPurging(true);
    try {
      const res = await purgeOrphanedSettlements();
      if (res.success) {
        alert(`Purge complete. Deleted ${res.data?.deleted ?? 0} orphaned settlements out of ${res.data?.scanned ?? 0} scanned.`);
        await fetchData();
      } else {
        alert(res.error || "Purge failed");
      }
    } finally { setIsPurging(false); }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const ok = confirm(`Are you sure you want to permanently delete the ${selectedIds.length} selected settlement(s)?`);
    if (!ok) return;
    setIsPurging(true);
    try {
      const res = await deleteBulkSettlements(selectedIds, shopId);
      if (res.success) {
        setSelectedIds([]);
        await fetchData();
      } else {
        alert(res.error || "Failed to delete settlements");
      }
    } finally {
      setIsPurging(false);
    }
  };

  const handleBackfill = async () => {
    if (!confirm("This will create settlement records for all delivered orders that don't have one yet (e.g. orders before the settlement system went live). Continue?")) return;
    setIsBackfilling(true);
    setBackfillResult(null);
    try {
      const res = await backfillSettlements(shopId);
      if (res.success) {
        const created = res.count ?? 0;
        setBackfillResult(created === 0 ? "All orders already have settlement records." : `Created ${created} new settlement record${created !== 1 ? "s" : ""}. Refreshing…`);
        await fetchData();
      } else {
        setBackfillResult(`Failed: ${res.error}`);
      }
    } finally {
      setIsBackfilling(false);
    }
  };

  const generatePDF = async (items?: ShopSettlement[]) => {
    const targetItems = items || filteredSettlements.filter((s) => selectedIds.includes(s.shopSettlementId));
    if (targetItems.length === 0 || !shop) return;

    const doc = new jsPDF();
    // NOTE: totalValue is computed from individual fields (not shopTotalAmount) so it always
    // matches the summary breakdown: Gross + Bonus - Commission + Logistics
    // shopTotalAmount per order can be stale; we recalculate here for accuracy.

    const loadImage = (url: string): Promise<{ data: string; width: number; height: number }> =>
      new Promise((resolve, reject) => {
        const img = new (window as any).Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width; canvas.height = img.height;
          canvas.getContext("2d")?.drawImage(img, 0, 0);
          resolve({ data: canvas.toDataURL("image/png"), width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = url;
      });

    try {
      const logo = await loadImage("/images/logo/ezyworkz_logo.png");
      const displayHeight = 12;
      const displayWidth = (logo.width * displayHeight) / logo.height;
      doc.addImage(logo.data, "PNG", 14, 12, displayWidth, displayHeight);
      doc.setTextColor(51, 65, 85); doc.setFontSize(9); doc.setFont("helvetica", "bold");
      doc.text("Ezyworkz Private Limited", 14, 28);
      doc.setTextColor(100, 116, 139); doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text("GSTIN: 37AAGCL1450L1ZD", 14, 32.5);
      doc.setTextColor(130, 108, 187); doc.setFontSize(22); doc.setFont("helvetica", "bold");
      doc.text("SETTLEMENT REPORT", 196, 22, { align: "right" });
      doc.setTextColor(100, 116, 139); doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text([`#BATCH${new Date().getTime().toString().slice(-8)}`, `${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`], 196, 28, { align: "right" });
      doc.setTextColor(148, 163, 184); doc.setFontSize(7); doc.setFont("helvetica", "bold");
      doc.text("SETTLEMENT FOR", 14, 52); doc.text("PAYMENT STATUS", 196, 52, { align: "right" });
      doc.setTextColor(15, 23, 42); doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text(shop.name, 14, 58);
      doc.setTextColor(100, 116, 139); doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text(`Shop ID: ${shop.shopId.toUpperCase()}`, 14, 62);
      const shopArea = shop.address?.area || shop.address?.locality || "";
      const shopCity = shop.address?.city || "";
      if (shopArea || shopCity) doc.text(`${shopArea}${shopArea && shopCity ? ", " : ""}${shopCity}`, 14, 66);
      const isSettled = activeTab !== "unpaid";
      const badgeColor = isSettled ? [16, 185, 129] : [130, 108, 187];
      doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
      doc.roundedRect(178, 54, 18, 5, 2, 2, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(7);
      doc.text(isSettled ? "PAID" : "PENDING", 187, 57.5, { align: "center" });
      doc.setTextColor(148, 163, 184); doc.setFontSize(7); doc.setFont("helvetica", "italic");
      doc.text("Note: All financial amounts are in Indian Rupees (Rs.)", 14, 78);

      const tableData = targetItems.map((s, index) => [
        index + 1,
        `${s.orderId.split("-").pop() || s.orderId}\n${new Date(s.orderCreatedAt || s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
        s.shopGrossAmount?.toFixed(2),
        s.shopPriorityAmount?.toFixed(2),
        s.shopCommissionAmount?.toFixed(2),
        s.shopLogisticsCost?.toFixed(2) || "0.00",
        s.shopTotalAmount?.toFixed(2),
      ]);

      autoTable(doc, {
        startY: 81,
        head: [["#", "Order Details", "Gross", "Bonus", "Comm.", "Logist.", "Net Payout"]],
        body: tableData,
        theme: "plain",
        headStyles: { textColor: [100, 116, 139], fontSize: 7, fontStyle: "bold", cellPadding: { top: 6, bottom: 6, left: 3, right: 3 } },
        columnStyles: { 0: { halign: "left", cellWidth: 14 }, 1: { halign: "left", fontStyle: "bold", cellWidth: 60 }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right", textColor: [220, 38, 38] }, 5: { halign: "right" }, 6: { halign: "right", fontStyle: "bold" } },
        styles: { fontSize: 8, cellPadding: 4, valign: "middle", textColor: [51, 65, 85] },
        didDrawCell: (data) => {
          doc.setDrawColor(241, 245, 249); doc.setLineWidth(data.section === "head" ? 0.2 : 0.1);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          if (data.section === "body" && data.column.index === 1 && (data.cell as any)._rawText) {
            const parts = (data.cell as any)._rawText;
            const x = data.cell.x + data.cell.padding("left");
            const y = data.cell.y + data.cell.padding("top") + 4;
            doc.setFont("helvetica", "bold"); doc.setTextColor(51, 65, 85); doc.setFontSize(8); doc.text(parts[0], x, y);
            if (parts[1]) { doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184); doc.setFontSize(7); doc.text(parts[1], x, y + 4); }
          }
        },
        willDrawCell: (data) => {
          if (data.section === "head" && data.column.index >= 2) data.cell.styles.halign = "right";
          if (data.section === "body" && data.column.index === 1) { (data.cell as any)._rawText = data.cell.text; data.cell.text = [] as any; }
        },
        rowPageBreak: "avoid",
        margin: { left: 14, right: 14 },
      });

      const totalGross = targetItems.reduce((acc, s) => acc + (s.shopGrossAmount || 0), 0);
      const totalBonus = targetItems.reduce((acc, s) => acc + (s.shopPriorityAmount || 0), 0);
      const totalComm = targetItems.reduce((acc, s) => acc + (s.shopCommissionAmount || 0), 0);
      const totalLogist = targetItems.reduce((acc, s) => acc + (s.shopLogisticsCost || 0), 0);
      // Net Payable = Gross + Bonus - Commission + Logistics (recalculated live, not from stale shopTotalAmount)
      const totalValue = totalGross + totalBonus - totalComm + totalLogist;
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      const boxX = 196 - 80; const boxY = finalY;
      doc.setFillColor(248, 250, 252); doc.roundedRect(boxX, boxY, 80, 45, 4, 4, "F");
      doc.setTextColor(100, 116, 139); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("SETTLEMENT SUMMARY", boxX + 6, boxY + 10);
      doc.setFontSize(7); doc.setFont("helvetica", "normal");
      let rowY = boxY + 18;
      doc.text("Total Gross Amount", boxX + 6, rowY); doc.text(`${totalGross.toFixed(2)}`, boxX + 74, rowY, { align: "right" });
      rowY += 5; doc.text("Total Bonus/Fees", boxX + 6, rowY); doc.text(`${totalBonus.toFixed(2)}`, boxX + 74, rowY, { align: "right" });
      rowY += 5; doc.text("Total Commission", boxX + 6, rowY); doc.setTextColor(220, 38, 38); doc.text(`-${totalComm.toFixed(2)}`, boxX + 74, rowY, { align: "right" });
      rowY += 5; doc.setTextColor(100, 116, 139); doc.text("Total Logistics Fee", boxX + 6, rowY); doc.text(`+${totalLogist.toFixed(2)}`, boxX + 74, rowY, { align: "right" });
      doc.setDrawColor(226, 232, 240); doc.line(boxX + 6, rowY + 4, boxX + 74, rowY + 4);
      doc.setTextColor(130, 108, 187); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("Net Payable (Rs.)", boxX + 6, rowY + 11); doc.setFontSize(11);
      doc.text(`${totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, boxX + 74, rowY + 11.5, { align: "right" });
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
        doc.setDrawColor(241, 245, 249); doc.line(14, 280, 196, 280);
        doc.text("Thank you for choosing Ezyworkz!", 105, 285, { align: "center" });
        doc.setFontSize(7); doc.text(`Page ${i} of ${pageCount}`, 196, 292, { align: "right" });
        doc.text("System generated report. For support contact contact@ezyworkz.com", 14, 292);
      }
      doc.save(`settlement-${shop.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    }
  };

  const filteredSettlements = useMemo(() => {
    setCurrentPage(1);
    let result = settlements;
    if (startDate || endDate) {
      result = settlements.filter((s) => {
        const date = new Date(activeTab === "unpaid" ? s.orderCreatedAt || s.createdAt : s.settledAt || s.createdAt).getTime();
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
        return date >= start && date <= end;
      });
    }

    return [...result].sort((a, b) => {
      if (sortBy === "date-desc") {
        const dA = new Date(a.orderCreatedAt || a.createdAt || 0).getTime();
        const dB = new Date(b.orderCreatedAt || b.createdAt || 0).getTime();
        return dB - dA;
      }
      if (sortBy === "date-asc") {
        const dA = new Date(a.orderCreatedAt || a.createdAt || 0).getTime();
        const dB = new Date(b.orderCreatedAt || b.createdAt || 0).getTime();
        return dA - dB;
      }
      if (sortBy === "gross-desc") {
        return (b.shopGrossAmount || 0) - (a.shopGrossAmount || 0);
      }
      if (sortBy === "gross-asc") {
        return (a.shopGrossAmount || 0) - (b.shopGrossAmount || 0);
      }
      if (sortBy === "net-desc") {
        return (b.shopTotalAmount || 0) - (a.shopTotalAmount || 0);
      }
      if (sortBy === "net-asc") {
        return (a.shopTotalAmount || 0) - (b.shopTotalAmount || 0);
      }
      return 0;
    });
  }, [settlements, startDate, endDate, activeTab, sortBy]);

  const totalPages = Math.ceil(filteredSettlements.length / PAGE_SIZE);

  const paginatedSettlements = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSettlements.slice(start, start + PAGE_SIZE);
  }, [filteredSettlements, currentPage]);

  const totalOwed = unpaidSettlements.reduce((sum, s) => sum + (s.shopTotalAmount || 0), 0);
  const selectedOwed = filteredSettlements
    .filter((s) => selectedIds.includes(s.shopSettlementId))
    .reduce((sum, s) => sum + (s.shopTotalAmount || 0), 0);

  const isNew = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < 86400000;
  const fmt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d?: string) => {
    if (!d) return "—";
    return new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="animate-spin text-brand-500" size={32} />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading settlements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Outer Tab Bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-50 dark:bg-gray-800/60 p-1 rounded-xl border border-gray-100 dark:border-gray-700/60 gap-0.5">
          <button
            onClick={() => setOuterTab("settlements")}
            className={`flex items-center gap-2 px-5 py-2 text-[11px] font-black uppercase tracking-tighter rounded-lg transition-all ${outerTab === "settlements"
                ? "bg-white dark:bg-gray-700 text-brand-500 border border-gray-200 dark:border-gray-600 shadow-sm"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
          >
            <List size={13} /> Settlements
          </button>
          <button
            onClick={() => setOuterTab("analytics")}
            className={`flex items-center gap-2 px-5 py-2 text-[11px] font-black uppercase tracking-tighter rounded-lg transition-all ${outerTab === "analytics"
                ? "bg-white dark:bg-gray-700 text-brand-500 border border-gray-200 dark:border-gray-600 shadow-sm"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
          >
            <BarChart2 size={13} /> Analytics
          </button>
        </div>

        {/* Quick stats always visible */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-warning-50 dark:bg-warning-500/10 rounded-xl border border-warning-100 dark:border-warning-500/20">
            <Clock size={12} className="text-warning-500" />
            <span className="text-[10px] font-black text-warning-600 dark:text-warning-400 uppercase tracking-widest tabular-nums">
              ₹{fmt(totalOwed)} pending
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-success-50 dark:bg-success-500/10 rounded-xl border border-success-100 dark:border-success-500/20">
            <Check size={12} className="text-success-500" />
            <span className="text-[10px] font-black text-success-600 dark:text-success-400 uppercase tracking-widest tabular-nums">
              ₹{fmt(paidSettlements.reduce((s, x) => s + (x.shopTotalAmount || 0), 0))} paid
            </span>
          </div>
        </div>
      </div>

      {/* ── Analytics Tab ──────────────────────────────────────── */}
      {outerTab === "analytics" && (
        <SettlementsAnalytics
          allPaidSettlements={paidSettlements}
          pendingSettlements={unpaidSettlements}
        />
      )}

      {/* ── Settlements Tab ────────────────────────────────────── */}
      {outerTab === "settlements" && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">

          {/* Table Toolbar */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">

              {/* Left: Pending/History toggle + Refresh */}
              <div className="flex items-center gap-3">
                <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700">
                  {(["unpaid", "paid"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-5 py-2 text-[11px] font-black uppercase tracking-tighter rounded-lg transition-all ${activeTab === tab
                          ? "bg-white dark:bg-gray-700 text-brand-500 border border-gray-200 dark:border-gray-600 shadow-sm"
                          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        }`}
                    >
                      {tab === "unpaid" ? "Pending" : "History"}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={isPending}
                  className="h-9 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 rounded-xl">
                  <RefreshCcw size={14} className={isPending ? "animate-spin" : ""} />
                </Button>
                <Button variant="outline" size="sm" onClick={handleBackfill} disabled={isBackfilling}
                  title="Create settlement records for old delivered orders that are missing one"
                  className="h-9 border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 font-bold px-3 rounded-xl gap-1.5">
                  {isBackfilling ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                  {!isBackfilling && <span className="text-[11px] font-black uppercase tracking-tighter">Sync Old</span>}
                </Button>
                <Button variant="outline" size="sm" onClick={handleSyncAmounts} disabled={isSyncing}
                  title="Fill ₹0 settlement amounts from order shopPayout for old records"
                  className="h-9 border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-500/5 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 font-bold px-3 rounded-xl gap-1.5">
                  {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                  {!isSyncing && <span className="text-[11px] font-black uppercase tracking-tighter">Sync Amounts</span>}
                </Button>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => generatePDF()} disabled={selectedIds.length === 0 || !shop}
                  className="h-9 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold px-4 rounded-xl">
                  <FileText size={14} className="mr-1.5" /> Export
                </Button>

                {activeTab === "unpaid" ? (
                  <Button size="sm" onClick={handleSettle} disabled={selectedIds.length === 0 || isPending}
                    className="h-9 bg-brand-500 hover:bg-brand-600 text-white px-5 font-bold rounded-xl shadow-sm">
                    {isPending ? <Loader2 className="animate-spin mr-1.5" size={14} /> : <Check size={14} className="mr-1.5" />}
                    Process {selectedIds.length > 0 && `(${selectedIds.length})`}
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={handleWhatsAppNotify} disabled={selectedIds.length === 0}
                      className="h-9 border-success-200 dark:border-success-800 bg-success-50/30 dark:bg-success-500/5 text-success-600 dark:text-success-400 font-bold px-5 rounded-xl hover:bg-success-50 dark:hover:bg-success-500/10">
                      <MessageCircle size={14} className="mr-1.5" /> Notify
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleRevert} disabled={selectedIds.length === 0 || isReverting}
                      className="h-9 border-amber-200 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-500/5 text-amber-700 dark:text-amber-400 font-bold px-5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/10">
                      {isReverting ? <Loader2 className="animate-spin mr-1.5" size={14} /> : <X size={14} className="mr-1.5" />}
                      Revert {selectedIds.length > 0 && `(${selectedIds.length})`}
                    </Button>
                  </>
                )}

                <Button size="sm" variant="outline" onClick={selectedIds.length > 0 ? handleDeleteSelected : handlePurgeOrphaned} disabled={isPurging}
                  className="h-9 border-error-200 dark:border-error-800 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 font-bold px-3 rounded-xl"
                  title={selectedIds.length > 0 ? "Delete selected settlements" : "Purge orphaned settlements"}>
                  {isPurging ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </Button>
              </div>
            </div>

            {/* Backfill result banner */}
            {backfillResult && (
              <div className="flex items-center justify-between mt-3 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl">
                <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">{backfillResult}</p>
                <button onClick={() => setBackfillResult(null)} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Sync amounts result banner */}
            {syncResult && (
              <div className="flex items-center justify-between mt-3 px-4 py-2.5 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 rounded-xl">
                <p className="text-[11px] font-bold text-teal-700 dark:text-teal-300">{syncResult}</p>
                <button onClick={() => setSyncResult(null)} className="text-teal-400 hover:text-teal-600 dark:hover:text-teal-200">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Revert result banner */}
            {revertResult && (
              <div className="flex items-center justify-between mt-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">{revertResult}</p>
                <button onClick={() => setRevertResult(null)} className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-200">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Date Filter */}
            <div className="flex flex-col md:flex-row items-end gap-4 mt-4">
              <div className="flex-1 max-w-xs">
                <DatePicker key={`range-${resetKey}`} id="date-range" mode="range" label="Filter by period"
                  placeholder="Pick a range…"
                  onChange={(dates) => {
                    if (dates.length === 1) { setStartDate(dates[0].toISOString().split("T")[0]); setEndDate(dates[0].toISOString().split("T")[0]); }
                    else if (dates.length === 2) { setStartDate(dates[0].toISOString().split("T")[0]); setEndDate(dates[1].toISOString().split("T")[0]); }
                    else { setStartDate(""); setEndDate(""); }
                  }}
                />
              </div>
              {(startDate || endDate) && (
                <button onClick={() => { setStartDate(""); setEndDate(""); setResetKey((k) => k + 1); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors uppercase tracking-widest">
                  <XCircle size={13} /> Clear
                </button>
              )}

              <div className="w-48">
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Sort by</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-[38px] px-3 py-1.5 text-[11px] font-medium border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-500">
                  <option value="date-desc">Date: Newest First</option>
                  <option value="date-asc">Date: Oldest First</option>
                  <option value="gross-desc">Gross: High to Low</option>
                  <option value="gross-asc">Gross: Low to High</option>
                  <option value="net-desc">Net Payout: High to Low</option>
                  <option value="net-asc">Net Payout: Low to High</option>
                </select>
              </div>
              {filteredSettlements.length > 0 && (
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-auto">
                  {filteredSettlements.length} record{filteredSettlements.length !== 1 ? "s" : ""}
                  {selectedIds.length > 0 && <span className="text-brand-500 ml-2">· {selectedIds.length} selected · ₹{fmt(selectedOwed)}</span>}
                </p>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <div className="min-w-[1080px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 w-12 text-center">
                      <input type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            const pageIds = paginatedSettlements.map((s) => s.shopSettlementId);
                            setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                          } else {
                            const pageIds = new Set(paginatedSettlements.map((s) => s.shopSettlementId));
                            setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
                          }
                        }}
                        checked={selectedIds.length > 0 && paginatedSettlements.length > 0 && paginatedSettlements.every((s) => selectedIds.includes(s.shopSettlementId))}
                        className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                      />
                    </TableCell>
                    {["Order", "Gross Amount", "Bonus", "Commission", "Logistics", "Net Payable", "Status"].map((h) => (
                      <TableCell key={h} isHeader className="px-5 py-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-start">
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {paginatedSettlements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-gray-300 dark:text-gray-600">
                            <Filter size={28} />
                          </div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {startDate || endDate ? "No records in this period" : "No settlements found"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSettlements.map((s) => (
                      <TableRow key={s.shopSettlementId}
                        className={`hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors align-top ${selectedIds.includes(s.shopSettlementId) ? "bg-brand-50/20 dark:bg-brand-500/[0.03]" : ""}`}>

                        {/* Checkbox */}
                        <TableCell className="px-5 py-4 text-center">
                          <input type="checkbox" checked={selectedIds.includes(s.shopSettlementId)} onChange={() => toggleSelect(s.shopSettlementId)}
                            className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                          />
                        </TableCell>

                        {/* Order */}
                        <TableCell className="px-5 py-4">
                          <Link href={`/orders/${s.orderId}`} className="text-[11px] font-black text-brand-500 hover:underline">
                            {s.orderId.split("-").pop()}
                          </Link>
                          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[130px]">{s.userName || "Guest"}</p>
                          {s.userId && (
                            <p className="text-[9px] font-mono text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[130px]" title={s.userId}>
                              ID: {s.userId}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{fmtDate(s.orderCreatedAt)}</p>
                        </TableCell>

                        {/* Gross Amount (editable) */}
                        <TableCell className="px-5 py-4">
                          {editingId === s.shopSettlementId ? (
                            <div className="flex items-center gap-1">
                              <input type="number" autoFocus value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleUpdateGross(s.shopSettlementId); if (e.key === "Escape") setEditingId(null); }}
                                className="w-20 px-2 py-1 text-[11px] border border-brand-300 dark:border-brand-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                              />
                              <button onClick={() => handleUpdateGross(s.shopSettlementId)} disabled={isPending}
                                className="p-1 text-success-600 hover:bg-success-50 dark:hover:bg-success-500/10 rounded">
                                {isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded">
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 group/g">
                              <div>
                                <span className="text-[11px] font-black tabular-nums text-gray-800 dark:text-gray-200">₹{fmt(s.shopGrossAmount || 0)}</span>
                                {s.originalGrossAmount !== undefined && Math.abs(s.originalGrossAmount - (s.shopGrossAmount || 0)) > 0.01 && (
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">Orig: ₹{fmt(s.originalGrossAmount)}</p>
                                )}
                              </div>
                              <button onClick={() => { setEditingId(s.shopSettlementId); setEditAmount(s.shopGrossAmount?.toString() || ""); }}
                                className="opacity-0 group-hover/g:opacity-100 p-1 text-gray-400 hover:text-brand-500 rounded transition-all">
                                <Edit2 size={11} />
                              </button>
                            </div>
                          )}
                        </TableCell>

                        {/* Bonus */}
                        <TableCell className="px-5 py-4">
                          {(s.shopPriorityAmount || 0) > 0 ? (
                            <>
                              <span className="text-[11px] font-black tabular-nums text-indigo-500">+₹{s.shopPriorityAmount!.toFixed(2)}</span>
                              {s.shopPriorityType && s.shopPriorityType !== "standard" && (
                                <p className="text-[10px] text-indigo-400 dark:text-indigo-500 capitalize mt-0.5">{s.shopPriorityType}</p>
                              )}
                            </>
                          ) : (
                            <span className="text-[11px] font-black tabular-nums text-gray-300 dark:text-gray-600">+₹0.00</span>
                          )}
                        </TableCell>

                        {/* Commission */}
                        <TableCell className="px-5 py-4">
                          <span className="text-[11px] font-black tabular-nums text-gray-500 dark:text-gray-400">−₹{s.shopCommissionAmount?.toFixed(2) ?? "0.00"}</span>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{s.shopCommissionPercentage ?? 20}%</p>
                        </TableCell>

                        {/* Logistics (editable) */}
                        <TableCell className="px-5 py-4">
                          {editingLogisticsId === s.shopSettlementId ? (
                            <div className="flex items-center gap-1">
                              <input type="number" autoFocus value={editLogisticsAmount} onChange={(e) => setEditLogisticsAmount(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleUpdateLogistics(s.shopSettlementId); if (e.key === "Escape") setEditingLogisticsId(null); }}
                                className="w-16 px-2 py-1 text-[11px] border border-brand-300 dark:border-brand-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                              />
                              <button onClick={() => handleUpdateLogistics(s.shopSettlementId)} disabled={isPending}
                                className="p-1 text-success-600 hover:bg-success-50 rounded">
                                {isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                              </button>
                              <button onClick={() => setEditingLogisticsId(null)} className="p-1 text-error-500 hover:bg-error-50 rounded"><X size={13} /></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 group/l">
                              {!s.isLogisticsCostManuallySet ? (
                                <div className="space-y-1">
                                  <button onClick={() => { setEditingLogisticsId(s.shopSettlementId); setEditLogisticsAmount(s.orderLogisticsCost?.toString() ?? ""); }}
                                    className="px-2 py-0.5 rounded-md bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 text-[9px] font-black text-warning-600 dark:text-warning-400 uppercase tracking-widest hover:bg-warning-100 transition-colors">
                                    Not Set
                                  </button>
                                  {s.orderLogisticsCost != null && s.orderLogisticsCost > 0 && (
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tabular-nums">
                                      Order: ₹{s.orderLogisticsCost.toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <span className="text-[11px] font-black tabular-nums text-gray-500 dark:text-gray-400">+₹{(s.shopLogisticsCost || 0).toFixed(2)}</span>
                                  <button onClick={() => { setEditingLogisticsId(s.shopSettlementId); setEditLogisticsAmount((s.shopLogisticsCost || 0).toString()); }}
                                    className="opacity-0 group-hover/l:opacity-100 p-1 text-gray-400 hover:text-brand-500 rounded transition-all">
                                    <Edit2 size={11} />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Net Payable */}
                        <TableCell className="px-5 py-4">
                          <div className="inline-flex items-center px-3 py-1.5 bg-brand-50 dark:bg-brand-500/10 rounded-xl border border-brand-100 dark:border-brand-500/20">
                            <span className="text-[11px] font-black tabular-nums text-brand-600 dark:text-brand-400 tracking-tight">
                              ₹{fmt(s.shopTotalAmount || 0)}
                            </span>
                          </div>
                          {(!s.shopTotalAmount || s.shopTotalAmount === 0) && (
                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/30">
                              <AlertTriangle size={10} className="text-amber-500 shrink-0" />
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Set amount first</span>
                            </div>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-5 py-4">
                          {activeTab === "unpaid" ? (
                            <Badge color={isNew(s.createdAt) ? "warning" : "light"} variant="light" size="sm">
                              {isNew(s.createdAt) ? "New" : "Pending"}
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge color="success" variant="light" size="sm">Settled</Badge>
                              {s.settledAt && (
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-tight">
                                  {fmtDate(s.settledAt)}
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest italic">
              * Commission skipped for pickup orders (₹0 delivery)
            </p>
            <div className="flex items-center gap-1 text-[10px] text-gray-300 dark:text-gray-600 font-bold uppercase tracking-widest">
              <AlertTriangle size={10} /> Purge removes deleted-order settlements
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
