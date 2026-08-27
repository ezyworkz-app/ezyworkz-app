// Common types for shops-web app

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface ShopOwner {
    shopOwnerId: string;
    email: string;
    name: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Shop lives in ./Shop.ts and is re-exported here.
 *
 * This file used to declare its own near-identical Shop interface. The two
 * drifted: adding a field meant editing both, and forgetting one produced a
 * type error in whichever half was missed — which is exactly what happened
 * when `autoPrintEnabled` was added.
 *
 * They were kept separate because the status unions disagreed: this file
 * matched the backend (`pending_approval | active | suspended | rejected |
 * inactive`) while Shop.ts used `in_progress | approved`. `ShopStatus` in
 * Shop.ts is now the union of both, so neither vocabulary is narrowed and the
 * duplicate is no longer needed.
 */
export type { Shop, ShopStatus } from "./Shop";

/** Per-day opening hours, keyed by lowercase weekday. */
export interface ShopTimingSlot {
    open: string;
    close: string;
}

export interface ShopTimingDay {
    working: boolean;
    slots: ShopTimingSlot[];
}

export type ShopTiming = Record<string, ShopTimingDay>;

/**
 * Address lives in ./Shop.ts and is re-exported here — same reasoning as Shop:
 * two near-identical declarations drifted, and Shop.address resolving to one
 * while settings pages imported the other produced "Property does not exist"
 * errors. Shop.ts now carries the union of every shape in use.
 */
// Imported as well as re-exported: `export … from` does not bind the name
// locally, and `Order.address` below refers to it.
import type { Address } from "./Shop";
export type { Address };

export interface User {
    userId: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ShopUser {
    userId: string;
    shopId: string;
    role: "owner" | "admin" | "manager" | "staff" | "user" | "customer" | "member";
    name?: string;
    joinedAt: string;
}

export interface ShopService {
    shopServiceId: string;
    shopId: string;
    name: string;
    description?: string;
    basePrice?: number;
    deliveryType?: Record<string, { duration: string; priceMultiplier: number }>;
    createdAt: string;
    updatedAt: string;
}

export interface ShopServiceCategory {
    shopServiceCategoryId: string;
    shopServiceId: string;
    name: string;
    order?: number;
    createdAt: string;
    updatedAt: string;
}

export interface ShopServiceCategoryItem {
    shopServiceCategoryItemId: string;
    shopServiceCategoryId: string;
    name: string;
    description?: string;
    price: number;
    unit?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ShopServiceAddon {
    shopServiceAddonId: string;
    shopServiceId: string;
    name: string;
    price: number;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Order {
    orderId: string;
    shopId: string;
    shopName?: string;
    userId: string;
    customerName: string;
    customerPhoneNumber?: string;
    status: string;
    paymentStatus: "pending" | "paid" | "failed" | "uncollectible";
    grandTotalPaid: number;
    baseAmount: number;
    taxAmount?: number;
    deliveryCharges?: number;
    discountAmount?: number;
    shopDiscountAmount?: number;
    lowCartFee?: number;
    services?: OrderService[];
    address?: Address;
    createdAt: string;
    updatedAt: string;
}

export interface OrderService {
    shopServiceId: string;
    serviceName: string;
    baseAmount: number;
    categories: OrderCategory[];
    deliveryType?: Record<string, { duration: string; priceMultiplier: number }>;
}

export interface OrderCategory {
    shopServiceCategoryId: string;
    categoryName: string;
    baseAmount: number;
    items: OrderItem[];
}

export interface OrderItem {
    shopServiceCategoryItemId: string;
    itemName: string;
    unitPrice: number;
    qty: number;
    unit?: string;
    itemSubtotal: number;
}

export interface Offer {
    offerId: string;
    shopId: string;
    shopName: string;
    title?: string;
    description?: string;
    code: string;
    type: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minOrderValue?: number;
    maxDiscountAmount?: number;
    templateType: string;
    startDate: string;
    endDate: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    offers?: T[];
    orders?: T[];
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    nextKey?: string;
    hasMore: boolean;
}
