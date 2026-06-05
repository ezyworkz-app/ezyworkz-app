"use server";

import { apiFetch } from "../api";

export async function verifyWhatsAppConfig(): Promise<{
  configured: boolean;
  valid?: boolean;
  phoneNumber?: string;
  error?: string;
} | null> {
  try {
    const res = await apiFetch("/api/v1/admin/whatsapp/verify");
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);
    return data.data;
  } catch (e) {
    return null;
  }
}

export async function sendWhatsAppReEngagement(): Promise<{
  sent: number;
  failed: number;
  noPhone: number;
  total: number;
  errors?: string[];
} | null> {
  try {
    const res = await apiFetch("/api/v1/admin/whatsapp/re-engagement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);
    return data.data;
  } catch (e) {
    console.error("[sendWhatsAppReEngagement]", e);
    return null;
  }
}

export async function sendWhatsAppTest(phone: string, name?: string): Promise<{ sent: number } | null> {
  try {
    const res = await apiFetch("/api/v1/admin/whatsapp/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);
    return data.data;
  } catch (e) {
    console.error("[sendWhatsAppTest]", e);
    return null;
  }
}
