"use client";

import { useMemo } from "react";
import DeliveryPicker from "./DeliveryPicker";
import CategoryBlock from "./CategoryBlock";
import AddonsBlock from "./AddonsBlock";
import { useCheckout } from "./CheckoutState";

import type { DeliveryKey, DeliveryType } from "@/types/common";
import type { CartLine } from "@/context/CartContext";

export default function ServiceAccordion({
  svcKey,
  serviceName,
  deliveryTypes,
  categories,
  selectedKey,
  onDeliveryChange,
  open,
  toggleOpen,
}: {
  svcKey: string;
  serviceName: string;
  deliveryTypes: Record<DeliveryKey, DeliveryType>;
  categories: {
    categoryId: string;
    categoryName: string;
    items: CartLine[];
  }[];
  selectedKey: DeliveryKey;
  onDeliveryChange: (k: DeliveryKey) => void;
  open: boolean;
  toggleOpen: () => void;
}) {
  const { availableAddonsBySvc, loadingAddons, getAddonsTotal } = useCheckout();

  /* totals */
  const { itemCount, total } = useMemo(() => {
    const all = categories.flatMap((c) => c.items);
    const base = all.reduce((n, i) => n + i.price * i.qty, 0);
    const count = all.reduce((n, i) => n + i.qty, 0);
    const addonsTotal = getAddonsTotal(svcKey);
    const multiplier = deliveryTypes[selectedKey]?.priceMultiplier ?? 1;

    return {
      itemCount: count,
      total: (base + addonsTotal) * multiplier,
    };
  }, [categories, deliveryTypes, selectedKey, svcKey, getAddonsTotal]);

  /* simple chevron */
  const Chevron = (
    <svg
      className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
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
    <li key={svcKey}>
      {/* ███ Card wrapper */}
      <div className="rounded-2xl border-2 border-purple-100 bg-white">
        {/* ── header row ─────────────────────────────── */}
        <button
          onClick={toggleOpen}
          className="flex w-full p-4 items-center justify-between"
        >
          {/* name + items */}
          <div className="flex flex-col text-left ">
            <span className="text-base font-semibold capitalize">
              {serviceName}
            </span>
            <span className="text-xs text-gray-500">{itemCount} items</span>
          </div>

          {/* price + chevron */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-900">
              ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {Chevron}
          </div>
        </button>

        {/* ── expanded content ───────────────────────── */}
        {open && (
          <div className="space-y-4 p-4">
            {categories.map((cat) => (
              <CategoryBlock key={cat.categoryId} {...cat} />
            ))}
          </div>
        )}

        {/* ── footer section (addons + delivery) ───────── */}
        <div className="border-t border-purple-100">
          <div className="px-4">
            <AddonsBlock
              svcKey={svcKey}
              addons={(availableAddonsBySvc[svcKey] || []) as any}
              loading={loadingAddons}
            />
          </div>

          <div className="space-y-2 p-4 pt-0">
            <p className="text-base font-medium text-gray-500">
              Choose delivery type
            </p>
            <DeliveryPicker
              deliveryTypes={deliveryTypes}
              selected={selectedKey}
              onSelect={onDeliveryChange}
            />
          </div>
        </div>
      </div>
    </li>
  );
}
