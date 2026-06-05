export type DeliveryKey = "express" | "oneDay" | "standard";

export interface DeliveryType {
    priceMultiplier: number;
    duration: string;
}
