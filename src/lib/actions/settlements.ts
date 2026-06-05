"use server";

import { cookies } from "next/headers";
import { apiFetch } from "../api";
import { revalidatePath } from "next/cache";
import { ShopSettlement } from "@/types/shop-settlement";

export async function getUnpaidSettlementsForShop(shopId: string) {
  return getSettlementsForShop(shopId, "unpaid");
}

export async function getSettlementsForShop(shopId: string, status: string = "unpaid") {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/admin/orders/settlements/${status}/${shopId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || `Failed to fetch ${status} settlements`);
    }

    return { success: true, data: data.data as ShopSettlement[] };
  } catch (error: any) {
    console.error("[getSettlementsForShop]", error);
    return { success: false, error: error.message };
  }
}

export async function settleBulk(shopSettlementIds: string[], shopId: string) {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/admin/orders/settlements/bulk`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ shopSettlementIds }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to settle shop payouts");
    }

    revalidatePath(`/shops/${shopId}/details`);
    return { success: true, data: data.data };
  } catch (error: any) {
    console.error("[settleBulk]", error);
    return { success: false, error: error.message };
  }
}

export async function backfillSettlements(shopId: string) {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/admin/orders/settlements/backfill/${shopId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to sync settlements");
    }

    revalidatePath(`/shops/${shopId}/details`);
    return { success: true, count: data.data.createdCount };
  } catch (error: any) {
    console.error("[backfillSettlements]", error);
    return { success: false, error: error.message };
  }
}

export async function syncSettlementAmountsFromOrders(shopId: string) {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/admin/orders/settlements/sync-amounts/${shopId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to sync settlement amounts");
    }

    revalidatePath(`/shops/${shopId}/details`);
    return { success: true, updatedCount: data.data.updatedCount };
  } catch (error: any) {
    console.error("[syncSettlementAmountsFromOrders]", error);
    return { success: false, error: error.message };
  }
}

export async function revertBulkSettlements(shopSettlementIds: string[], shopId: string) {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/admin/orders/settlements/revert-bulk`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ shopSettlementIds }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to revert settlements");
    }

    revalidatePath(`/shops/${shopId}/details`);
    return { success: true, data: data.data };
  } catch (error: any) {
    console.error("[revertBulkSettlements]", error);
    return { success: false, error: error.message };
  }
}

export async function updateSettlementGrossAmount(shopSettlementId: string, manualGrossAmount: number, shopId: string) {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/admin/orders/settlements/${shopSettlementId}`, {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ manualGrossAmount }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update settlement");
    }

    revalidatePath(`/shops/${shopId}/details`);
    return { success: true, data: data.data as ShopSettlement };
  } catch (error: any) {
    console.error("[updateSettlementGrossAmount]", error);
    return { success: false, error: error.message };
  }
}

export async function purgeOrphanedSettlements() {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/admin/orders/settlements/purge-orphaned`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to purge orphaned settlements");
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    console.error("[purgeOrphanedSettlements]", error);
    return { success: false, error: error.message };
  }
}

export async function updateSettlementLogisticsCost(shopSettlementId: string, manualLogisticsCost: number, shopId: string) {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/admin/orders/settlements/${shopSettlementId}`, {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ manualLogisticsCost }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update logistics cost");
    }

    revalidatePath(`/shops/${shopId}/details`);
    return { success: true, data: data.data as ShopSettlement };
  } catch (error: any) {
    console.error("[updateSettlementLogisticsCost]", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBulkSettlements(shopSettlementIds: string[], shopId: string) {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/admin/orders/settlements/delete-bulk`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ shopSettlementIds }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to delete selected settlements");
    }

    revalidatePath(`/shops/${shopId}/details`);
    return { success: true, data: data.data };
  } catch (error: any) {
    console.error("[deleteBulkSettlements]", error);
    return { success: false, error: error.message };
  }
}
