"use client";
import type { DeliveryKey, DeliveryType } from "@/types/common";

type Props = {
  deliveryTypes: Record<DeliveryKey, DeliveryType>;
  selected: DeliveryKey;
  onSelect: (key: DeliveryKey) => void;
};

const ORDER: DeliveryKey[] = ["standard", "oneDay", "express"]; // matches the image order

export default function DeliveryPicker({
  deliveryTypes,
  selected,
  onSelect,
}: Props) {
  // Hide tiers the shop has switched off. The backend already rejects an order
  // that uses a disabled tier, but this picker never checked the flag — so a
  // customer could pick one and only hit the problem as an error at checkout.
  // Absent means enabled, so tiers saved before the toggle existed still show.
  const keys = ORDER.filter((k) => k in deliveryTypes && deliveryTypes[k]?.enabled !== false);

  return (
    <div className="flex flex-wrap justify-between gap-2 rounded-2xl  border-purple-100">
      {keys.map((key) => {
        const dt = deliveryTypes[key];
        const active = key === selected;

        return (
          <label
            key={key}
            className={`relative flex-1 min-w-[100px] cursor-pointer rounded-2xl border px-4 py-3 transition 
              ${active
                ? "border-purple-600 border-2 bg-white"
                : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
          >
            <input
              type="radio"
              className="peer hidden"
              checked={active}
              onChange={() => onSelect(key)}
            />

            {/* Label text */}
            <div
              className={`text-sm font-semibold ${active ? "text-black" : "text-gray-800"
                }`}
            >
              {key.replace(/([A-Z])/g, " $1")}
            </div>

            {/* Duration */}
            <div
              className={`text-xs mt-1 ${active ? "text-gray-700" : "text-gray-500"
                }`}
            >
              {dt.duration}
            </div>

            {/* Custom radio circle */}
            <span
              className={`absolute right-3 top-3 h-4 w-4 rounded-full border-2 ${active
                  ? "border-purple-600 bg-white before:absolute before:left-1/2 before:top-1/2 before:h-2 before:w-2 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-purple-600 content-['']"
                  : "border-gray-400"
                }`}
            />
          </label>
        );
      })}
    </div>
  );
}
