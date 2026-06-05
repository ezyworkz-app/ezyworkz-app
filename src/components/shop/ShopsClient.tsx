"use client";

import React, { useState } from "react";
import { X, RefreshCw, CheckCircle, Clock, AlertCircle, ShieldAlert, Layers } from "lucide-react";
import { getAllShops, updateShopStatus } from "@/lib/actions/shops";
import { Shop } from "@/types/Shop";
import Card from "../ui/Card";
import Select from "../ui/Select";
import Button from "../ui/Button";
import ShopTable from "./ShopTable";
import Link from "next/link";
import Pagination from "@/components/tables/Pagination";

interface ShopsClientProps {
  initialShops: Shop[];
  initialNextKey?: string;
  initialTotalCount: number;
  initialStatusCounts: Record<string, number>;
}

const TabButton = ({
  active,
  onClick,
  label,
  count,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  icon: any;
}) => (
  <button
    onClick={onClick}
    className={`shrink-0 py-3 px-4 text-xs font-bold transition-all duration-200 flex items-center gap-2 relative whitespace-nowrap ${active
      ? "text-brand-500"
      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      }`}
  >
    <Icon className={`h-3.5 w-3.5 ${active ? "text-brand-500" : "text-gray-400 opacity-70"}`} />
    {label}
    {count !== undefined && (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded font-black ${active ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          }`}
      >
        {count}
      </span>
    )}
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
    )}
  </button>
);

const ShopsClient: React.FC<ShopsClientProps> = ({ 
  initialShops, 
  initialNextKey, 
  initialTotalCount,
  initialStatusCounts 
}) => {
// ... (state remains same)
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [selectedStatus, setSelectedStatus] = useState<string>("approved");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"createdAt" | "totalOrders">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [pageKeys, setPageKeys] = useState<Record<number, string | undefined>>({ 1: undefined, 2: initialNextKey });
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [statusCounts, setStatusCounts] = useState(initialStatusCounts);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState({
    status: "",
  });

  const statusOptions = [
    { id: "approved", label: "Approved", icon: CheckCircle },
    { id: "in_progress", label: "In Progress", icon: Clock },
    { id: "pending_approval", label: "Pending Approval", icon: AlertCircle },
    { id: "suspended", label: "Suspended", icon: ShieldAlert },
    { id: "all", label: "All Shops", icon: Layers },
  ];

  const fetchPage = async (pageNumber: number, statusOverride?: string, sortOverride?: "createdAt" | "totalOrders", orderOverride?: "asc" | "desc") => {
    setIsLoading(true);
    const targetStatus = statusOverride || selectedStatus;
    const targetSortBy = sortOverride || sortBy;
    const targetSortOrder = orderOverride || sortOrder;

    try {
      // Reset keys if switching status or sorting
      const isReset = statusOverride || sortOverride || orderOverride;
      const key = (isReset || pageNumber === 1) ? undefined : pageKeys[pageNumber];
      
      const result = await getAllShops(10, key, targetStatus, targetSortBy, targetSortOrder);

      setShops(result.shops);
      setTotalCount(result.totalCount);
      setStatusCounts(result.statusCounts);
      
      // Update next page key
      if (result.nextKey) {
        setPageKeys(prev => ({ 
          ...(isReset ? { 1: undefined } : prev), 
          [pageNumber + 1]: result.nextKey 
        }));
      } else if (isReset) {
        setPageKeys({ 1: undefined });
      }

      setPage(pageNumber);
      if (statusOverride) setSelectedStatus(statusOverride);
      if (sortOverride) setSortBy(sortOverride);
      if (orderOverride) setSortOrder(orderOverride);

    } catch (error) {
      console.error("Failed to fetch shops page", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === selectedStatus) return;
    setPage(1);
    fetchPage(1, newStatus);
  };

  const handleSort = (criterion: "createdAt" | "totalOrders") => {
    const newOrder = sortBy === criterion && sortOrder === "desc" ? "asc" : "desc";
    setPage(1);
    fetchPage(1, undefined, criterion, newOrder);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === page) return;
    fetchPage(newPage);
  };

  const openModal = (shop: Shop) => {
    setSelectedShop(shop);
    setFormState({ status: shop.status });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedShop(null);
  };

  const handleSelectChange = (name: string, value: string) =>
    setFormState((s) => ({ ...s, [name]: value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 px-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Merchant Control</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-0.5">Global Shop Pipeline Management</p>
        </div>
        <Link href="/shops/pending-prices">
          <Button variant="primary" className="mt-4 sm:mt-0 font-black uppercase text-[10px] tracking-widest px-6 h-11">
            Price Approvals
          </Button>
        </Link>
      </div>

      {/* Status Tabs (Floating Header) */}
      <div className="bg-white dark:bg-gray-900 px-6 py-2 rounded-3xl border border-gray-200 dark:border-gray-800">
        <div className="flex space-x-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar pb-1">
          {statusOptions.map((opt) => {
            const count = statusCounts[opt.id] || 0;
            return (
              <TabButton
                key={opt.id}
                active={selectedStatus === opt.id}
                onClick={() => handleStatusChange(opt.id || "all")}
                label={opt.label}
                count={count}
                icon={opt.icon}
              />
            );
          })}
        </div>
      </div>

      {/* Main Table Card */}
      <Card padding="none" className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-3xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/10">
          <div className="flex flex-col">
            <h2 className="text-theme-sm font-black text-gray-900 dark:text-white tracking-tight">
              {statusOptions.find(o => o.id === selectedStatus)?.label} Pipeline
            </h2>
            <p className="text-theme-xs text-gray-400 mt-0.5 lowercase font-medium">merchants waiting for verification or active</p>
          </div>
          {isLoading && <RefreshCw className="animate-spin text-brand-500" size={18} />}
        </div>
        <ShopTable
          shops={shops}
          onEdit={openModal}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </Card>

      {/* Pagination Controls */}
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="text-[10px] font-black text-gray-400 tracking-widest lowercase">
          Showing {shops.length} of {totalCount} total merchants
        </div>
        <Pagination
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(totalCount / 10))}
          onPageChange={handlePageChange}
        />
      </div>

      {isModalOpen && selectedShop && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0 relative z-50">
            <div
              className="fixed inset-0 bg-gray-500/60 transition-opacity z-40"
              onClick={closeModal}
              aria-hidden="true"
            ></div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-visible shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50 relative">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Edit Shop Status
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form
                  action={async (formData) => {
                    await updateShopStatus(formData);
                    closeModal();
                  }}
                >
                  <input
                    type="hidden"
                    name="shopId"
                    value={selectedShop.shopId}
                  />

                  <div className="z-50 relative space-y-4">
                    <Select
                      label="Status"
                      name="shopStatus"
                      options={[
                        { value: "in_progress", label: "in_progress" },
                        {
                          value: "pending_approval",
                          label: "pending_approval",
                        },
                        { value: "approved", label: "approved" },
                        { value: "suspended", label: "suspended" },
                      ]}
                      value={formState.status}
                      onChange={(val) => handleSelectChange("status", val)}
                    />

                    <input
                      type="hidden"
                      name="shopStatus"
                      value={formState.status}
                    />
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeModal}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="w-full">
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopsClient;
