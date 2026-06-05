export interface User {
    expoPushToken: string;
    pushToken?: string;
    expoPushTokens?: string[];
    status: string;
    role: string;
    location:
    | string
    | {
        lat: number;
        lng: number;
    };
    userId: string;
    name: string;
    email: string;
    phoneNumber: string;
    createdAt: string;
    // role: "admin" | "editor" | "viewer";
    // status: "active" | "inactive";
    lat: number;
    lng: number;
    // Referral & Wallet
    referralCode?: string;      // Unique code for this user
    referredBy?: string;        // Code of the user who referred this user
    walletBalance?: number;     // Current wallet balance
    referralCount?: number;     // Number of successful referrals (max 5)
    isFirstOrder?: boolean;     // True until they complete their first order
    orderCount?: number;        // Total successful orders
    lastOrderDate?: string | null; // ISO date of most recent non-cancelled order
    areaName?: string;          // Persisted reverse-geocoded area label
}

export type UserSegment = "FIRST_TIME" | "INACTIVE_ONE_TIME" | "INACTIVE_FREQUENT";

export interface SegmentedUser extends User {
    segment: UserSegment;
    orderCount: number;
    lastOrderDate?: string;
    daysSinceLastOrder?: number;
    whatsappUrl: string;
}

export interface Metric {
    id: string;
    title: string;
    value: number | string;
    change: number;
    trend: "up" | "down" | "neutral";
    icon: string;
}

export interface NavItem {
    title: string;
    icon: string;
    path: string;
    children?: Omit<NavItem, "children">[];
}
