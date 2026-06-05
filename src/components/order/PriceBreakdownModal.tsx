"use client";
import { createPortal } from "react-dom";

export default function PriceBreakdownModal({
  open,
  onClose,
  values,
}: {
  open: boolean;
  onClose: () => void;
  values: {
    items: number;
    delivery: number;
    discount: number;
    tax: number;
    grand: number;
  };
}) {
  if (typeof window === "undefined" || !open) return null;
  const root = document.getElementById("modal-root") || document.body;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* sheet */}
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-6 shadow-md md:rounded-2xl">
        <h2 className="text-lg font-semibold text-center mb-4">
          Price details
        </h2>

        <ul className="space-y-3 text-sm">
          <li className="flex justify-between">
            <span>Items total</span>
            <span>₹{values.items.toLocaleString("en-IN")}</span>
          </li>
          <li className="flex justify-between">
            <span>Delivery charges</span>
            <span>₹{values.delivery.toLocaleString("en-IN")}</span>
          </li>
          <li className="flex justify-between">
            <span>Discount</span>
            <span className="text-green-600">
              −₹{values.discount.toLocaleString("en-IN")}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Tax&nbsp;(GST 5%)</span>
            <span>₹{values.tax.toLocaleString("en-IN")}</span>
          </li>
        </ul>

        <div className="mt-4 flex justify-between border-t pt-4 font-semibold">
          <span>Grand total</span>
          <span>₹{values.grand.toLocaleString("en-IN")}</span>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-indigo-600 py-2 text-white"
        >
          Close
        </button>
      </div>
    </div>,
    root
  );
}
