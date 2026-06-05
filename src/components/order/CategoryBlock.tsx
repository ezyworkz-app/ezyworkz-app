"use client";
import { useState } from "react";
// import { CartLine } from "../../context/CartContext";
import QuantityToggle from "./QuantityToggle";
import { CartLine } from "@/context/CartContext";

export default function CategoryBlock({
  categoryId,
  categoryName,
  items,
}: {
  categoryId: string;
  categoryName: string;
  items: CartLine[];
}) {
  const [open, setOpen] = useState(true);

  const itemCount = items.reduce((n, i) => n + i.qty, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const Chevron = (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""
        }`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.02l3.71-3.79a.75.75 0 111.08 1.04l-4.24 4.32a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div
      key={categoryId}
      className=" rounded-xl border border-slate-200 bg-white"
    >
      {/* ── Header ───────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4"
      >
        {/* name + item count */}
        <div className="flex flex-col text-left">
          <span className="text-base font-semibold capitalize">
            {categoryName}
          </span>
          <span className="text-xs text-gray-500">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* total price + chevron */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">
            ₹{totalPrice > 0 ? totalPrice : "–"}
          </span>
          {Chevron}
        </div>
      </button>

      {/* ── Item Rows ───────────────────────────── */}
      {open && (
        <div className="overflow-hidden border-t border-purple-100">
          {items.map((line, idx) => (
            <div
              key={`${line.shopId}-${line.serviceId}-${line.itemId}`}
              className={`flex items-start justify-between gap-4 px-4 py-3 text-sm ${idx % 2 ? "bg-slate-50/60" : ""
                }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">
                  {line.itemName}
                </p>
                <p className="text-xs text-gray-500">
                  ₹{line.price} × {line.qty}
                </p>
              </div>

              <div className="w-28 shrink-0">
                <QuantityToggle {...line} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
