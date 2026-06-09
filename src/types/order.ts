/* ------------------------------------------------------------------ */
/*  Common Types                                                      */
/* ------------------------------------------------------------------ */
import type { DeliveryKey, DeliveryType } from "./common";
import { User } from "./user";

/* ------------------------------------------------------------------ */
/*  Enums                                                             */
/* ------------------------------------------------------------------ */
export type OrderStatus =
    | "payment_pending"
    | "waiting_confirmation"
    | "confirmed"
    | "in_pickup"
    | "in_process"
    | "ready_to_deliver"
    | "out_for_delivery"
    | "delivered"
    | "waiting_user_review"
    | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partial" | "uncollectible";

export type FulfillmentStatus = "pending_build" | "built_unverified" | "reconciled";

/* ------------------------------------------------------------------ */
/*  Address                                                           */
/* ------------------------------------------------------------------ */
export interface Address {
    area: string;
    block?: string;
    buildingType?: string;
    city: string;
    country: string; // ISO‑2
    houseNo?: string;
    label: "home" | "work" | "others";
    lat: number;
    line1: string;
    line2?: string;
    lng: number;
    pincode: string;
    state: string;
    phoneNumber?: string;
}

/* ------------------------------------------------------------------ */
/*  Order Item Addons                                                 */
/* ------------------------------------------------------------------ */
export interface OrderItemAddon {
    addonName: string;
    price: number;
    originalUnitPrice?: number;
    shopItemAddonId: string;
    applyMarkup?: boolean;
    variationId?: string;
    variationName?: string;
}

/* ------------------------------------------------------------------ */
/*  Order Items                                                       */
/* ------------------------------------------------------------------ */
export interface OrderItem {
    addons?: OrderItemAddon[];
    itemName: string;
    qty: number;
    shopServiceCategoryItemId: string;
    totalPrice: number;
    markedUnitPrice?: number;
    originalUnitPrice?: number;
    unit: "piece" | "kg" | "sft";
}

/* ------------------------------------------------------------------ */
/*  Categories                                                        */
/* ------------------------------------------------------------------ */
export interface OrderCategory {
    baseAmount: number; // Σ item.totalPrice
    categoryName: string;
    items: OrderItem[];
    shopServiceCategoryId: string;
}

/* ------------------------------------------------------------------ */
/*  Order Service Addons                                              */
/* ------------------------------------------------------------------ */
export interface OrderServiceAddon {
    shopServiceAddonId: string;
    qty: number;
    price: number;
    originalUnitPrice?: number;
    addonName?: string;
    variationId?: string;
    variationName?: string;
    applyMarkup?: boolean;
}


/* ------------------------------------------------------------------ */
/*  Services                                                          */
/* ------------------------------------------------------------------ */
export interface OrderService {
    addons?: OrderServiceAddon[];
    baseAmount: number; // Σ category.baseAmount
    categories: OrderCategory[];
    deliveryTypes: Partial<Record<DeliveryKey, DeliveryType>>;
    serviceName: string;
    serviceTotal: number; // baseAmount × selected multiplier
    selectedDeliveryKey?: DeliveryKey;
    shopServiceId: string;
}

/* ------------------------------------------------------------------ */
/*  Status History                                                    */
/* ------------------------------------------------------------------ */
export interface OrderStatusEntry {
    changedBy?: "user" | "shop" | "system";
    status: OrderStatus;
    timestamp: string; // ISO
}

export interface OrderTransfer {
    fromShopId: string;
    fromShopName?: string;
    toShopId: string;
    toShopName?: string;
    reason: string;
    notes?: string;
    transferredAt: string;
    transferredBy: string;
}

/* ------------------------------------------------------------------ */
/*  Main Order Object                                                 */
/* ------------------------------------------------------------------ */
export interface Order {
    /* -------------------------- Identifiers -------------------------- */
    orderId: string;
    shopId: string;
    shopName: string;
    userId: string;
    user: User;
    orderSource?: "user" | "store";

    /* 📦 Item Count Cross-Check */
    userItemCount?: number;
    shopVerifiedItemCount?: number;

    /* 🔀 Transfer Routing */
    originalShopId?: string;
    transferHistory?: OrderTransfer[];
    /* ---------------------------- Status ----------------------------- */
    status: OrderStatus;
    statusHistory: OrderStatusEntry[];
    deliveredAt?: string;
    acceptedAt?: string;
    inPickupAt?: string;
    receivedAtShop?: string;
    outForDeliveryAt?: string;
    cancelReason?: string;

    /* ---------------------------- Payment ---------------------------- */
    paymentMethod: "cod" | "upi" | "card";
    paymentReferenceId?: string;
    paymentStatus: PaymentStatus;
    amountPaid?: number;
    walletAmountUsed?: number;
    ezyAmountUsed?: number;

    /* ----------------------------- Pricing --------------------------- */
    baseAmount: number;
    addonsTotal?: number;
    multiplierUpcharge: number;

    multiplierLabel?: string;
    multiplierBreakdown?: {
        [key: string]: {
            amount: number;
            label: string;
        };
    };
    tripCount?: number;
    totalAmount: number;
    taxAmount: number;
    discountAmount: number;
    shopDiscountAmount?: number;
    deliveryCharges: number;
    lowCartFee?: number;
    grandTotalPaid: number;
    couponCode?: string;
    lowCartFeeBreakdown?: {
        total: number;
        breakdown: { service: string; fee: number }[];
    };
    /* 🧾 Post-payment Adjustments */
    compensationAmount?: number; // admin-added refund/credit (damage, delay, etc.)

    /* 🏢 Internal Accounting (Admin-only) */
    shopBaseAmount?: number;
    shopAddonsTotal?: number;
    shopTotalAmount?: number;
    shopGrossAmount?: number; 
    shopCommissionAmount?: number;
    shopBonusAmount?: number;
    shopPayout?: number; // amount paid to shop
    logisticsCost?: number; // delivery cost incurred (external)
    shopLogisticsCost?: number; // delivery cost paid to shop (internal)
    netProfit?: number; // computed = grandTotalPaid - (shopPayout + shopLogisticsCost + logisticsCost + compensationAmount)
    /* ----------------------------- Services -------------------------- */
    services: OrderService[];

    /* 🏗️ B2B Fulfillment (Inter-Shop Transfer) */
    fulfillmentCart?: OrderService[];
    fulfillmentStatus?: FulfillmentStatus;
    originalServicesSnapshot?: OrderService[];

    /* ---------------------- Pickup / Delivery ------------------------ */
    pickupType: "instant" | "schedule";
    pickupScheduledAt?: string;
    deliveryScheduledAt?: string;
    address: Address;
    notes?: string;
    adminNotes?: string;

    /* ---------------------------- Feedback --------------------------- */
    rating?: 1 | 2 | 3 | 4 | 5;
    review?: string;

    /* ---------------------------- Snapshot --------------------------- */
    reviewSnapshot?: {
        services: OrderService[];
        baseAmount: number;
        totalAmount: number;
        taxAmount: number;
        discountAmount: number;
        deliveryCharges: number;
        grandTotalPaid: number;
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
    };

    /* ---------------------------- Timestamps ------------------------- */
    createdAt: string;
    updatedAt: string;
    isShopLogistics?: boolean;
    isShopChatEnabled?: boolean;
    refundPreference?: 'wallet' | 'original' | 'manual';

    /* ------------------------ Rapido Delivery OTP -------------------- */
    rapidoOtp?: string;              // set by admin when Rapido rider is assigned
    rapidoRiderName?: string;        // optional: rider name from Rapido
    rapidoBookingId?: string;        // optional: Rapido booking reference

    /* ------------------------ Rider Payout (Razorpay X) ------------- */
    deliveryPayoutAmount?: number;   // amount admin expects shop to pay rider
    deliveryPayoutStatus?: "pending" | "paid";
    deliveryPayoutId?: string;       // Razorpay payout ID after success
    deliveryPayoutVpa?: string;      // rider's UPI VPA used for payout
    userInfo?: {
        name?: string;
        maskedPhone?: string;
        email?: string;
        walletBalance?: number;
        hasUncollectibleBalance?: boolean;
        uncollectibleBalanceAmount?: number;
        activeOrderCount?: number;
        cancelledOrderCount?: number;
    };
}
