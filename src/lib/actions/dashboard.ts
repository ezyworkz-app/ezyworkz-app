"use server";
import { apiFetch } from "@/lib/api";

interface StatsOptions {
    range?: string;
    startDate?: string;
    endDate?: string;
}

export async function getDashboardStats(rangeOrOptions?: string | StatsOptions) {
    try {
        let query = "";

        if (typeof rangeOrOptions === "string") {
            query = `?range=${encodeURIComponent(rangeOrOptions)}`;
        } else if (rangeOrOptions?.startDate && rangeOrOptions?.endDate) {
            query = `?startDate=${encodeURIComponent(rangeOrOptions.startDate)}&endDate=${encodeURIComponent(rangeOrOptions.endDate)}`;
        } else if (rangeOrOptions?.range) {
            query = `?range=${encodeURIComponent(rangeOrOptions.range)}`;
        }

        const res = await apiFetch(`/api/v1/admin/dashboard/stats${query}`);
        const json = await res.json();

        // Return a plain object (POJO) to ensure serialization
        return JSON.parse(JSON.stringify(json.data));
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        throw error;
    }
}

export async function getCampaignPerformance(startDate: string, endDate: string) {
    try {
        const res = await apiFetch(`/api/v1/admin/dashboard/stats/campaigns?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
        const json = await res.json();
        return JSON.parse(JSON.stringify(json.data?.campaigns || []));
    } catch (error) {
        console.error("Failed to fetch campaign performance:", error);
        throw error;
    }
}

export async function getUserStats(userId: string) {
    try {
        const res = await apiFetch(`/api/v1/admin/dashboard/users/${userId}/stats`);
        const json = await res.json();
        return JSON.parse(JSON.stringify(json.data));
    } catch (error) {
        console.error(`Failed to fetch stats for user ${userId}:`, error);
        throw error;
    }
}
