/* ------------------------------------------------------------------ *
 *  shop‑menu.server.ts – fast helpers for the Ezyworkz shop frontend  *
 * ------------------------------------------------------------------ */

"use server";

import type {
  ShopService,
  ShopCategory,
  ShopItem,
  Addon,
  /* add your Shop type here if you have one */
} from "@/types/shop-menu";

/* ────────────────────────────────────────────────────────── */
/*  Config                                                   */
/* ────────────────────────────────────────────────────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ────────────────────────────────────────────────────────── */
/*  Generic GET helper                                        */
/* ────────────────────────────────────────────────────────── */

/**
 * Fetch JSON from the backend.
 *
 * * Uses **edge revalidation** (`next.revalidate`) instead of `cache: "no-store"`.
 *   By default each unique request is cached for 30 s at the edge,
 *   but you can override per call: `apiGet('/foo', { revalidate: 5 })`.
 * * Throws with a helpful message on non‑2xx status.
 */
async function apiGet<T>(
  path: string,
  { revalidate = 30 }: { revalidate?: number } = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    // 💡  edge caching / ISR
    next: { revalidate },
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`GET ${path} → ${res.status}: ${msg}`);
  }

  return res.json() as Promise<T>;
}

/* 2. Shop‑level resources
-------------------------------------------------------------- */

export async function fetchShopServices(
  shopId: string
): Promise<ShopService[]> {
  const { services } = await apiGet<{ services: ShopService[] }>(
    `/api/v1/user/services/${shopId}`
  );
  return services;
}

export async function fetchServiceCategories(
  shopServiceId: string
): Promise<ShopCategory[]> {
  const { categories } = await apiGet<{ categories: ShopCategory[] }>(
    `/api/v1/user/categories/${shopServiceId}`
  );
  return categories;
}

export async function fetchCategoryItems(
  shopServiceCategoryId: string
): Promise<ShopItem[]> {
  const { items } = await apiGet<{ items: ShopItem[] }>(
    `/api/v1/user/items/${shopServiceCategoryId}`
  );
  return items;
}

export async function fetchShopAddons(shopId: string): Promise<Addon[]> {
  const { addons } = await apiGet<{ addons: Addon[] }>(
    `/api/v1/user/addons/${shopId}`
  );
  return addons;
}

/* 3. Whole menu in one hit – use this instead of N+1 requests
-------------------------------------------------------------- */

export async function fetchShopMenu(shopId: string): Promise<ShopService[]> {
  const { services } = await apiGet<{ services: ShopService[] }>(
    `/api/v1/shops-services/${shopId}`,
    { revalidate: 15 } // menus change more often, quicker refresh
  );
  return services;
}

/* ────────────────────────────────────────────────────────── */
/*  Convenience helpers (optional)                            */
/* ────────────────────────────────────────────────────────── */

/**
 * Fetch services, categories *and* addons in parallel.
 * Use this from your React (server) component to avoid serial latency.
 */
export async function fetchMenuShell(shopId: string) {
  const [services, addons] = await Promise.all([
    fetchShopServices(shopId),
    fetchShopAddons(shopId),
  ]);

  return { services, addons };
}

//