"use server";

import { apiFetch } from "../api";

export interface ManagerMember {
  managerId: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  joinedAt?: string;
}

export async function getShopManagersAction(shopId: string): Promise<ManagerMember[]> {
  try {
    const res = await apiFetch(`/api/v1/shops/${shopId}/managers`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);
    return (data.data || []) as ManagerMember[];
  } catch (e: any) {
    console.error("[getShopManagersAction]", e);
    return [];
  }
}

export async function createShopManagerAction(
  shopId: string,
  payload: { name: string; email: string; password?: string; phone?: string; role?: "manager" | "staff" }
) {
  try {
    const res = await apiFetch(`/api/v1/shops/${shopId}/managers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to create manager");
    return { success: true, data: data.data };
  } catch (e: any) {
    console.error("[createShopManagerAction]", e);
    return { success: false, error: e.message || "Failed to create manager" };
  }
}

export async function deleteShopManagerAction(shopId: string, managerId: string) {
  try {
    const res = await apiFetch(`/api/v1/shops/${shopId}/managers/${managerId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to remove manager");
    return { success: true, message: data.message };
  } catch (e: any) {
    console.error("[deleteShopManagerAction]", e);
    return { success: false, error: e.message || "Failed to remove manager" };
  }
}
