/* components/shop/ServiceTabs.tsx */
"use client";
import type { ShopService } from "@/types/shop-menu";

interface Props {
  services: ShopService[];
  activeServiceId: string | null;
  onSelect: (svc: ShopService) => void;
  cartCountByServiceId?: Record<string, number>;
}

export default function ServiceTabs({
  services,
  activeServiceId,
  onSelect,
  cartCountByServiceId = {},
}: Props) {
  return (
    <div
      className="
        flex gap-3 px-1 pb-3
        overflow-x-auto scroll-smooth
        snap-x snap-mandatory
        whitespace-nowrap
        [&::-webkit-scrollbar]:hidden
      "
    >
      {services.map((svc) => {
        const active = svc.shopServiceId === activeServiceId;
        const count = cartCountByServiceId[svc.shopServiceId] ?? 0;

        const expressDuration =
          Object.entries(svc.deliveryTypes || {}).find(
            ([k]) => k.toLowerCase() === "express"
          )?.[1].duration ?? null;

        return (
          <button
            key={svc.shopServiceId}
            onClick={() => onSelect(svc)}
            className={`
              relative shrink-0 snap-start
              flex flex-col items-start justify-center
              min-w-[100px] px-2 pt-2
              capitalize text-sm transition
              ${active
                ? "border-t-3 border-purple-500 text-neutral-800"
                : "text-neutral-800 border-neutral-300 hover:bg-gray-50"
              }
            `}
          >
            {/* 🟢 Cart count badge */}
            <span className="flex items-center gap-1.5">
              <span className="font-medium">{(svc.name && svc.name.trim() !== "" ? svc.name.trim() : null) || (svc as any).globalServiceId || svc.shopServiceId || "Unknown"}</span>
              {count > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-green-500 text-white text-[10px] font-bold leading-none">
                  {count}
                </span>
              )}
            </span>
            {expressDuration && (
              <span className="mt-0.5 text-xs text-gray-500">
                Min&nbsp;{expressDuration}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
