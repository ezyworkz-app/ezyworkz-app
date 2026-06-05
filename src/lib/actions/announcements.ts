"use server";

import { apiFetch } from "../api";

export type AnnouncementType = "delay" | "surge" | "offer" | "info";

export interface Announcement {
    announcementId: string;
    type: AnnouncementType;
    title: string;
    message: string;
    isActive: "TRUE" | "FALSE";
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
}

export async function listAnnouncements(): Promise<Announcement[]> {
    try {
        const res = await apiFetch("/api/v1/admin/announcements");
        const data = await res.json();
        return data.data || [];
    } catch (error) {
        console.error("[listAnnouncements]", error);
        return [];
    }
}

export async function createAnnouncement(payload: {
    type: AnnouncementType;
    title: string;
    message: string;
    isActive: "TRUE" | "FALSE";
    expiresAt?: string;
}): Promise<{ success: boolean; data?: Announcement; message?: string }> {
    try {
        const res = await apiFetch("/api/v1/admin/announcements", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        return await res.json();
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateAnnouncement(
    announcementId: string,
    payload: Partial<Omit<Announcement, "announcementId" | "createdAt" | "updatedAt">>
): Promise<{ success: boolean; data?: Announcement; message?: string }> {
    try {
        const res = await apiFetch(`/api/v1/admin/announcements/${announcementId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
        return await res.json();
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteAnnouncement(
    announcementId: string
): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await apiFetch(`/api/v1/admin/announcements/${announcementId}`, {
            method: "DELETE",
        });
        return await res.json();
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
