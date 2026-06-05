"use server";
import { apiFetch } from "@/lib/api";

export async function getAuditLogs(pageParams: { limit?: number; actionType?: string; lastKey?: string } = {}) {
    try {
        const { limit = 50, actionType, lastKey } = pageParams;
        let query = `?limit=${limit}`;
        if (actionType) query += `&actionType=${encodeURIComponent(actionType)}`;
        if (lastKey) query += `&lastKey=${encodeURIComponent(lastKey)}`;

        const res = await apiFetch(`/api/v1/admin/audit/logs${query}`);
        const json = await res.json();
        return JSON.parse(JSON.stringify(json.data));
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        throw error;
    }
}

export async function getAuditStats() {
    try {
        const res = await apiFetch(`/api/v1/admin/audit/stats`);
        const json = await res.json();
        return JSON.parse(JSON.stringify(json.data));
    } catch (error) {
        console.error("Failed to fetch audit stats:", error);
        throw error;
    }
}
