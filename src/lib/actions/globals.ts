"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "../api";

/* -------------------------------------------------------------------------- */
/*                               GLOBAL SERVICES                              */
/* -------------------------------------------------------------------------- */

export async function getGlobalServices() {
    try {
        const res = await apiFetch("/api/v1/global/services");
        if (!res.ok) return [];
        const data = await res.json();
        // Backend returns: { success: true, data: { gservices: [...] } }
        return data.data?.gservices || [];
    } catch (error) {
        console.error("[getGlobalServices]", error);
        return [];
    }
}

export async function createGlobalService(name: string) {
    try {
        const res = await apiFetch("/api/v1/global/services/global-services", {
            method: "POST",
            body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to create global service");
        }
        revalidatePath("/globals/services");
        // Backend returns: { success: true, data: newService }
        return data.data;
    } catch (err) {
        console.error("[createGlobalService]", err);
        throw err;
    }
}

/* -------------------------------------------------------------------------- */
/*                              GLOBAL CATEGORIES                             */
/* -------------------------------------------------------------------------- */

export async function getGlobalCategories() {
    try {
        const res = await apiFetch("/api/v1/global/categories");
        if (!res.ok) return [];
        const data = await res.json();
        // Backend returns: { success: true, data: { gcategories: [...] } }
        return data.data?.gcategories || [];
    } catch (error) {
        console.error("[getGlobalCategories]", error);
        return [];
    }
}

export async function createGlobalCategory(name: string) {
    try {
        const res = await apiFetch("/api/v1/global/categories", {
            method: "POST",
            body: JSON.stringify({ name }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to create global category");
        }
        revalidatePath("/globals/categories");
        // Backend returns: { success: true, data: { category: newCategory } }
        return data.data?.category || data.data;
    } catch (err) {
        console.error("[createGlobalCategory]", err);
        throw err;
    }
}

/* -------------------------------------------------------------------------- */
/*                                GLOBAL ADDONS                               */
/* -------------------------------------------------------------------------- */

export async function getGlobalAddons() {
    try {
        const res = await apiFetch("/api/v1/global/addons");
        if (!res.ok) return [];
        const data = await res.json();
        // Backend returns: { success: true, data: [...] }
        return Array.isArray(data.data) ? data.data : data.data?.addons || [];
    } catch (error) {
        console.error("[getGlobalAddons]", error);
        return [];
    }
}

export async function createGlobalAddon(payload: {
    name: string;
    applyMarkup?: boolean;
}) {
    try {
        const res = await apiFetch("/api/v1/global/addons", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to create global addon");
        }
        revalidatePath("/globals/addons");
        // Backend returns: { success: true, data: newAddon }
        return data.data;
    } catch (err) {
        console.error("[createGlobalAddon]", err);
        throw err;
    }
}

export async function updateGlobalAddon(
    id: string,
    payload: { name?: string; applyMarkup?: boolean }
) {
    try {
        const res = await apiFetch(`/api/v1/global/addons/${id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to update global addon");
        }
        revalidatePath("/globals/addons");
        return data.data;
    } catch (err) {
        console.error("[updateGlobalAddon]", err);
        throw err;
    }
}

/* -------------------------------------------------------------------------- */
/*                                GLOBAL CONFIGS                              */
/* -------------------------------------------------------------------------- */

export async function getPricingConfig() {
    try {
        const res = await apiFetch("/api/v1/global/configs/pricing:globalMarkup");
        if (!res.ok) return null;
        const data = await res.json();
        return data.data?.config || null;
    } catch (error) {
        console.error("[getPricingConfig]", error);
        return null;
    }
}

/** Mirrors backend getPricingConfigForShop — shop-specific first, global fallback */
export async function getMarkupTiersForShop(shopId: string): Promise<{ percent: number; upto?: number }[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

    // 1. Try shop-specific config using raw fetch so a 404 is silently ignored
    //    (apiFetch throws on non-OK, causing a noisy dev overlay for every shop
    //     that doesn't have a custom pricing config)
    try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        const shopRes = await fetch(
            `${API_URL}/api/v1/global/configs/pricing:shop:${shopId}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                cache: "no-store",
            }
        );

        if (shopRes.ok) {
            const shopData = await shopRes.json();
            const cfg = shopData.data?.config;
            if (cfg?.enabled !== false && Array.isArray(cfg?.markupTiers) && cfg.markupTiers.length > 0) {
                return cfg.markupTiers;
            }
        }
        // non-ok (404 etc.) → silently fall through to global
    } catch {
        // network error etc. → fall through
    }

    // 2. Fall back to global markup config
    try {
        const globalRes = await apiFetch("/api/v1/global/configs/pricing:globalMarkup");
        const globalData = await globalRes.json();
        const cfg = globalData.data?.config;
        if (cfg?.enabled !== false && Array.isArray(cfg?.markupTiers)) {
            return cfg.markupTiers;
        }
        return [];
    } catch (error) {
        console.error("[getMarkupTiersForShop]", error);
        return [];
    }
}

export async function updatePricingConfig(data: any) {
    try {
        const res = await apiFetch("/api/v1/global/configs/pricing:globalMarkup", {
            method: "PUT",
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to update pricing config");
        }
        revalidatePath("/globals/pricing");
        return result.data?.config;
    } catch (err) {
        console.error("[updatePricingConfig]", err);
        throw err;
    }
}

/* -------------------------------------------------------------------------- */
/*                                 HELP LINKS                                 */
/* -------------------------------------------------------------------------- */

export async function getHelpLinksConfig() {
    try {
        const res = await apiFetch("/api/v1/global/configs/shopAppHelpLinks");
        if (!res.ok) return null;
        const data = await res.json();
        return data.data?.config || null;
    } catch (error) {
        console.error("[getHelpLinksConfig]", error);
        return null;
    }
}

export async function updateHelpLinksConfig(data: any) {
    try {
        const res = await apiFetch("/api/v1/global/configs/shopAppHelpLinks", {
            method: "PUT",
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to update help links config");
        }
        revalidatePath("/globals/help-links");
        return result.data?.config;
    } catch (err) {
        console.error("[updateHelpLinksConfig]", err);
        throw err;
    }
}
