// types/services.ts
export interface ShopItem {
  shopServiceCategoryItemId: string;
  shopServiceCategoryId: string;
  name: string;
  unit: "piece" | "kg" | "sft";
  pricePerPiece?: number;
  pricePerKg?: number;
  pricePerSft?: number;
  imageUrl?: string;
  priceStatus?: "approved" | "pending";
  pendingPriceUpdate?: {
    pricePerPiece?: number;
    pricePerKg?: number;
    pricePerSft?: number;
    requestedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}
export type DeliveryType = "standard" | "oneDay" | "express";

export interface DeliveryTypeDetail {
  priceMultiplier: number;
  duration: string;
}

export interface GlobalService {
  globalServiceId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalCategory {
  shopServiceCategoryId?: string | null | undefined;
  globalCategoryId: string;
  name: string;
  iconUrl?: string;
  items?: ShopItem[];
}

export interface ShopService {
  shopServiceId: string;
  name?: string;
  shopId: string;
  globalServiceId: string;
  deliveryTypes: Record<DeliveryType, DeliveryTypeDetail>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categories?: GlobalCategory[]; // <- Add this (optional)
}
// export interface ShopServiceCategory {
//   shopServiceCategoryId: string;
//   shopServiceId: string;
//   globalCategoryId: string;
//   isActive: boolean;
//   createdAt: string;
//   updatedAt: string;
//   items?: any[]; // optionally type your ShopItem here
// }
export interface ShopServiceCategory extends GlobalCategory {
  shopServiceCategoryId: string;
  items?: ShopItem[];
}
