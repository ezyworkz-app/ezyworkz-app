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




