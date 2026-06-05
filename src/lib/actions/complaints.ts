"use server";

import { apiFetch } from "../api";

export async function getComplaintsList(): Promise<{ complaints: any[] }> {
    try {
        const url = `/api/v1/admin/complaints`;
        const res = await apiFetch(url);
        const data = await res.json();
        
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch complaints");
        }
        
        return {
            complaints: data.data || [],
        };
    } catch (error) {
        console.error("[getComplaintsList]", error);
        return { complaints: [] };
    }
}

export async function getComplaintDetails(complaintId: string): Promise<{ complaint: any | null }> {
    try {
        const url = `/api/v1/admin/complaints/${complaintId}`;
        const res = await apiFetch(url);
        const data = await res.json();
        
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch complaint details");
        }
        
        return {
            complaint: data.data || null,
        };
    } catch (error) {
        console.error("[getComplaintDetails]", error);
        return { complaint: null };
    }
}
