
// src/utils/cartToOrder.ts
import type { CartLine } from "@/context/CartContext";
import type { DeliveryKey } from "@/types/common";
import type {
  Address,
  Order,
  OrderItem,
  OrderService,
  OrderCategory,
} from "@/types/order";
import { getUnifiedAddonName } from "./addonUtils";

export type CreateOrderPayload = Pick<
  Order,
  | "shopId"
  | "shopName"
  | "services"
  | "paymentMethod"
  | "couponCode"
  | "address"
  | "notes"
  | "pickupType"
  | "pickupScheduledAt"
  | "totalAmount"
  | "deliveryCharges"
  | "grandTotalPaid"
  | "taxAmount"
  | "discountAmount"
  | "shopDiscountAmount"
  | "lowCartFee"
> & {
  deliveryScheduledAt: string;
  baseAmount?: number;
  multiplierUpcharge?: number;
  multiplierBreakdown?: {
    [key: string]: {
      amount: number;
      label: string;
    };
  };
  tripCount?: number;
  lowCartFeeBreakdown?: {
    total: number;
    breakdown: { service: string; fee: number }[];
  };
  userId?: string;
  customerId?: string; // backend mapping
  taxRate?: number;
};

const DEFAULT_DELIVERY: DeliveryKey = "standard";

const parseDurationToHours = (d: string | undefined): number | null => {
  if (!d) return null;
  const nums = d.match(/\d+/g);
  if (!nums || nums.length === 0) return null;
  const lastNum = Number(nums[nums.length - 1]);
  if (Number.isNaN(lastNum)) return null;
  if (/day/i.test(d)) return lastNum * 24;
  return lastNum;
};

export function cartToOrderPayload(
  cart: CartLine[],
  deliveryBySvc: Record<string, DeliveryKey>,
  opts: {
    paymentMethod: "cod" | "upi" | "card";
    address: Address;
    deliveryCharges: number;
    baseAmount: number;
    multiplierUpcharge: number;
    multiplierBreakdown?: {
      [key: string]: {
        amount: number;
        label: string;
      };
    };
    tripCount?: number;
    lowCartFee?: number;
    lowCartFeeBreakdown?: {
      total: number;
      breakdown: { service: string; fee: number }[];
    };
    couponCode?: string;
    notes?: string;
    pickupType?: "instant" | "schedule";
    pickupScheduledAt?: string;
    discountAmount?: number;
    shopDiscountAmount?: number;
    userId?: string;
    addonsBySvc?: Record<string, { addonId: string; variationId?: string; variationName?: string; name?: string; price: number; originalUnitPrice?: number; applyMarkup?: boolean; qty: number }[]>;
    shopGstRate?: number;
    walletAmountUsed?: number;
    ezyAmountUsed?: number;
  }
): CreateOrderPayload {
  if (!cart.length) throw new Error("Cart is empty");

  const svcMap: Record<string, OrderService> = {};

  // 🔹 Build per-service structure
  cart.forEach((line) => {
    const svcKey = `${line.shopId}-${line.serviceId}`;
    const dKey = deliveryBySvc[svcKey] ?? DEFAULT_DELIVERY;
    const dInfo = line.deliveryTypes[dKey];
    if (!dInfo) {
      throw new Error(
        `Missing delivery info for '${dKey}' on service ${line.serviceId}`
      );
    }

    let svc = svcMap[svcKey];
    if (!svc) {
      svc = svcMap[svcKey] = {
        shopServiceId: line.serviceId,
        serviceName: line.serviceName,
        deliveryTypes: {
          [dKey]: {
            priceMultiplier: dInfo.priceMultiplier,
            duration: dInfo.duration,
          },
        },
        categories: [],
        baseAmount: 0,
        serviceTotal: 0,
        selectedDeliveryKey: dKey,
        selectedDeliveryType: dKey,  // backend expects this field name
      } as any;
    }

    let cat = svc.categories.find(
      (c: OrderCategory) => c.shopServiceCategoryId === line.categoryId
    );
    if (!cat) {
      cat = {
        shopServiceCategoryId: line.categoryId,
        categoryName: line.categoryName,
        items: [],
        baseAmount: 0,
      };
      svc.categories.push(cat);
    }

    const itemTotal = line.qty * line.price;
    const item: OrderItem = {
      shopServiceCategoryItemId: line.itemId,
      itemName: line.itemName,
      qty: line.qty,
      quantity: line.qty, // backend CreateOrderItemInput expects 'quantity'
      unit: line.unit,
      totalPrice: itemTotal,
      originalUnitPrice: line.originalUnitPrice,
    } as any;

    cat.items.push(item);
    cat.baseAmount += itemTotal;
    svc.baseAmount += itemTotal;
  });

  Object.entries(opts.addonsBySvc ?? {}).forEach(([svcKey, addons]) => {
    if (svcMap[svcKey]) {
      svcMap[svcKey].addons = addons.map((a) => ({
        shopServiceAddonId: a.addonId,
        // 🟢 Persist unified name: prevents 'Steam Ironing - Kurta (Kurta)' type duplication
        addonName: getUnifiedAddonName(a.name || "Addon", a.variationName),
        variationId: a.variationId,
        variationName: a.variationName,
        price: a.price,
        originalUnitPrice: a.originalUnitPrice,
        applyMarkup: a.applyMarkup,
        qty: a.qty,
      }));
      
      // ✅ CRITICAL FIX: Add addon costs to the service base amount so they are included in totals and tax
      const addonCost = addons.reduce((sum, a) => sum + (a.price * a.qty), 0);
      svcMap[svcKey].baseAmount += addonCost;
    }
  });

  // 🔹 Calculate maximum delivery time across selected services
  let expressHours: number | null = null;
  let oneDayHours: number | null = null;
  let standardHours: number | null = null;

  Object.entries(svcMap).forEach(([svcKey, svc]) => {
    const selectedKey = deliveryBySvc[svcKey] ?? DEFAULT_DELIVERY;
    const sel = svc.deliveryTypes[selectedKey];
    const mult = sel?.priceMultiplier ?? 1;
    svc.serviceTotal = svc.baseAmount * mult;

    const hrs = parseDurationToHours(sel?.duration);
    if (selectedKey === "express" && hrs != null) {
      expressHours = Math.max(expressHours ?? 0, hrs);
    } else if (selectedKey === "oneDay" && hrs != null) {
      oneDayHours = Math.max(oneDayHours ?? 0, hrs);
    } else if (selectedKey === "standard" && hrs != null) {
      standardHours = Math.max(standardHours ?? 0, hrs);
    }
  });

  const maxHours = expressHours ?? oneDayHours ?? standardHours ?? 48;

  // 🔹 Total service cost before tax & discount
  const totalAmount = Object.values(svcMap).reduce(
    (sum, svc) => sum + svc.serviceTotal,
    0
  );

  const discountAmount = opts.discountAmount ?? 0;
  const shopDiscountAmount = opts.shopDiscountAmount ?? 0;
  const tripCount = opts.tripCount || 1;

  // 🔹 Normalize low-cart values
  const lowCartFee = opts.lowCartFee ?? 0;
  const lowCartFeeBreakdown =
    lowCartFee > 0
      ? opts.lowCartFeeBreakdown ?? { total: lowCartFee, breakdown: [] }
      : { total: 0, breakdown: [] };

  // 🔹 TAX CALCULATION (discount does NOT affect taxable value)
  const gstRate = (opts.shopGstRate ?? 5) / 100;
  const taxablePreDiscount = totalAmount + (opts.deliveryCharges * tripCount) + lowCartFee;
  const taxAmount = +(taxablePreDiscount * gstRate).toFixed(2);

  const walletAmountUsed = opts.walletAmountUsed ?? 0;
  const ezyAmountUsed = opts.ezyAmountUsed ?? 0;

  // 🔹 GRAND TOTAL (apply discount and wallet/ezy deductions AFTER tax)
  const grandTotalPaid = +(
    taxablePreDiscount +
    taxAmount -
    discountAmount -
    shopDiscountAmount -
    walletAmountUsed -
    ezyAmountUsed
  ).toFixed(2);


  // 🔹 Calculate delivery time
  let deliveryScheduledAtIso: string;
  if (opts.pickupType === "schedule" && opts.pickupScheduledAt) {
    const pickupDate = new Date(opts.pickupScheduledAt);
    const deliveryDate = new Date(
      pickupDate.getTime() + maxHours * 60 * 60 * 1000
    );
    deliveryScheduledAtIso = deliveryDate.toISOString();
  } else {
    deliveryScheduledAtIso = new Date(
      Date.now() + maxHours * 60 * 60 * 1000
    ).toISOString();
  }

  // 🔹 Return normalized payload
  return {
    shopId: cart[0].shopId,
    shopName: cart[0].shopName,
    services: Object.values(svcMap),
    paymentMethod: opts.paymentMethod,
    address: opts.address,
    totalAmount,
    deliveryCharges: opts.deliveryCharges,
    taxAmount, // tax stays pre-discount
    discountAmount, // explicit admin discount
    shopDiscountAmount, // explicit shop discount
    grandTotalPaid, // final after discount
    deliveryScheduledAt: deliveryScheduledAtIso,
    pickupType: opts.pickupType ?? "instant",
    pickupScheduledAt: opts.pickupScheduledAt,
    baseAmount: opts.baseAmount,
    multiplierUpcharge: opts.multiplierUpcharge,
    multiplierBreakdown: opts.multiplierBreakdown,
    tripCount,
    couponCode: opts.couponCode,
    notes: opts.notes,
    userId: opts.userId,
    customerId: opts.userId, // backend expects customerId

    // Always include these to overwrite stale DB values
    lowCartFee,
    lowCartFeeBreakdown,
    taxRate: opts.shopGstRate ?? 5,
  };
}
