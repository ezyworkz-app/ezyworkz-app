"use server";

import { User } from "../../types/user";
import { apiFetch } from "../api";

export async function getAllUsers(
    limit: number = 10,
    lastKey?: string,
    search?: string,
    walletFilter?: string,
    referralFilter?: string,
    sortField?: string,
    sortOrder?: string
): Promise<{ users: User[], nextKey?: string, totalCount: number, referredCount: number }> {
    try {
        let url = `/api/v1/admin/users?limit=${limit}`;
        if (lastKey) url += `&lastKey=${encodeURIComponent(lastKey)}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (walletFilter && walletFilter !== "all") url += `&walletFilter=${encodeURIComponent(walletFilter)}`;
        if (referralFilter && referralFilter !== "all") url += `&referralFilter=${encodeURIComponent(referralFilter)}`;
        if (sortField) url += `&sortField=${encodeURIComponent(sortField)}`;
        if (sortOrder) url += `&sortOrder=${encodeURIComponent(sortOrder)}`;
        
        const res = await apiFetch(url);
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch users");
        }
        return {
            users: data.data.users || [],
            nextKey: data.data.nextKey,
            totalCount: data.data.totalCount || 0,
            referredCount: data.data.referredCount || 0,
        };
    } catch (error) {
        console.error("[getAllUsers]", error);
        return { users: [], nextKey: undefined, totalCount: 0, referredCount: 0 };
    }
}

export async function getUserLocationClusters(): Promise<{ lat: number; lng: number; count: number; areaName?: string }[]> {
    try {
        const res = await apiFetch("/api/v1/admin/users/location-clusters");
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed");
        return data.data || [];
    } catch (error) {
        console.error("[getUserLocationClusters]", error);
        return [];
    }
}

export async function getUserAddresses(userId: string): Promise<any[]> {
    try {
        const res = await apiFetch(`/api/v1/admin/users/${userId}/addresses`);
        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch user addresses");
        }

        return data.data.addresses || [];
    } catch (error) {
        console.error("[getUserAddresses]", error);
        throw error;
    }
}

export async function getSegmentedUsers(
    page: number = 1, 
    limit: number = 10,
    search?: string,
    segment?: string,
    sortBy?: string,
    sortDir?: string
): Promise<{ users: any[], total: number, page: number, limit: number }> {
    try {
        let url = `/api/v1/admin/segmented-users?page=${page}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (segment) url += `&segment=${encodeURIComponent(segment)}`;
        if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`;
        if (sortDir) url += `&sortDir=${encodeURIComponent(sortDir)}`;
        
        const res = await apiFetch(url);
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch segmented users");
        }
        return {
            users: data.users || [],
            total: data.total || 0,
            page: data.page || 1,
            limit: data.limit || 10
        };
    } catch (error) {
        console.error("[getSegmentedUsers]", error);
        return { users: [], total: 0, page, limit };
    }
}

export async function sendCouponToUser(payload: {
    userId: string;
    couponCode: string;
    title: string;
    body: string;
}): Promise<any> {
    try {
        const res = await apiFetch("/api/v1/admin/segmented-users/send-coupon", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to send coupon");
        }
        return data;
    } catch (error) {
        console.error("[sendCouponToUser]", error);
        throw error;
    }
}
