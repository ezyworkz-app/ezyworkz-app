import type { CartLine } from "@/context/CartContext";
import type { DeliveryKey } from "@/types/common";
import { haversineKm, tieredFee } from "./delivery";

export type Totals = {
  base: number;
  addonsTotal: number;
  multiplierUpcharge: number;
  distanceFee: number;
  lowCartFee: number;
  lowCartFeeBreakdown: {
    total: number;
    breakdown: { service: string; fee: number }[];
  };
  tax: number;
  discount: number;
  shopDiscount: number;
  grand: number;
  deliveryTotal: number;
  multiplierLabel?: string;
  multiplierBreakdown: {
    [key: string]: {
      amount: number;
      label: string;
    };
  };
  tripCount: number;
  shopBaseAmount: number;
  shopAddonsTotal: number;
  shopTotalAmount: number;
};

export function calculateLowCartFee(orderServices: any[]): {
  total: number;
  breakdown: { service: string; fee: number }[];
} {
  const breakdown: { service: string; fee: number }[] = [];
  const BREAKEVEN_COST = 120;
  const ALREADY_COLLECTED = 50;
  const COMMISSION = 0.175;

  const map: Record<
    string,
    { name: string; total: number; multiplier: number; deliveryType?: string }
  > = {};

  orderServices.forEach((svc) => {
    const name = (svc.serviceName || "").toLowerCase().replace(/\s+/g, " ").trim();

    const keys = Object.keys(svc.deliveryType || svc.deliveryTypes || {}) as string[];
    const deliveryKey = keys.length ? keys[0] : "standard";
    const multiplier = (svc.deliveryType || svc.deliveryTypes)?.[deliveryKey]?.priceMultiplier ?? 1;

    const baseTotal = svc.baseAmount ?? 0;
    map[name] = {
      name,
      total: baseTotal * multiplier,
      multiplier,
      deliveryType: deliveryKey,
    };
  });

  const washFold = map["wash & fold"];
  const washIron = map["wash & iron"];
  const steam = map["steam ironing"];
  const dry = map["dry cleaning"];
  const hasAnyWash = !!(washFold || washIron);

  if (hasAnyWash) {
    const total = (washFold?.total ?? 0) + (washIron?.total ?? 0);
    const deliveryTypes = [washFold?.deliveryType, washIron?.deliveryType].filter(Boolean);
    const hasExpress = deliveryTypes.includes("express");
    const hasOneDay = deliveryTypes.includes("oneDay");
    const threshold = hasExpress ? 400 : hasOneDay ? 350 : 250;
    if (total < threshold) {
      breakdown.push({
        service: washFold && washIron ? "wash & fold + wash & iron" : washFold ? "wash & fold" : "wash & iron",
        fee: Math.round(threshold - total),
      });
    }
  } else if ((steam || dry) && (steam?.total ?? 0) + (dry?.total ?? 0) < 250) {
    const combinedTotal = (steam?.total ?? 0) + (dry?.total ?? 0);
    const platformEarning = combinedTotal * COMMISSION;
    const effectiveRecovery = platformEarning + ALREADY_COLLECTED;
    if (effectiveRecovery < BREAKEVEN_COST) {
      const fee = Math.round(BREAKEVEN_COST - effectiveRecovery);
      breakdown.push({
        service: steam && dry ? "dry cleaning + steam ironing" : steam ? "steam ironing" : "dry cleaning",
        fee,
      });
    }
  }

  return {
    total: breakdown.reduce((sum, b) => sum + b.fee, 0),
    breakdown,
  };
}
