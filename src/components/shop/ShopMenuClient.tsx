/* components/shop/ShopMenuClient.tsx */
"use client";

import { useEffect, useMemo, useState } from "react";
// import {
//   fetchServiceCategories,
//   fetchCategoryItems,
// } from "@/lib/shop-menu";

import type {
  ShopService,
  ShopCategory,
  ShopItem,
} from "@/types/shop-menu";
import { Shop } from "@/types/Shop";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useCheckout } from "../order/CheckoutState";

import ServiceTabs from "./ServiceTabs";
import CategoryRail from "./CategoryRail";
import ItemsGrid from "./ItemsGrid";
import {
  fetchCategoryItems,
  fetchServiceCategories,
} from "@/lib/actions/shops";

/* ─────── skeletons (unchanged) ─────── */
const CategorySkeleton = () => (
  <ul className="flex flex-col gap-3 pr-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <li key={i} className="flex flex-col items-center gap-1">
        <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
      </li>
    ))}
  </ul>
);

const ItemsSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="h-32 animate-pulse rounded-xl bg-gradient-to-br from-slate-200/80 to-slate-100"
      />
    ))}
  </div>
);
/* ────────────────────────────────────── */

/* 1️⃣  Custom order for services */
const ORDER: string[] = [
  "Wash & Iron",
  "Wash & Fold",
  "Dry Cleaning",
  "Steam Iron",
];

/* 2️⃣  Custom order for categories */
const CATEGORY_ORDER: string[] = [
  "By weight",
  "Per piece",
  "Women",
  "Men",
  "Kids",
  "Accessories",
];

export default function ShopMenuClient({
  shop,
  services,
}: {
  shop: Shop;
  services: ShopService[];
}) {
  /* ---- sort services once ---- */
  const sortedServices = useMemo<ShopService[]>(() => {
    // 🔵 Only show active services (respect isActive flag - same as shop app)
    const activeServices = services.filter(s => s.isActive !== false);

    const ordered = ORDER.map((name) =>
      activeServices.find((s) => (s.name || "").toLowerCase() === name.toLowerCase())
    ).filter(Boolean) as ShopService[];

    const leftovers = activeServices.filter(
      (s) => !ORDER.some((n) => n.toLowerCase() === (s.name || "").toLowerCase())
    );

    return [...ordered, ...leftovers];
  }, [services]);

  /* active service */
  const [activeSvc, setActiveSvc] = useState<ShopService | null>(
    sortedServices[0] ?? null
  );

  /* re‑align if services list changes */
  useEffect(() => {
    if (!activeSvc && sortedServices.length) {
      setActiveSvc(sortedServices[0]);
    }
  }, [sortedServices, activeSvc]);

  /* category / item state */
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [activeCat, setActiveCat] = useState<ShopCategory | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);

  const searchParams = useSearchParams();
  const { setEditingOrderId, setIsFulfillmentMode } = useCheckout();
  const { cartItems } = useCart();

  /* 🟢 Cart counts for badges */
  const cartCountByServiceId = useMemo(() => {
    const map: Record<string, number> = {};
    cartItems.forEach(item => {
      map[item.serviceId] = (map[item.serviceId] ?? 0) + item.qty;
    });
    return map;
  }, [cartItems]);

  const cartCountByCategoryId = useMemo(() => {
    const map: Record<string, number> = {};
    cartItems.forEach(item => {
      map[item.categoryId] = (map[item.categoryId] ?? 0) + item.qty;
    });
    return map;
  }, [cartItems]);

  // 🔄 Sync Administrative Edit Context from URL
  // This ensures that even if the page is refreshed, the "Checkout" bar 
  // correctly remembers which order and mode we are editing.
  useEffect(() => {
    const urlOrderId = searchParams.get("orderId");
    const urlMode = searchParams.get("mode");
    if (urlOrderId) setEditingOrderId(urlOrderId);
    if (urlMode) setIsFulfillmentMode(urlMode === "fulfillment");
  }, [searchParams, setEditingOrderId, setIsFulfillmentMode]);

  const shopId = shop?.shopId;
  const shopName = shop?.name;
  const { lat = 0, lng = 0 } = shop.address ?? {};

  /* ---- load & sort categories when service changes ---- */
  useEffect(() => {
    if (!activeSvc) return;
    setCategories([]);
    setActiveCat(null);
    setItems([]);

    fetchServiceCategories(shopId, activeSvc.shopServiceId).then((cats) => {
      // 🔵 Only show active categories
      const activeCats = cats.filter(c => c.isActive !== false);

      /* custom order logic */
      const ordered = CATEGORY_ORDER.map((key) =>
        activeCats.find((c) => c.name.toLowerCase() === key.toLowerCase())
      ).filter(Boolean) as ShopCategory[];

      const leftovers = activeCats.filter(
        (c) =>
          !CATEGORY_ORDER.some(
            (key) => key.toLowerCase() === c.name.toLowerCase()
          )
      );

      const sortedCats = [...ordered, ...leftovers];

      setCategories(sortedCats);
      if (sortedCats.length > 0) setActiveCat(sortedCats[0]);
    });
  }, [activeSvc]);

    useEffect(() => {
    if (!activeCat || !activeSvc) {
      setItems([]);
      return;
    }
    setItems([]);
    fetchCategoryItems(shopId, activeSvc.shopServiceId, activeCat.shopServiceCategoryId).then(setItems);
  }, [activeCat, activeSvc, shopId]);

  if (!activeSvc) return null;

  const catsLoading = categories.length === 0;
  const itemsLoading = !!activeCat && items.length === 0;

  return (
    <div className="flex flex-col space-y-2">
      {/* ── sticky service pills ── */}
      <div className="sticky top-16 z-30 bg-white pb-1">
        <ServiceTabs
          services={sortedServices}
          activeServiceId={activeSvc.shopServiceId}
          onSelect={setActiveSvc}
          cartCountByServiceId={cartCountByServiceId}
        />
      </div>

      {/* ── two‑column layout ── */}
      <div className="flex flex-1 gap-2 overflow-x-hidden">
        {/* Categories rail */}
        <div className="sticky top-[120px]">
          {catsLoading ? (
            <CategorySkeleton />
          ) : (
            <CategoryRail
              categories={categories}
              activeCategoryId={activeCat?.shopServiceCategoryId ?? null}
              onSelect={setActiveCat}
              cartCountByCategoryId={cartCountByCategoryId}
            />
          )}
        </div>

        {/* Items grid */}
        <div className="flex-1 rounded-tl-2xl bg-white">
          {itemsLoading ? (
            <ItemsSkeleton />
          ) : (
            <ItemsGrid
              shopId={shopId}
              shopName={shopName}
              shopLat={lat}
              shopLng={lng}
              serviceId={activeSvc.shopServiceId}
              serviceName={activeSvc.name}
              deliveryTypes={activeSvc.deliveryTypes}
              categoryId={activeCat?.shopServiceCategoryId ?? ""}
              categoryName={activeCat?.name ?? ""}
              items={items}
            />
          )}
        </div>
      </div>
    </div>
  );
}
