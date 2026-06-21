export type ShopStatus =
    | "in_progress"
    | "pending_approval"
    | "approved"
    | "suspended";

export interface Shop {
    distanceKm: string;

    /* ID & auth */
    shopId: string;
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

    /* GST / Tax */
    gstEnabled?: boolean;
    gstNumber?: string;
    gstRate?: number;

    /* Domains */
    customDomain?: string;
    subdomain?: string;

    /* Assets */
    faviconUrl?: string;
    logoUrl?: string;
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
