"use server";

import { apiFetch } from "../api";

export interface AbandonedCheckoutUser {
  userId: string;
  name?: string;
  phoneNumber?: string;
  shopId?: string;
  cartValue: number;
  abandonedAt: string;
  minutesAgo: number;
  hasToken: boolean;
}

export async function getAbandonedCheckouts(windowHours = 24): Promise<{
  users: AbandonedCheckoutUser[];
  total: number;
  windowHours: number;
}> {
  try {
    const res = await apiFetch(
      `/api/v1/admin/notifications/abandoned-checkout?windowHours=${windowHours}`
    );
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch");
    return data.data;
  } catch (error) {
    console.error("[getAbandonedCheckouts]", error);
    return { users: [], total: 0, windowHours };
  }
}

export async function fetchPosthogAbandonedUsers(): Promise<{
  users: CsvRow[];
  total: number;
} | null> {
  try {
    const res = await apiFetch(`/api/v1/admin/notifications/re-engagement/posthog`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed");
    return data.data;
  } catch (error) {
    console.error("[fetchPosthogAbandonedUsers]", error);
    return null;
  }
}

export async function sendPosthogReEngagement(): Promise<{
  sent: number; skipped: number; failed: number; noToken: number; total: number;
} | null> {
  try {
    const res = await apiFetch("/api/v1/admin/notifications/re-engagement/posthog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed");
    return data.data;
  } catch (error) {
    console.error("[sendPosthogReEngagement]", error);
    return null;
  }
}

export interface CsvRow {
  userId: string;
  name?: string;
  shopId?: string;
  cartValue?: number;
  lastCheckout?: string;
}

export async function sendCsvReEngagement(users: CsvRow[]): Promise<{
  sent: number;
  skipped: number;
  failed: number;
  noToken: number;
} | null> {
  try {
    const res = await apiFetch("/api/v1/admin/notifications/re-engagement/csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed");
    return data.data;
  } catch (error) {
    console.error("[sendCsvReEngagement]", error);
    return null;
  }
}

export async function triggerReEngagementSweep(): Promise<{ message: string } | null> {
  try {
    const res = await apiFetch("/api/v1/admin/notifications/re-engagement/trigger", {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to trigger");
    return { message: data.message };
  } catch (error) {
    console.error("[triggerReEngagementSweep]", error);
    return null;
  }
}

export async function notifyAbandonedCheckoutUsers(payload: {
  userIds?: string[];
  title: string;
  body: string;
  windowHours?: number;
}): Promise<{ sent: number; skipped: number; failed: number } | null> {
  try {
    const res = await apiFetch("/api/v1/admin/notifications/abandoned-checkout/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to send");
    return data.data;
  } catch (error) {
    console.error("[notifyAbandonedCheckoutUsers]", error);
    return null;
  }
}
