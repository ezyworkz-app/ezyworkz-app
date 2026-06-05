import type { DeliveryKey, DeliveryType } from "./common";

export interface ShopService {
  shopServiceId: string;
  name: string;
  shopId: string;
  isActive?: boolean;
  deliveryTypes: Record<DeliveryKey, DeliveryType>;
  categories?: ShopCategory[];
}

export interface ShopCategory {
  shopServiceCategoryId: string;
  name: string;
  isActive?: boolean;
  items: ShopItem[];
}

export interface ShopItemOption {
  name: string;
  values: string[];
}

export interface ShopItemVariant {
  variantId: string;
  name: string;
  price: number;
  isActive: boolean;
  unit?: "piece" | "kg" | "sft";
}

export interface ShopItem {
  shopServiceCategoryItemId: string;
  name: string;
  description?: string;
  unit: "piece" | "kg" | "sft";
  imageUrl?: string;
  isActive?: boolean;
  options?: ShopItemOption[];
  variants?: ShopItemVariant[];
  // Legacy fields kept for compatibility if needed, but should ideally migrate away
  pricePerPiece?: number;
  pricePerKg?: number;
  pricePerSft?: number;
  priceStatus?: "approved" | "pending";
  pendingPriceUpdate?: {
    pricePerPiece?: number;
    pricePerKg?: number;
    pricePerSft?: number;
    variants?: ShopItemVariant[];
    requestedAt: string;
  };
}

export interface Addon {
  shopAddonId: string;
  name: string;
  price: number;
}
