"use server";

import { cookies } from "next/headers";
import { apiFetch } from "../api";
import { revalidatePath } from "next/cache";

export interface AdminOffer {
    offerId: string;
    shopId: string;
    code: string;
    title: string;
    description?: string;
    type: "PERCENTAGE" | "FIXED";
    subType: string;
    templateType: string;
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderValue?: number;
    applicableScope: string;
    applicableIds?: string[];
    targetAudience: string;
    daysOfWeek?: number[];
    startDate: string;
    endDate: string;
    isActive: boolean;
    fundedBy?: "SHOP" | "PLATFORM";
    currentUsageCount?: number;
    usageLimit?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateOfferPayload {
    templateType: string;
    type: "PERCENTAGE" | "FIXED";
    subType: string;
    discountValue: number;
    minOrderValue?: number;
    maxDiscountAmount?: number;
    applicableScope?: string;
    targetAudience: string;
    daysOfWeek?: number[];
    startDate: string;
    endDate: string;
    isActive?: boolean;
    fundedBy?: "SHOP" | "PLATFORM";
    code?: string;
    title?: string;
}

export async function getShopOffers(shopId: string): Promise<AdminOffer[]> {
    try {
        const res = await apiFetch(`/api/v1/admin/shops/${shopId}/offers`);
        const data = await res.json();
        return (data?.data || []) as AdminOffer[];
    } catch (error) {
        console.error("[getShopOffers]", error);
        return [];
    }
}

export async function createShopOffer(
    shopId: string,
    payload: CreateOfferPayload
): Promise<{ success: boolean; data?: AdminOffer; error?: string }> {
    try {
        const res = await apiFetch(`/api/v1/admin/shops/${shopId}/offers`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        revalidatePath(`/shops/${shopId}/offers`);
        return { success: true, data: data?.data };
    } catch (error: any) {
        console.error("[createShopOffer]", error);
        return { success: false, error: error.message };
    }
}

export async function stopShopOffer(
    shopId: string,
    offerId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await apiFetch(`/api/v1/admin/shops/${shopId}/offers/${offerId}/stop`, {
            method: "PUT",
            body: JSON.stringify({}),
        });
        revalidatePath(`/shops/${shopId}/offers`);
        return { success: true };
    } catch (error: any) {
        console.error("[stopShopOffer]", error);
        return { success: false, error: error.message };
    }
}

export async function updateShopOffer(
    shopId: string,
    offerId: string,
    updates: Partial<AdminOffer>
): Promise<{ success: boolean; data?: AdminOffer; error?: string }> {
    try {
        const res = await apiFetch(`/api/v1/admin/shops/${shopId}/offers/${offerId}`, {
            method: "PUT",
            body: JSON.stringify(updates),
        });
        const data = await res.json();
        revalidatePath(`/shops/${shopId}/offers`);
        return { success: true, data: data?.data };
    } catch (error: any) {
        console.error("[updateShopOffer]", error);
        return { success: false, error: error.message };
    }
}
