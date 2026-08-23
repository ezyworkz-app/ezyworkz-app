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

// ─── Shop-Level Multi-Tenant WhatsApp Actions ───────────────────────────────

export async function getShopWhatsAppConfigAction(shopId: string) {
  try {
    const res = await apiFetch(`/api/v1/shops/${shopId}/whatsapp-config`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);
    return data.data;
  } catch (e) {
    console.error("[getShopWhatsAppConfigAction]", e);
    return null;
  }
}

export async function updateShopWhatsAppConfigAction(shopId: string, payload: {
  enabled: boolean;
  mode: "platform" | "custom";
  phoneNumberId?: string;
  accessToken?: string;
  statuses?: string[];
}) {
  try {
    const res = await apiFetch(`/api/v1/shops/${shopId}/whatsapp-config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);
    return data.data;
  } catch (e: any) {
    console.error("[updateShopWhatsAppConfigAction]", e);
    return { error: e.message || "Failed to update configuration" };
  }
}

export async function testShopWhatsAppConfigAction(shopId: string, phone: string, name?: string) {
  try {
    const res = await apiFetch(`/api/v1/shops/${shopId}/whatsapp-config/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);
    return { success: true, data: data.data };
  } catch (e: any) {
    console.error("[testShopWhatsAppConfigAction]", e);
    return { success: false, error: e.message || "Test message failed" };
  }
}

export async function requestDedicatedNumberAction(shopId: string, phone: string, displayName: string) {
  try {
    const res = await apiFetch(`/api/v1/shops/${shopId}/whatsapp-config/request-number`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, displayName }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);
    return { success: true, data: data.data, message: data.message };
  } catch (e: any) {
    console.error("[requestDedicatedNumberAction]", e);
    return { success: false, error: e.message || "Failed to submit request" };
  }
}

export async function handleWhatsAppOAuthAction(
  shopId: string,
  code: string,
  session: { phoneNumberId?: string; wabaId?: string; businessId?: string } = {}
) {
  try {
    const res = await apiFetch(`/api/v1/shops/${shopId}/whatsapp-config/oauth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        phoneNumberId: session.phoneNumberId,
        wabaId: session.wabaId,
        businessId: session.businessId,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || data.error);
    return { success: true, data: data };
  } catch (e: any) {
    console.error("[handleWhatsAppOAuthAction]", e);
    return { success: false, error: e.message || "Failed to authenticate WhatsApp account" };
  }
}
