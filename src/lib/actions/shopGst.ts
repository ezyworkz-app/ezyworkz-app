"use server";

import { apiFetch } from "../api";

export interface ShopGstPayload {
    gstEnabled: boolean;
    gstNumber?: string;
    gstRate?: number;
}

export async function updateShopGst(
    shopId: string,
    payload: ShopGstPayload
): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
        const res = await apiFetch(`/api/v1/admin/shops/${shopId}/gst`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
        return await res.json();
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
