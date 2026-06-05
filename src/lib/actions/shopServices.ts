"use server";

import { cookies } from "next/headers";
import { apiFetch } from "../api";
import { DeliveryKey, DeliveryType } from "@/types/common";
import { revalidatePath } from "next/cache";
import { GlobalCategory, GlobalService, ShopService } from "@/types/services";

type TreeViewItem = {
  id: string;
  itemName: string;
  price: number;
  inclusiveGST: boolean;
  ItemPicdata: string;
  isActive: boolean;
  description: string;
  variants?: { name: string; price: number; isActive: boolean }[]; // Added variants
};

type TreeViewCategory = {
  categoryId: string;
  globalCategoryId?: string;
  name: string;
  isActive?: boolean;
  items: TreeViewItem[];
};

export type TreeViewService = {
  serviceID: string;
  name: string;
  isActive: boolean;
  deliveryTypes: Record<DeliveryKey, DeliveryType>;
  categories: TreeViewCategory[];
  addons: any[]; // Added addons
};
export type MappedGlobalService = GlobalService & {
  mappedShopService?: ShopService & { categories?: any[] };
};

export async function getShopServicesTree(
  shopId: string
): Promise<TreeViewService[]> {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/tree-view`
    );
    const data = await res.json();
    // console.log(data);

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch shop services tree");
    }
    return data.data.services as TreeViewService[];
  } catch (error) {
    console.error("[getShopServicesTree]", error);
    return [];
  }
}
export async function createShopService(
  shopId: string,
  input: {
    globalServiceId: string; // or whatever fields API expects
    name?: string;
    deliveryTypes?: any;
  }
) {
  try {
    const res = await apiFetch(`/api/v1/admin/shops/${shopId}/services`, {
      method: "POST",
      body: JSON.stringify(input),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to create shop service");
    }

    // re-validate the services page
    revalidatePath(`/shops/${shopId}/services`);
    return data;
  } catch (err) {
    console.error("[createShopService]", err);
    throw err;
  }
}

// Create/mapping a globalCategory → shopService
export async function createShopServiceCategory(
  shopId: string,
  shopServiceId: string,
  input: {
    globalCategoryId: string;
    isActive?: boolean;
  }
) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${shopServiceId}/categories`,
      {
        method: "POST",
        body: JSON.stringify({
          shopServiceId,
          globalCategoryId: input.globalCategoryId,
          isActive: input.isActive ?? true,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to create category");
    }

    // revalidate the services page
    revalidatePath(`/shops/${shopId}/services`);
    return data;
  } catch (err) {
    console.error("[createShopServiceCategory]", err);
    throw err;
  }
}

// Edit/update a shop service category (e.g. toggle isActive)
export async function editShopServiceCategory(
  shopId: string,
  serviceId: string,
  categoryId: string,
  payload: { isActive?: boolean; name?: string }
) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${serviceId}/categories/${categoryId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update category");
    }
    revalidatePath(`/shops/${shopId}/services`);
    return data;
  } catch (err) {
    console.error("[editShopServiceCategory]", err);
    throw err;
  }
}

export async function getUnusedGlobalServices(
  shopId: string
): Promise<GlobalService[]> {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/global-unused-services`
    );
    const data = await res.json();
    // console.log(data);

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch shop services tree");
    }
    return data.data.unusedServices as GlobalService[];
  } catch (error) {
    console.error("[getShopServicesTree]", error);
    return [];
  }
}
// Create an item inside a shop-service-category
export async function createShopItem(
  shopId: string,
  shopServiceId: string,
  shopServiceCategoryId: string,
  input: {
    name: string;
    unit: "piece" | "kg" | "sft";
    pricePerPiece?: number;
    pricePerKg?: number;
    pricePerSft?: number;
    imageUrl?: string;
  }
) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${shopServiceId}/categories/${shopServiceCategoryId}/items`,
      {
        method: "POST",
        body: JSON.stringify({
          shopServiceCategoryId, // ✅ include required field
          ...input,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to create item");
    }

    // revalidate the services page
    revalidatePath(`/shops/${shopId}/services`);
    return data;
  } catch (err) {
    console.error("[createShopItem]", err);
    throw err;
  }
}

export async function getUnusedGlobalCategories(
  shopId: string,
  shopServiceId: string
): Promise<GlobalCategory[]> {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${shopServiceId}/global-unused-categories`
    );
    const data = await res.json();
    // console.log(data);

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch shop services tree");
    }
    return data.data.unusedCategories as GlobalCategory[];
  } catch (error) {
    console.error("[getShopServicesTree]", error);
    return [];
  }
}

// Edit/update an item in a shop-service-category (name, unit, price, visibility, etc.)
export async function editShopItem(
  shopId: string,
  serviceId: string,
  categoryId: string,
  itemId: string,
  updates: {
    name?: string;
    unit?: "piece" | "kg" | "sft";
    pricePerPiece?: number;
    pricePerKg?: number;
    pricePerSft?: number;
    imageUrl?: string;
    isActive?: boolean;
    description?: string;
    options?: any[];
    variants?: any[];
  }
) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${serviceId}/categories/${categoryId}/items/${itemId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          shopServiceCategoryId: categoryId, // ✅ required on server
          ...updates,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update item");
    }

    revalidatePath(`/shops/${shopId}/services`);
    return data;
  } catch (e) {
    console.error("[editShopItem]", e);
    throw e;
  }
}


export async function editShopService(
  shopId: string,
  serviceId: string,
  payload: {
    deliveryTypes: Record<
      string,
      { priceMultiplier: number; duration: string }
    >;
    isActive?: boolean;
  }
) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${serviceId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update service");
    }

    // revalidate services page
    revalidatePath(`/shops/${shopId}/services`);
    return data;
  } catch (err) {
    console.error("[editShopService]", err);
    throw err;
  }
}

/* -------------------- Delete helpers -------------------- */

/**
 * Delete a single shop item.
 * Matches: DELETE
 * /api/v1/admin/shops/:shopId/services/:serviceId/categories/:categoryId/items/:itemId
 */
export async function deleteShopItem(
  shopId: string,
  serviceId: string,
  categoryId: string,
  itemId: string
) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${serviceId}/categories/${categoryId}/items/${itemId}`,
      { method: "DELETE" }
    );

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to delete item");
    }

    // revalidate services page
    revalidatePath(`/shops/${shopId}/services`);
    return data;
  } catch (err) {
    console.error("[deleteShopItem]", err);
    throw err;
  }
}

/**
 * Delete multiple shop items in one go.
 * Matches: DELETE /.../items/bulk-delete
 * Body: { itemIds: string[] }
 */
export async function deleteMultipleShopItems(
  shopId: string,
  serviceId: string,
  categoryId: string,
  itemIds: string[]
) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${serviceId}/categories/${categoryId}/items/bulk-delete`,
      {
        method: "DELETE",
        body: JSON.stringify({ itemIds }),
      }
    );

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to delete items");
    }

    revalidatePath(`/shops/${shopId}/services`);
    return data;
  } catch (err) {
    console.error("[deleteMultipleShopItems]", err);
    throw err;
  }
}

/**
 * Delete all items belonging to a category.
 * Matches: DELETE /.../items/by-category
 */
export async function deleteItemsByCategory(
  shopId: string,
  serviceId: string,
  categoryId: string
) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${serviceId}/categories/${categoryId}/items/by-category`,
      { method: "DELETE" }
    );

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to delete items by category");
    }

    revalidatePath(`/shops/${shopId}/services`);
    return data;
  } catch (err) {
    console.error("[deleteItemsByCategory]", err);
    throw err;
  }
}

/**
 * Delete a category (and let backend cascade/delete items as needed).
 * Matches: DELETE /api/v1/admin/shops/:shopId/services/:serviceId/categories/:categoryId
 */
export async function deleteShopServiceCategory(
  shopId: string,
  serviceId: string,
  categoryId: string
) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${serviceId}/categories/${categoryId}`,
      { method: "DELETE" }
    );

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to delete category");
    }

    revalidatePath(`/shops/${shopId}/services`);
    return data;
  } catch (err) {
    console.error("[deleteShopServiceCategory]", err);
    throw err;
  }
}

/**
 * Delete an entire shop service (backend should handle cascading).
 * Matches: DELETE /api/v1/admin/shops/:shopId/services/:serviceId
 */
export async function deleteShopService(shopId: string, serviceId: string) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${serviceId}`,
      { method: "DELETE" }
    );

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to delete service");
    }

    revalidatePath(`/shops/${shopId}/services`);
    return data;
  } catch (err) {
    console.error("[deleteShopService]", err);
    throw err;
  }
}

export async function getAddonsForService(shopId: string, serviceId: string) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${serviceId}/addons?applyMarkup=true`
    );
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch addons");
    }
    return data.data.addons || [];
  } catch (err) {
    console.error("[getAddonsForService]", err);
    return [];
  }
}

/* -------------------- Price Approval Actions -------------------- */

export async function getPendingPriceUpdates() {
  try {
    const res = await apiFetch("/api/v1/admin/shops/services/pending-prices");
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch pending prices");
    }
    return data.data.items || [];
  } catch (err) {
    console.error("[getPendingPriceUpdates]", err);
    return [];
  }
}

export async function createShopAddon(
  shopId: string,
  serviceId: string,
  input: {
    globalAddonId: string;
    price: number | null;
    isActive?: boolean;
    required?: boolean;
    description?: string;
  }
) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${serviceId}/addons`,
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to create addon");
    }
    revalidatePath(`/shops/${shopId}/services`);
    return data;
  } catch (err) {
    console.error("[createShopAddon]", err);
    throw err;
  }
}

export async function editShopAddon(
  shopId: string,
  serviceId: string,
  addonId: string,
  updates: {
    price?: number | null;
    isActive?: boolean;
    required?: boolean;
    description?: string;
    variations?: { id: string; name: string; price: number }[];
  }
) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${serviceId}/addons/${addonId}`,
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      }
    );
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update addon");
    }
    revalidatePath(`/shops/${shopId}/services`);
    return data;
  } catch (err) {
    console.error("[editShopAddon]", err);
    throw err;
  }
}

export async function deleteShopAddon(
  shopId: string,
  serviceId: string,
  addonId: string
) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${serviceId}/addons/${addonId}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to delete addon");
    }
    revalidatePath(`/shops/${shopId}/services`);
    return data;
  } catch (err) {
    console.error("[deleteShopAddon]", err);
    throw err;
  }
}

export async function getUnusedGlobalAddons(shopId: string, serviceId: string) {
  try {
    const res = await apiFetch(
      `/api/v1/admin/shops/${shopId}/services/${serviceId}/global-unused-addons`
    );
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch unused addons");
    }
    return data.data.unusedAddons || [];
  } catch (err) {
    console.error("[getUnusedGlobalAddons]", err);
    return [];
  }
}

export async function approveShopItemPrice(itemId: string) {
  try {
    const res = await apiFetch(`/api/v1/admin/shops/services/items/${itemId}/approve-price`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to approve price");
    }
    revalidatePath("/(admin)/items/pending-prices", "page");
    return data;
  } catch (err) {
    console.error("[approveShopItemPrice]", err);
    throw err;
  }
}

export async function rejectShopItemPrice(itemId: string) {
  try {
    const res = await apiFetch(`/api/v1/admin/shops/services/items/${itemId}/reject-price`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to reject price");
    }
    revalidatePath("/(admin)/items/pending-prices", "page");
    return data;
  } catch (err) {
    console.error("[rejectShopItemPrice]", err);
    throw err;
  }
}

