"use server";

import { apiFetch } from "../api";

export async function getDemandList(
    limit: number = 20,
    lastKey?: string
): Promise<{ demands: any[], nextKey?: string }> {
    try {
        let url = `/api/v1/admin/demands?limit=${limit}`;
        if (lastKey) url += `&lastKey=${encodeURIComponent(lastKey)}`;
        
        const res = await apiFetch(url);
        const data = await res.json();
        
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch demands");
        }
        
        return {
            demands: data.data.demands || [],
            nextKey: data.data.nextKey
        };
    } catch (error) {
        console.error("[getDemandList]", error);
        return { demands: [], nextKey: undefined };
    }
}
