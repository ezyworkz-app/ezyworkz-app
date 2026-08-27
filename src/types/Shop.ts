/**
 * Superset of both status vocabularies in use.
 *
 * The BACKEND writes: pending_approval | active | suspended | rejected |
 * inactive (see shop.model.ts). Older web code additionally compares against
 * `in_progress` and `approved`, so both sets are kept until the vocabularies
 * are reconciled — narrowing this makes otherwise-valid Shop objects
 * unassignable.
 */
export type ShopStatus =
    | "pending_approval"
    | "active"
    | "suspended"
    | "rejected"
    | "inactive"
    | "in_progress"
    | "approved";

/**
 * The single Shop type for this app.
 *
 * `types/index.ts` used to declare a second, near-identical Shop, and the two
 * drifted — adding one field meant editing both, and missing one produced a
 * type error in whichever half was forgotten. `index.ts` now re-exports this.
 */
export interface Shop {
    /** Only present on results from proximity search. */
    distanceKm?: string;

    /* ID & auth */
    shopId: string;
    /**
     * Optional: not every endpoint returns it (e.g. getAllShops), and nothing
     * reads it off a Shop — `shopOwnerId` is consumed from the auth
     * `shopOwner` object instead.
     */
    shopOwnerId?: string;
    /** Legacy alias for `logoUrl`, still returned by some endpoints. */
    logo?: string;
    shopAuthId: string;

    /* public profile */
    name: string;
    slug?: string; // ← empty until we store address
    imageUrl?: string;
    phone?: string;
    alternatePhone?: string;
    email: string;
    description?: string;
    citySlug?: string;

    /* location (set in step 2) */
    address?: Address;
    geoHash?: string;
    hashKey?: string;

    /* shop timing and availability */
    shopTiming?: ShopTiming;
    isOpen?: boolean; // ✅ Manual toggle to instantly pause/resume receiving orders
    offDates?: string[]; // ✅ ["2025-08-15", "2025-12-25"] – full-day closures
    manualClosureReason?: string; // 📝 Optional message for why shop is closed (festival, renovation, etc.)

    /* metadata */
    status: ShopStatus;
    createdAt: string;
    updatedAt: string;
    totalOrders?: number;
    cancelledOrders?: number;
    financeConfig?: FinanceConfig;
    financeHistory?: FinanceConfig[];

    /* GST / Tax / Delivery Preferences */
    gstEnabled?: boolean;
    gstNumber?: string;
    gstRate?: number;
    gstPercentage?: number;
    deliveryFeeEnabled?: boolean;
    baseDeliveryFee?: number;
    freeDeliveryRadius?: number;
    baseDeliveryRadius?: number;
    deliveryFeePerKm?: number;
    lowCartFeeEnabled?: boolean;
    autoWhatsappEnabled?: boolean;
    /** Auto-open the bag-tag print dialog as soon as an order is created. */
    autoPrintEnabled?: boolean;

    /* Domains */
    customDomain?: string;
    subdomain?: string;

    /* Assets */
    faviconUrl?: string;
    logoUrl?: string;

    /* Tracking */
    googleAnalyticsId?: string;
    googleAdsId?: string;
    googleAdsCheckoutLabel?: string;
    googleAdsPurchaseLabel?: string;
}

export interface CommissionHistoryEntry {
    rate: number;
    from: string;   // ISO date e.g. "2025-10-01"
    until?: string; // ISO date — open-ended if omitted (current period)
    note?: string;
}

export interface FinanceConfig {
    commissionPercentage: number;
    expressExtraPayoutPercentage: number;
    oneDayExtraPayoutPercentage: number;
    commissionHistory?: CommissionHistoryEntry[];
    updatedAt: string;
}

export interface BankDetails {
    accountHolderName: string;
    bankAccountNumber: string;
    bankIfscCode: string;
    bankName: string;
    bankBranch: string;
    cancelledChequeUrl?: string;
}

export interface PanDetails {
    panCardNumber: string;
    panCardImageUrl: string;
}

export interface GstDetails {
    gstNumber: string;
    gstCertificateUrl: string;
}

export interface UpiDetails {
    upiId: string;
    upiQrCodeUrl: string;
}

export interface ShopKyc {
    shopId: string;
    panDetails?: PanDetails;
    bankDetails?: BankDetails;
    gstDetails?: GstDetails;
    upiDetails?: UpiDetails;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * All fields optional on purpose.
 *
 * Addresses arrive from several endpoints in different shapes — some records
 * predate `houseNo`/`label`/`line1`, others use `building`/`street`/`locality`.
 * Marking any of them required made otherwise-valid Address objects
 * unassignable across module boundaries, and consumers already guard their
 * reads (`addr.houseNo || ""`), so optional matches reality.
 *
 * This is the union of every shape in use; `types/index.ts` re-exports it
 * rather than declaring a second one.
 */
export interface Address {
    street?: string;
    area?: string;
    locality?: string;
    pincode?: string;
    city?: string;
    state?: string;
    country?: string;
    lat?: number;
    lng?: number;
    /* Newer records */
    houseNo?: string;
    label?: string;
    line1?: string;
    block?: string;
    /* Older records; the location settings form reads both spellings. */
    building?: string;
}

export interface ShopTiming {
    [day: string]: {
        working: boolean; // true = day is ON, false = closed
        slots: {
            open: string; // "HH:mm"
            close: string; // "HH:mm"
        }[];
    };
}
