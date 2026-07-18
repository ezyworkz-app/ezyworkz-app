"use client";

import React from "react";
import type { Order, OrderStatusEntry } from "@/types/order"; // Adjust import path as needed
import Card, { CardProps } from "./ui/Card";
import Badge, { BadgeProps } from "./ui/Badge";
import { updateOrderLogisticsType, updateOrderChatType, updateFulfillmentCartByAdmin, updateOrderFinancials, deleteOrder, updateRiderAssignment } from "@/lib/actions/orders";
import { Truck, MessageSquare, IndianRupee, Save, Trash2, Bike } from "lucide-react";
import { useRouter } from "next/navigation";
import { getUnifiedAddonName } from "@/utils/addonUtils";

/* -- your reusable atoms ----------------------------------------- */
// import Card from "@/components/ui/Card";
// import Badge from "@/components/ui/Badge";
// import Button from "@/components/ui/Button";

interface OrderDetailsProps {
  order: Order;
}

/* -- helpers ------------------------------------------------------ */
const fmt = (d?: string) => (d ? new Date(d).toLocaleString() : "—");

const statusVariant: Record<Order["status"], BadgeProps["variant"]> = {
  waiting_confirmation: "neutral",
  confirmed: "primary",
  in_pickup: "tertiary",
  in_process: "warning",
  ready_to_deliver: "secondary",
  out_for_delivery: "tertiary",
  delivered: "success",
  waiting_user_review: "warning",
  payment_pending: "warning",
  cancelled: "danger",
};


const Alert = ({
  title,
  message,
  destructive = false,
}: {
  title: string;
  message: string;
  destructive?: boolean;
}) => (
  <Card
    padding="md"
    className={
      destructive ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"
    }
  >
    <h2 className="font-semibold mb-1">{title}</h2>
    <p className="text-sm">{message}</p>
  </Card>
);

/* -- tiny building blocks ---------------------------------------- */
const Section = ({
  title,
  children,
  padding = "lg",
}: {
  title: string;
  children: React.ReactNode;
  padding?: CardProps["padding"];
}) => (
  <Card padding={padding} className="space-y-3">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </Card>
);

const PriceRow = ({
  label,
  value,
  bold,
}: {
  label: string;
  value: number | string;
  bold?: boolean;
}) => (
  <div className="flex justify-between text-sm">
    <span className={bold ? "font-semibold" : ""}>{label}</span>
    <span className={bold ? "font-semibold" : ""}>
      ₹{typeof value === "number" ? value.toFixed(2) : value}
    </span>
  </div>
);

const Timeline = ({ history }: { history: OrderStatusEntry[] }) => (
  <ol className="relative border-s border-gray-200 pl-6 space-y-4">
    {history?.map((h) => (
      <li key={h.timestamp} className="space-y-0.5">
        <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-gray-400" />
        <p className="text-sm font-medium capitalize">
          {h.status.replace(/_/g, " ")}
        </p>
        <p className="text-xs text-gray-500">{fmt(h.timestamp)}</p>
      </li>
    ))}
  </ol>
);
const OrderDetails: React.FC<OrderDetailsProps> = ({ order }) => {
  const [viewMode, setViewMode] = React.useState<"updated" | "original">("updated");
  const [isShopHandling, setIsShopHandling] = React.useState(!!order.isShopLogistics);
  const [isUpdatingLogistics, setIsUpdatingLogistics] = React.useState(false);
  const [isShopChatEnabled, setIsShopChatEnabled] = React.useState(order.isShopChatEnabled !== false);
  const [isUpdatingChat, setIsUpdatingChat] = React.useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to PERMANENTLY delete this order? This action cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      const res = await deleteOrder(order.orderId);
      if (res.error) throw new Error(res.error);
      alert("Order deleted successfully");
      router.push("/orders");
    } catch (err: any) {
      alert(err.message || "Failed to delete order");
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Financial Audit State
  const [isUpdatingFinancials, setIsUpdatingFinancials] = React.useState(false);
  const [logisticsCostInput, setLogisticsCostInput] = React.useState(order.logisticsCost?.toString() || "");
  const [shopLogisticsCostInput, setShopLogisticsCostInput] = React.useState(order.shopLogisticsCost?.toString() || "");

  // Rider Assignment State
  const [isUpdatingRider, setIsUpdatingRider] = React.useState(false);
  const [riderOtp, setRiderOtp] = React.useState(order.rapidoOtp || "");
  const [riderName, setRiderName] = React.useState(order.rapidoRiderName || "");
  const [riderBookingId, setRiderBookingId] = React.useState(order.rapidoBookingId || "");
  const [riderPayoutAmount, setRiderPayoutAmount] = React.useState(order.deliveryPayoutAmount?.toString() || "");

  const handleUpdateFinancials = async () => {
    setIsUpdatingFinancials(true);
    try {
      const formData = new FormData();
      formData.append("orderId", order.orderId);
      formData.append("logisticsCost", logisticsCostInput);
      formData.append("shopLogisticsCost", shopLogisticsCostInput);
      
      const res = await updateOrderFinancials(formData);
      if (res.error) throw new Error(res.error);
      alert("Financial audit updated successfully");
    } catch (err: any) {
      alert(err.message || "Failed to update financial audit");
    } finally {
      setIsUpdatingFinancials(false);
    }
  };

  const handleUpdateRiderAssignment = async () => {
    setIsUpdatingRider(true);
    try {
      const res = await updateRiderAssignment(order.orderId, {
        rapidoOtp: riderOtp.trim() || undefined,
        rapidoRiderName: riderName.trim() || undefined,
        rapidoBookingId: riderBookingId.trim() || undefined,
        deliveryPayoutAmount: riderPayoutAmount ? parseFloat(riderPayoutAmount) : undefined,
      });
      if (res.error) throw new Error(res.error);
      alert("Rider assignment saved. The shop app will now show the Pay Rider button.");
    } catch (err: any) {
      alert(err.message || "Failed to save rider assignment");
    } finally {
      setIsUpdatingRider(false);
    }
  };

  const handleToggleLogistics = async () => {
    setIsUpdatingLogistics(true);
    try {
      const nextValue = !isShopHandling;
      const res = await updateOrderLogisticsType(order.orderId, nextValue);
      if (res.error) throw new Error(res.error);
      setIsShopHandling(nextValue);
      alert(`Logistics set to ${nextValue ? "Shop" : "System"} handled`);
    } catch (err: any) {
      alert(err.message || "Failed to update logistics type");
    } finally {
      setIsUpdatingLogistics(false);
    }
  };

  const handleReconcile = async () => {
    if (!confirm("Are you sure you want to mark this fulfillment as reconciled? This indicates you have verified the fulfillment cart against the customer bill.")) return;
    
    setIsUpdatingStatus(true);
    try {
      const res = await updateFulfillmentCartByAdmin(order.orderId, {
        fulfillmentCart: order.fulfillmentCart || [],
        fulfillmentStatus: "reconciled"
      });
      if (res.error) throw new Error(res.error);
      alert("Order marked as reconciled successfully");
    } catch (err: any) {
      alert(err.message || "Failed to reconcile order");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleToggleChat = async () => {
    setIsUpdatingChat(true);
    try {
      const nextValue = !isShopChatEnabled;
      const res = await updateOrderChatType(order.orderId, nextValue);
      if (res.error) throw new Error(res.error);
      setIsShopChatEnabled(nextValue);
      alert(`Shop chat notifications ${nextValue ? "enabled" : "disabled"}`);
    } catch (err: any) {
      alert(err.message || "Failed to update chat notification type");
    } finally {
      setIsUpdatingChat(false);
    }
  };

  const isOriginal = viewMode === "original" && order.reviewSnapshot;

  const displayData = isOriginal ? {
    services: order.reviewSnapshot!.services,
    baseAmount: order.reviewSnapshot!.baseAmount,
    totalAmount: order.reviewSnapshot!.totalAmount,
    taxAmount: order.reviewSnapshot!.taxAmount,
    discountAmount: order.reviewSnapshot!.discountAmount,
    deliveryCharges: order.reviewSnapshot!.deliveryCharges,
    grandTotalPaid: order.reviewSnapshot!.grandTotalPaid,
    multiplierUpcharge: order.reviewSnapshot!.multiplierUpcharge,
    multiplierBreakdown: order.reviewSnapshot!.multiplierBreakdown,
    multiplierLabel: order.multiplierLabel,
    tripCount: order.reviewSnapshot!.tripCount,
    lowCartFee: order.reviewSnapshot!.lowCartFee,
  } : {
    services: order.services,
    baseAmount: order.baseAmount,
    totalAmount: order.totalAmount,
    taxAmount: order.taxAmount,
    discountAmount: order.discountAmount,
    deliveryCharges: order.deliveryCharges,
    grandTotalPaid: order.grandTotalPaid,
    multiplierUpcharge: order.multiplierUpcharge,
    multiplierBreakdown: order.multiplierBreakdown,
    multiplierLabel: order.multiplierLabel,
    tripCount: order.tripCount,
    lowCartFee: order.lowCartFee,
  };

  const currentServices = displayData.services;

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6">
      {/* header */}
      <Card
        padding="lg"
        className="flex flex-wrap justify-between items-center gap-4"
      >
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold">
            Order<span className="text-gray-500">#{order.orderId}</span>
          </h1>
          {order.reviewSnapshot && (
            <div className="mt-2 text-sm text-amber-600 font-medium">
              This order has pending updates by the shop.
            </div>
          )}
        </div>
        <Badge variant={statusVariant[order.status]}>
          {order?.status?.replace(/_/g, " ")}
        </Badge>
      </Card>

      {/* View Toggle */}
      {order.reviewSnapshot && (
        <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setViewMode("original")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === "original"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Original Cart
          </button>
          <button
            onClick={() => setViewMode("updated")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === "updated"
              ? "bg-amber-100 text-amber-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Updated Cart
          </button>
        </div>
      )}

      {/* banner alert if in waiting_user_review */}
      {order.status === "waiting_user_review" && (
        <Alert
          title="Waiting for User Review"
          message="The shop has updated the order. The user must accept or reject these changes before the order can proceed."
        />
      )}

      <Section title="Status & Dates">
        <div className="grid grid-cols-2 text-sm gap-4">
          <div>
            <p>
              Created:{" "}
              <span className="font-medium">{fmt(order.createdAt)}</span>
            </p>
            <p>
              Updated:{" "}
              <span className="font-medium">{fmt(order.updatedAt)}</span>
            </p>
            {order.receivedAtShop && (
              <p>
                Received at Shop:{" "}
                <span className="font-medium">{fmt(order.receivedAtShop)}</span>
              </p>
            )}
            {order.deliveredAt && (
              <p>
                Delivered:{" "}
                <span className="font-medium">{fmt(order.deliveredAt)}</span>
              </p>
            )}
          </div>
          <div>
            <p>UserID: {order.userId}</p>
            {order.user && (
              <>
                <p>User: {order.user.name}</p>
                <p>Phone: {order.user.phoneNumber}</p>
              </>
            )}
          </div>
        </div>
      </Section>

      {/* address */}
      <Section title="Address">
        {order.address ? (
          <div className="text-sm space-y-0.5">
            <p>{order.address.houseNo}</p>
            <p>{order.address.block}</p>
            <p>{order.address.label}</p>
            <p>{order.address.line1}</p>
            {order.address.line2 && <p>{order.address.line2}</p>}
            <p>
              {order.address.area}, {order.address.city}, {order.address.state}-
              {order.address.pincode}
            </p>
            <p className="text-gray-500">
              {order.address.country}
              {order.address.lat &&
                ` · ${order.address.lat.toFixed(
                  5
                )},${order.address.lng?.toFixed(5)}`}
            </p>
          </div>
        ) : (
          <p className="italic text-gray-500 text-sm">No address provided.</p>
        )}
      </Section>

      {/* services */}
      <Section title={isOriginal ? "Original Services & Items" : "Services & Items"}>
        <div className={isOriginal ? "opacity-75" : ""}>
          {currentServices?.map((svc) => (
            <div key={svc.shopServiceId} className="space-y-4 border-b last:border-0 pb-6 mb-6">
              <div className="flex flex-wrap justify-between items-center bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg text-gray-900">{svc.serviceName}</h3>
                  {svc.selectedDeliveryKey && (
                    <Badge variant="neutral" className="uppercase text-[10px] border border-gray-200">
                      {svc.selectedDeliveryKey}
                    </Badge>
                  )}
                </div>
                <span className="text-base font-bold text-gray-900">
                  Total ₹{svc.serviceTotal.toFixed(2)}
                </span>
              </div>

              {/* service-level addons */}
              {svc.addons && svc.addons.length > 0 && (
                <div className="ml-4 space-y-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Service Add-ons</p>
                  <div className="flex flex-wrap gap-2">
                    {svc.addons.map((addon, aIdx) => (
                      <div key={aIdx} className="flex items-center gap-2 bg-white border border-gray-200 px-2 py-1 rounded text-sm text-gray-700">
                        <span className="font-medium">
                          {getUnifiedAddonName(addon.addonName, addon.variationName)}
                        </span>
                        <span className="text-gray-300">×</span>
                        <span>{addon.qty}</span>
                        <span className="text-gray-200">|</span>
                        <span className="text-gray-500 font-mono">₹{addon.price}</span>
                      </div>
                    ))}
                    </div>
                  </div>
                )}
              {Object.keys(svc.deliveryTypes).length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries(svc.deliveryTypes).map(([t, v]) => (
                    <Badge key={t} variant="neutral" className="capitalize">
                      {t}: {v.priceMultiplier}× · {v.duration}
                    </Badge>
                  ))}
                </div>
              )}

              {/* categories & items */}
              <div className="space-y-2 ml-2">
                {svc.categories.map((cat) => (
                  <div key={cat.shopServiceCategoryId}>
                    <p className="font-medium text-gray-700 text-sm">{cat.categoryName}</p>
                    <ul className="ml-4 list-disc text-sm space-y-0.5">
                      {cat.items.map((it) => {
                          // markedUnitPrice = user-facing unit price (markup applied by backend)
                          // Fallback: back-derive item unit cost by subtracting addon total from totalPrice
                          const addonsSumPerUnit = it.addons?.reduce((s, a) => s + (a.price ?? 0), 0) ?? 0;
                          const unitPrice = it.markedUnitPrice ?? (((it.totalPrice - addonsSumPerUnit * (it.qty || 1)) / (it.qty || 1)) || 0);
                          return (
                            <li key={it.shopServiceCategoryItemId}>
                              {it.itemName} — {it.qty} ×
                              ₹{unitPrice.toFixed(2)} = ₹{it.totalPrice.toFixed(2)}
                              {it.addons?.length ? (
                                <ul className="ml-4 list-square text-xs text-gray-400">
                                  {it.addons.map((a) => (
                                    <li key={a.shopItemAddonId}>
                                      + {getUnifiedAddonName(a.addonName, a.variationName)} (×{it.qty}) — ₹
                                      {(a.price ?? 0).toFixed(2)} each
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 🏗️ B2B Fulfillment Reconciliation Panel */}
      {order.fulfillmentCart && order.fulfillmentCart.length > 0 && (
        <Card padding="lg" className="border-2 border-violet-200 bg-violet-50/30">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔀</span>
              <h2 className="text-lg font-bold text-violet-800">B2B Fulfillment Reconciliation</h2>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              order.fulfillmentStatus === "reconciled"
                ? "bg-green-100 text-green-800 border-green-300"
                : order.fulfillmentStatus === "built_unverified"
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-violet-100 text-violet-800 border-violet-300"
            }`}>
              {order.fulfillmentStatus === "reconciled"
                ? "✓ Reconciled"
                : order.fulfillmentStatus === "built_unverified"
                  ? "⏳ Awaiting Review"
                  : "🔧 Pending Build"}
            </span>
          </div>

          {order.fulfillmentStatus !== "reconciled" && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center justify-between gap-4">
              <div>
                <strong>Action Required:</strong> Compare the carts below. Use the <strong>Edit</strong> buttons above to update the customer&apos;s bill or Shop B&apos;s fulfillment cart. Once aligned, mark as reconciled.
              </div>
              <button
                onClick={handleReconcile}
                disabled={isUpdatingStatus}
                className="shrink-0 px-4 py-2 bg-green-600 text-white rounded-md font-bold text-xs hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isUpdatingStatus ? "..." : "Mark as Reconciled"}
              </button>
            </div>
          )}

          <div className={`grid grid-cols-1 ${order.originalServicesSnapshot ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
            {/* Left: Original User Order (Immutable Snapshot) */}
            {order.originalServicesSnapshot && (
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Original User Order</p>
                <div className="space-y-3 opacity-60">
                  {order.originalServicesSnapshot.map((svc, sIdx) => (
                    <div key={sIdx} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                      <p className="text-sm font-bold text-gray-700 mb-2">{svc.serviceName}</p>
                      {svc.categories.map((cat, cIdx) => (
                        <div key={cIdx} className="ml-2 space-y-1">
                          {cat.items.map((it, iIdx) => (
                            <div key={iIdx} className="flex justify-between text-xs">
                              <span className="text-gray-600">{it.itemName} ×{it.qty}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="pt-2 italic text-[10px] text-gray-500 text-center">
                    Snapshot taken at time of transfer
                  </div>
                </div>
              </div>
            )}

            {/* Middle/Left: Customer's Current Bill (Shop A - Editable) */}
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Customer Bill (Current)</p>
              <div className="space-y-3">
                {order.services.map((svc, sIdx) => (
                  <div key={sIdx} className="bg-white rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-bold text-gray-700 mb-2">{svc.serviceName}</p>
                    {svc.categories.map((cat, cIdx) => (
                      <div key={cIdx} className="ml-2 space-y-1">
                        {cat.items.map((it, iIdx) => (
                          <div key={iIdx} className="flex justify-between text-sm">
                            <span className="text-gray-600">{it.itemName} ×{it.qty}</span>
                            <span className="font-medium text-gray-900">₹{it.totalPrice.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-sm font-semibold text-gray-600">Total Billed</span>
                  <span className="text-base font-black text-gray-900">₹{order.grandTotalPaid.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Right: Shop B's Fulfillment Cart (Independent) */}
            <div>
              <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-3">Fulfillment Cart (Shop B)</p>
              <div className="space-y-3">
                {order.fulfillmentCart.map((svc, sIdx) => (
                  <div key={sIdx} className="bg-white rounded-lg border border-violet-200 p-3 shadow-sm shadow-violet-100">
                    <p className="text-sm font-bold text-violet-700 mb-2">{svc.serviceName}</p>
                    {svc.categories.map((cat, cIdx) => (
                      <div key={cIdx} className="ml-2 space-y-1">
                        {cat.items.map((it, iIdx) => (
                          <div key={iIdx} className="flex justify-between text-sm">
                            <span className="text-gray-600">{it.itemName} ×{it.qty}</span>
                            <span className="font-medium text-violet-800">₹{it.totalPrice.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-violet-300">
                  <span className="text-sm font-semibold text-violet-700">Shop B Payout</span>
                  <span className="text-base font-black text-violet-800">
                    ₹{order.fulfillmentCart.reduce((sum, s) =>
                      sum + s.categories.reduce((cs, c) =>
                        cs + c.items.reduce((is, i) => is + i.totalPrice, 0), 0), 0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* price */}
      <Section title={isOriginal ? "Original Price Breakdown" : "Price Breakdown"}>
        <div className={isOriginal ? "opacity-75" : ""}>
          <PriceRow label="Items total" value={displayData.baseAmount ?? 0} />

          {displayData.multiplierBreakdown && Object.keys(displayData.multiplierBreakdown).length > 0 ? (
            Object.values(displayData.multiplierBreakdown).map((item, idx) => (
              <PriceRow key={idx} label={item.label} value={item.amount} />
            ))
          ) : (
            !displayData.multiplierBreakdown && displayData.multiplierUpcharge !== 0 && displayData.multiplierUpcharge != null && (
              <PriceRow
                label={displayData.multiplierLabel || "Priority fee"}
                value={displayData.multiplierUpcharge}
              />
            )
          )}

          {displayData.lowCartFee !== 0 && displayData.lowCartFee != null && (
            <div className="space-y-1">
              <PriceRow label="Low cart fee" value={displayData.lowCartFee} />
              {order.lowCartFeeBreakdown && (
                <div className="ml-4 space-y-0.5">
                  {order.lowCartFeeBreakdown.breakdown.map((b, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-gray-500 italic">
                      <span>{b.service}</span>
                      <span>₹{b.fee.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(displayData.discountAmount || 0) > 0 && (
            <PriceRow label="Admin Discount" value={-displayData.discountAmount} />
          )}

          {(order.shopDiscountAmount || 0) > 0 && (
            <PriceRow label="Shop Discount" value={-(order.shopDiscountAmount || 0)} />
          )}

          {order.walletAmountUsed! > 0 && (
            <PriceRow label="Wallet Redemption" value={-order.walletAmountUsed!} />
          )}
          {(order.ezyAmountUsed ?? 0) > 0 && (
            <PriceRow label="⚡ EZY Tokens" value={-(order.ezyAmountUsed!)} />
          )}

          {displayData.taxAmount !== 0 && displayData.taxAmount != null && (
            <PriceRow label="GST & Tax" value={displayData.taxAmount} />
          )}

          {displayData.deliveryCharges !== 0 && displayData.deliveryCharges != null && (
            <PriceRow
              label={displayData.tripCount && displayData.tripCount > 1 ? `Delivery Charges (x${displayData.tripCount})` : "Delivery Charges"}
              value={displayData.deliveryCharges}
            />
          )}

          {order.shopLogisticsCost !== undefined && order.shopLogisticsCost !== 0 && (
            <PriceRow label="Logistics (Paid to Shop)" value={order.shopLogisticsCost} />
          )}

          {order.logisticsCost !== undefined && order.logisticsCost !== 0 && (
            <PriceRow label="Logistics (External)" value={order.logisticsCost} />
          )}

          <div className="border-t my-2" />
          <PriceRow label="Grand Total" value={displayData.grandTotalPaid ?? 0} bold />
        </div>
      </Section>

      {/* 💰 Financial Audit - Admin Input */}
      <Card padding="lg" className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
            <IndianRupee size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-amber-900 leading-tight">Financial Audit</h2>
            <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Settlement overrides</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Truck size={14} className="text-gray-400" />
                External Logistics (Porter/Rapido)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                <input
                  type="number"
                  className="w-full pl-8 pr-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-gray-300"
                  placeholder="0.00"
                  value={logisticsCostInput}
                  onChange={(e) => setLogisticsCostInput(e.target.value)}
                  disabled={isUpdatingFinancials}
                />
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">
                Amount paid to external partners. Deducted from company profit.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Truck size={14} className="text-blue-400" />
                Shop Logistics (Internal)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                <input
                  type="number"
                  className="w-full pl-8 pr-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-gray-300"
                  placeholder="0.00"
                  value={shopLogisticsCostInput}
                  onChange={(e) => setShopLogisticsCostInput(e.target.value)}
                  disabled={isUpdatingFinancials}
                />
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">
                Amount paid to the shop for self-delivery. Increases shop payout.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-end space-y-4">
            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 space-y-2.5">
              <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-b border-amber-100 dark:border-amber-900/30 pb-1.5 flex justify-between items-center">
                Financial Summary
                <span className="text-gray-400 font-bold lowercase not-italic">Refreshed on save</span>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Customer Paid</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">₹{(order.grandTotalPaid ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Shop Payout</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">-₹{(order.shopPayout ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 italic">
                  <span>Shop Logistics</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">-₹{(Number(shopLogisticsCostInput) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 italic">
                  <span>External Logistics</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">-₹{(Number(logisticsCostInput) || 0).toFixed(2)}</span>
                </div>
                {order.compensationAmount !== 0 && (
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Compensations</span>
                    <span className="font-bold text-red-600 dark:text-red-400">-₹{(order.compensationAmount || 0).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="pt-2 border-t border-amber-100 dark:border-amber-900/30 flex justify-between items-center">
                  <span className="text-sm font-black text-amber-900 dark:text-amber-100 uppercase">Est. Net Profit</span>
                  <span className={`text-lg font-black ${
                    (order.grandTotalPaid - ((Number(shopLogisticsCostInput) || 0) + (Number(logisticsCostInput) || 0) + (order.compensationAmount || 0))) >= 0 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : "text-red-600 dark:text-red-400"
                  }`}>
                    ₹{(order.grandTotalPaid - ((Number(shopLogisticsCostInput) || 0) + (Number(logisticsCostInput) || 0) + (order.compensationAmount || 0))).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleUpdateFinancials}
              disabled={isUpdatingFinancials || (String(order.logisticsCost || "") === logisticsCostInput && String(order.shopLogisticsCost || "") === shopLogisticsCostInput)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingFinancials ? "Updating..." : (
                  <>
                    <Save size={16} /> Save Audit
                  </>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* 🛵 Rider Assignment & Payout */}
      {!["delivered", "cancelled", "waiting_confirmation", "payment_pending"].includes(order.status) && (
        <Card padding="lg" className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-violet-100 p-2 rounded-lg text-violet-600">
              <Bike size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-violet-900 leading-tight">Rider Assignment & Payout</h2>
              <p className="text-[10px] uppercase font-bold text-violet-500 tracking-wider">
                OTP + amount the shop pays the rider
              </p>
            </div>
            {order.deliveryPayoutStatus === "paid" && (
              <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                ✓ Rider Paid ₹{(order.deliveryPayoutAmount ?? 0).toFixed(2)}
              </span>
            )}
          </div>

          {order.deliveryPayoutStatus === "paid" && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              <strong>Payout complete.</strong> Shop paid ₹{(order.deliveryPayoutAmount ?? 0).toFixed(2)}
              {order.deliveryPayoutVpa ? ` → ${order.deliveryPayoutVpa}` : ""}.
              {order.deliveryPayoutId && <span className="ml-2 font-mono text-xs text-green-600">ID: {order.deliveryPayoutId}</span>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column: OTP + Rider Info */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Rider OTP</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all font-mono tracking-widest text-lg placeholder:text-gray-300 placeholder:tracking-normal placeholder:text-base"
                  placeholder="e.g. 4821"
                  maxLength={8}
                  value={riderOtp}
                  onChange={(e) => setRiderOtp(e.target.value.replace(/\D/g, ""))}
                  disabled={isUpdatingRider}
                />
                <p className="text-[11px] text-gray-500">
                  Shop sees this to verify the rider's identity before paying.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Rider Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all placeholder:text-gray-300"
                  placeholder="e.g. Ravi Kumar"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  disabled={isUpdatingRider}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Booking ID <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all font-mono placeholder:text-gray-300 placeholder:font-sans"
                  placeholder="e.g. RPD-29381"
                  value={riderBookingId}
                  onChange={(e) => setRiderBookingId(e.target.value)}
                  disabled={isUpdatingRider}
                />
              </div>
            </div>

            {/* Right column: Payout amount + save */}
            <div className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Payout Amount to Rider</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-4 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all placeholder:text-gray-300"
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                    value={riderPayoutAmount}
                    onChange={(e) => setRiderPayoutAmount(e.target.value)}
                    disabled={isUpdatingRider}
                  />
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">
                  This is pre-filled in the shop app. The shop pays this amount to the rider via UPI.
                </p>
              </div>

              {/* Preview */}
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-2 text-sm">
                <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Shop App Preview</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-violet-700 text-white px-3 py-1 rounded-lg text-base tracking-widest font-black">
                    {riderOtp || "----"}
                  </span>
                  <span className="text-gray-600 text-xs">OTP shown to shop</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 pt-1 border-t border-violet-100">
                  <span>Rider pay button shows</span>
                  <span className="font-bold text-violet-800">
                    {riderPayoutAmount ? `₹${parseFloat(riderPayoutAmount).toFixed(2)}` : "—"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleUpdateRiderAssignment}
                disabled={isUpdatingRider || (!riderOtp && !riderPayoutAmount)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingRider ? "Saving..." : (
                  <>
                    <Save size={16} /> Save Rider Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* payment */}
      <Section title="Payment Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase">Method</p>
            <div className="flex items-center gap-2">
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-bold uppercase border border-blue-100">
                {order.paymentMethod}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase">Status</p>
            <div>
              <Badge
                variant={
                  order.paymentStatus === "paid"
                    ? "success"
                    : order.paymentStatus === "failed"
                      ? "danger"
                      : "neutral"
                }
                className="capitalize text-sm py-1 px-3"
              >
                {order.paymentStatus}
              </Badge>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase">Reference ID</p>
            <p className="text-sm font-mono text-gray-600">
              {order.paymentReferenceId || "N/A"}
            </p>
          </div>
        </div>

        {order.amountPaid != null && order.amountPaid > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Amount Paid via Gateway:</span>
            <span className="text-lg font-black text-gray-900">₹{order.amountPaid.toFixed(2)}</span>
          </div>
        )}
      </Section>

      {/* timeline */}
      <Section title="Status History">
        <Timeline history={order.statusHistory} />
      </Section>

      {/* rating / review */}
      {(order.rating || order.review) && (
        <Section title="Rating & Review">
          {order.rating && <p>Rating: {order.rating} / 5</p>}
          {order.review && (
            <p className="italic text-gray-500">“{order.review}”</p>
          )}
        </Section>
      )}

      {/* Logistics & Misc */}
      {(order.notes || order.cancelReason || order.pickupScheduledAt || order.deliveryScheduledAt) && (
        <Section title="Logistics & Notes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Pickup Details</p>
                <p className="text-sm font-medium text-gray-900">Type: <span className="capitalize">{order.pickupType}</span></p>
                <p className="text-sm text-gray-600">Time: {fmt(order.pickupScheduledAt)}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Delivery Details</p>
                <p className="text-sm text-gray-600">
                  {order.deliveredAt
                    ? `Actually Delivered: ${fmt(order.deliveredAt)}`
                    : `Estimated Delivery: ${order.deliveryScheduledAt ? fmt(order.deliveryScheduledAt) : "TBD"}`}
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-blue-600 uppercase">Logistics Handling</p>
                  <Badge variant={isShopHandling ? "success" : "neutral"} className="text-[9px]">
                    {isShopHandling ? "Shop" : "System"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-800 font-medium">Shop handles pickup/delivery?</span>
                  <button
                    onClick={handleToggleLogistics}
                    disabled={isUpdatingLogistics}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isShopHandling ? 'bg-blue-600' : 'bg-gray-200'
                      } ${isUpdatingLogistics ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`${isShopHandling ? 'translate-x-5' : 'translate-x-1'
                        } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                    />
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-blue-600/70 italic leading-tight">
                  {isShopHandling
                    ? "Shop will see the logistics fee entry button in their app."
                    : "System (Porter/Rider) handles logistics. Shop cannot entry fees."}
                </p>
              </div>

              {/* Shop Chat Toggle */}
              <div className="p-3 bg-brand-50/50 rounded-lg border border-brand-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isShopChatEnabled ? "bg-brand-100 text-brand-600" : "bg-gray-200 text-gray-500"}`}>
                      <MessageSquare size={14} />
                    </div>
                    <p className="text-[10px] font-bold text-brand-600 uppercase">Shop Chat Alert</p>
                  </div>
                  <Badge variant={isShopChatEnabled ? "success" : "neutral"} className="text-[9px]">
                    {isShopChatEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-800 font-medium">Send user message alerts to shop?</span>
                  <button
                    onClick={handleToggleChat}
                    disabled={isUpdatingChat}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isShopChatEnabled ? 'bg-brand-600' : 'bg-gray-200'
                      } ${isUpdatingChat ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`${isShopChatEnabled ? 'translate-x-5' : 'translate-x-1'
                        } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {order.notes && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 italic">
                  <p className="text-[10px] font-black text-gray-400 uppercase not-italic mb-1">User Notes</p>
                  <p className="text-sm text-gray-700">“{order.notes}”</p>
                </div>
              )}
              {order.cancelReason && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-[10px] font-black text-red-500 uppercase mb-1">Cancellation Reason</p>
                  <p className="text-sm text-red-700 font-medium">{order.cancelReason}</p>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ⚠️ Danger Zone (Delete Cancelled Orders) */}
      {order.status === "cancelled" && (
        <Card padding="lg" className="border-2 border-red-200 bg-red-50/10 shadow-sm mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-900 uppercase tracking-tight">Danger Zone</h2>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Permanently delete this cancelled order</p>
              </div>
            </div>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? "Processing..." : (
                <>
                  <Trash2 size={16} /> Delete Permanently
                </>
              )}
            </button>
          </div>
        </Card>
      )}

      {/* quick back‑button (optional) */}
      {/* <div className="pt-2">
        <Button variant="secondary" size="md" onClick={() => history.back()}>
          ← Back
        </Button>
      </div> */}
    </div>
  );
};

export default OrderDetails;
