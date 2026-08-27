export type DeliveryKey = "express" | "oneDay" | "standard";

export interface DeliveryType {
    priceMultiplier: number;
    duration: string;
    /**
     * Whether the shop offers this tier. Absent means enabled, so tiers saved
     * before the toggle existed keep working.
     */
    enabled?: boolean;
    /** Maximum orders per day for this tier, if the shop caps it. */
    dailyLimit?: number;
}
