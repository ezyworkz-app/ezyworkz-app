"use server";

import { apiFetch } from "../api";

export interface PromoCard {
    adId: string;
    cardType: "PROMO_CARD";
    tag: string;
    headline: string;
    subText: string;
    ctaText: string;
    route: string;
    gradientStart: string;
    gradientEnd: string;
    iconName: string;
    sortOrder: number;
    isActive: "TRUE" | "FALSE";
    createdAt: string;
    updatedAt: string;
}

export async function listPromoCards(): Promise<PromoCard[]> {
    try {
        const res = await apiFetch("/api/v1/admin/advertisements/promo-cards");
        const data = await res.json();
        return data.data || [];
    } catch (error) {
        console.error("[listPromoCards]", error);
        return [];
    }
}

export async function upsertPromoCard(
    payload: Partial<PromoCard>
): Promise<{ success: boolean; data?: PromoCard; message?: string }> {
    try {
        const method = payload.adId ? "PUT" : "POST";
        const url = payload.adId
            ? `/api/v1/admin/advertisements/promo-cards/${payload.adId}`
            : "/api/v1/admin/advertisements/promo-cards";
        const res = await apiFetch(url, {
            method,
            body: JSON.stringify(payload),
        });
        return await res.json();
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deletePromoCard(
    adId: string
): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await apiFetch(`/api/v1/admin/advertisements/promo-cards/${adId}`, {
            method: "DELETE",
        });
        return await res.json();
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
