"use server";

import { apiFetch } from "../api";

export interface DailyNotifConfig {
    enabled: boolean;
    sendHour: number;
    sendMinute: number;
    lastSentDate?: string;
}

export async function getDailyNotifConfig(): Promise<DailyNotifConfig | null> {
    try {
        const res  = await apiFetch("/api/v1/admin/daily-notification");
        const data = await res.json();
        return data.config ?? null;
    } catch (err) {
        console.error("[getDailyNotifConfig]", err);
        return null;
    }
}

export async function saveDailyNotifConfig(
    updates: Partial<DailyNotifConfig>
): Promise<{ success: boolean; config?: DailyNotifConfig; message?: string }> {
    try {
        const res  = await apiFetch("/api/v1/admin/daily-notification", {
            method: "PUT",
            body:   JSON.stringify(updates),
        });
        const data = await res.json();
        return data;
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}

export async function sendDailyNotifNow(): Promise<{
    success: boolean;
    sent?: number;
    skipped?: number;
    message?: string;
}> {
    try {
        const res  = await apiFetch("/api/v1/admin/daily-notification/send-now", { method: "POST" });
        const data = await res.json();
        return data;
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}
