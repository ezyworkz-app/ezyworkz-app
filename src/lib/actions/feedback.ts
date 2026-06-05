"use server";

import { apiFetch } from "../api";

export async function getFeedbackList(
    limit: number = 20,
    lastKey?: string
): Promise<{ feedback: any[], nextKey?: string }> {
    try {
        let url = `/api/v1/admin/feedback?limit=${limit}`;
        if (lastKey) url += `&lastKey=${encodeURIComponent(lastKey)}`;
        
        const res = await apiFetch(url);
        const data = await res.json();
        
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch feedback");
        }
        
        return {
            feedback: data.data.feedback || [],
            nextKey: data.data.nextKey
        };
    } catch (error) {
        console.error("[getFeedbackList]", error);
        return { feedback: [], nextKey: undefined };
    }
}
