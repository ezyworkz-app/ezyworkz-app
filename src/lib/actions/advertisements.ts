"use server";

import { apiFetch } from "../api";

export interface Advertisement {
    adId: string;
    brandName: string;
    iconUrl: string;
    targetUrl?: string;
    backgroundColor?: string;
    isActive: "TRUE" | "FALSE";
    createdAt: string;
    updatedAt: string;
}

export async function listAdvertisements(): Promise<Advertisement[]> {
    try {
        const res = await apiFetch("/api/v1/admin/advertisements");
        const data = await res.json();
        return data.data || [];
    } catch (error) {
        console.error("[listAdvertisements]", error);
        return [];
    }
}

export async function upsertAdvertisement(
    payload: Partial<Advertisement>
): Promise<{ success: boolean; data?: Advertisement; message?: string }> {
    try {
        const method = payload.adId ? "PUT" : "POST";
        const url = payload.adId
            ? `/api/v1/admin/advertisements/${payload.adId}`
            : "/api/v1/admin/advertisements";
        const res = await apiFetch(url, {
            method,
            body: JSON.stringify(payload),
        });
        return await res.json();
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteAdvertisement(
    adId: string
): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await apiFetch(`/api/v1/admin/advertisements/${adId}`, {
            method: "DELETE",
        });
        return await res.json();
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
