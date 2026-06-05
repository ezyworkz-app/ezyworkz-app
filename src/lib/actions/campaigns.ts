"use server";

import { apiFetch } from "../api";

export interface Campaign {
    campaignId: string;
    couponCode: string;
    offerId: string;
    segment: "ALL" | "FIRST_TIME" | "INACTIVE_ONE_TIME" | "INACTIVE_FREQUENT";
    discountType: "FIXED" | "PERCENTAGE";
    discountValue: number;
    minOrderValue?: number;
    validDays: number;
    expiresAt: string;
    usersTargeted: number;
    tokensSent: number;
    skippedNoToken: number;
    failedCount: number;
    tappedCount: number;
    redeemedCount: number;
    status: "active" | "expired";
    sentAt: string;
    createdAt: string;
}

export async function listCampaigns(): Promise<Campaign[]> {
    try {
        const res = await apiFetch("/api/v1/admin/campaigns");
        const data = await res.json();
        return data.campaigns || [];
    } catch (error) {
        console.error("[listCampaigns]", error);
        return [];
    }
}

export async function getCampaign(campaignId: string): Promise<Campaign | null> {
    try {
        const res = await apiFetch(`/api/v1/admin/campaigns/${campaignId}`);
        const data = await res.json();
        return data.campaign || null;
    } catch (error) {
        console.error("[getCampaign]", error);
        return null;
    }
}

export interface DeviceStats {
    totalTokens: number;
    usersWithToken: number;
    usersWithoutToken: number;
    multiDeviceUsers: number;
    freshTokens: number;
    recentTokens: number;
    staleTokens: number;
    unknownTokens: number;
    segments: {
        firstTime: number;
        inactiveOneTime: number;
        inactiveFrequent: number;
        active: number;
    };
    scannedAt: string;
}

export async function getDeviceStats(): Promise<DeviceStats | null> {
    try {
        const res = await apiFetch("/api/v1/admin/campaigns/device-stats");
        const data = await res.json();
        return data.stats || null;
    } catch (error) {
        console.error("[getDeviceStats]", error);
        return null;
    }
}

export async function launchCampaign(payload: {
    segment: string;
    discountType: "FIXED" | "PERCENTAGE";
    discountValue: number;
    minOrderValue?: number;
    validDays?: number;
}): Promise<{ success: boolean; campaignId?: string; couponCode?: string; usersTargeted?: number; tokensSent?: number; message?: string }> {
    try {
        const res = await apiFetch("/api/v1/admin/campaigns/convert", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        return data;
    } catch (error: any) {
        console.error("[launchCampaign]", error);
        return { success: false, message: error.message };
    }
}
