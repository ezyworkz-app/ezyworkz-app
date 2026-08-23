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
 * NOTE: there is a second, fuller `Shop` interface in `./Shop.ts`, and a third
 * `Address` in `./order.ts`. `ShopContext` imports from `@/types` (this file),
 * so this is the definition every settings page actually resolves to — and it
 * was missing most of the fields those pages read, which broke `next build`
 * with ~40 "Property X does not exist" errors.
 *
 * The fields below are added rather than re-exporting `./Shop.ts` because the
 * two declare DIFFERENT status unions: this one matches the backend
 * (`pending_approval | active | suspended | rejected | inactive`), whereas
 * Shop.ts uses `in_progress | approved`. Swapping them would silently change
 * status handling. Consolidating the duplicates is worth doing separately.
 */
export interface Shop {
    shopId: string;
    /**
     * Optional: not every endpoint returns it (e.g. getAllShops), and nothing
     * reads it off a Shop — `shopOwnerId` is consumed from the auth
     * `shopOwner` object instead. Requiring it made otherwise-valid Shop
     * objects unassignable.
     */
    shopOwnerId?: string;
    name: string;
    description?: string;
    address?: Address;
    phone?: string;
    email?: string;
    logo?: string;
    /**
     * Superset of both status vocabularies in use.
     *
     * The BACKEND writes: pending_approval | active | suspended | rejected |
     * inactive (see shop.model.ts). `./Shop.ts` additionally declares
     * `in_progress` and `approved`, and web code compares against those too.
     * Narrowing to the backend set would turn ~18 existing comparisons into
     * type errors, so both are accepted here.
     *
     * FIXME: `in_progress` and `approved` are not produced by the backend.
     * Worth confirming whether that code is dead before removing them.
     */
    status:
        | "pending_approval"
        | "active"
        | "suspended"
        | "rejected"
        | "inactive"
        | "in_progress"
        | "approved";
    createdAt: string;
    updatedAt: string;

    /* branding */
    logoUrl?: string;
    faviconUrl?: string;

    /* public addressing */
    slug?: string;
    subdomain?: string;
    customDomain?: string;

    /* opening hours */
    shopTiming?: ShopTiming;

    /* analytics & ads (Shop Settings → Analytics) */
    googleAnalyticsId?: string;
    googleAdsId?: string;
    googleAdsCheckoutLabel?: string;
    googleAdsPurchaseLabel?: string;

    /* tax, delivery & fee preferences (Shop Settings → Billing & Fees) */
    gstEnabled?: boolean;
    gstNumber?: string;
    gstRate?: number;
    gstPercentage?: number;
    deliveryFeeEnabled?: boolean;
    baseDeliveryFee?: number;
    deliveryFeePerKm?: number;
    freeDeliveryRadius?: number;
    baseDeliveryRadius?: number;
    lowCartFeeEnabled?: boolean;
    autoWhatsappEnabled?: boolean;
}

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
 * All fields optional on purpose.
 *
 * Addresses arrive from several endpoints in different shapes — some records
 * predate `houseNo`/`label`/`line1`, and the sibling Address in `./Shop.ts`
 * declares everything optional. Marking these required made otherwise-valid
 * Address objects unassignable across module boundaries. Consumers already
 * guard their reads (`addr.houseNo || ""`), so optional matches reality.
 */
export interface Address {
    area?: string;
    block?: string;
    city?: string;
    country?: string;
    houseNo?: string;
    label?: string;
    lat?: number;
    lng?: number;
    line1?: string;
    pincode?: string;
    state?: string;
    /* Older records use these names; the location settings form reads both. */
    building?: string;
    street?: string;
    locality?: string;
}

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
