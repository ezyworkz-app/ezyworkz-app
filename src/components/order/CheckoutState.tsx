// src/context/CheckoutState.tsx
"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api/client";

import type { DeliveryKey, DeliveryType } from "@/types/common";
// import { SavedAddress } from "@/types/address";
import {
  calculateOrderBreakdown,
  createOrder,
  updateOrderDetailsByAdmin,
  updateFulfillmentCartByAdmin,
} from "@/lib/actions/orders";
import { cartToOrderPayload } from "@/utils/cartToOrder";
import { CartLine, useCart } from "@/context/CartContext";
import { Totals } from "@/utils/pricing";

// import { getAddonsForService } from "@/lib/actions/shopServices";
import { SavedAddress } from "@/types/address";
import { getAddonsForService, getShopServicesTree } from "@/lib/actions/shopServices";


/* ---------- helpers ---------- */
type Grouped = {
  shopId: string;
  shopName: string;
  serviceId: string;
  serviceName: string;
  deliveryTypes: Record<DeliveryKey, DeliveryType>;
  categories: {
    categoryId: string;
    categoryName: string;
    items: CartLine[];
  }[];
};

const DEFAULT_DELIVERY: "standard" = "standard";
const firstKey = (o: Record<string, unknown>) =>
  Object.keys(o)[0] as DeliveryKey;

export type SelectedAddon = {
  addonId: string;
  variationId?: string;
  variationName?: string;
  name?: string;
  price: number;
  originalUnitPrice?: number;
  applyMarkup?: boolean;
  qty: number;
};
export type AddonsMap = Record<string, SelectedAddon[]>;
type AvailableAddon = {
  addonId: string;
  name?: string;
  price: number;
  originalUnitPrice?: number;
  applyMarkup?: boolean;
  variations?: { id: string; name: string; price: number; originalUnitPrice?: number }[];
};
type AvailableAddonsMap = Record<string, AvailableAddon[]>;


/* ---------- context ---------- */
type Ctx = {
  grouped: Grouped[];
  deliveryBySvc: Record<string, DeliveryKey>;
  setDelivery: (svcKey: string, k: DeliveryKey) => void;
  openBySvc: Record<string, boolean>;
  toggleOpen: (svcKey: string) => void;

  savedAddr: SavedAddress | null;
  setSavedAddr: (a: SavedAddress) => void;

  couponCode: string | undefined;
  setCouponCode: (s: string | undefined) => void;
  notes: string | undefined;
  setNotes: (s: string | undefined) => void;
  paymentMethod: "cod" | "upi" | "card";
  setPaymentMethod: (p: "cod" | "upi" | "card") => void;

  totals: Totals;

  editingOrderId?: string;
  setEditingOrderId: (id: string | undefined) => void;

  initialDistanceFee?: number;
  setInitialDistanceFee: (fee?: number) => void;

  discountAmount: number;
  setDiscountAmount: (n: number) => void;

  shopDiscountAmount: number;
  setShopDiscountAmount: (n: number) => void;

  userId?: string;
  setUserId: (id: string | undefined) => void;

  isFulfillmentMode: boolean;
  setIsFulfillmentMode: (b: boolean) => void;

  lastLoadedOrderId?: string;
  setLastLoadedOrderId: (id: string | undefined) => void;
  lastLoadedFulfillmentMode?: boolean;
  setLastLoadedFulfillmentMode: (b: boolean) => void;
  lastLoadedUpdatedAt?: string;
  setLastLoadedUpdatedAt: (ts: string | undefined) => void;

  placeOrder: () => void;
  pending: boolean;

  // selected addons
  addonsBySvc: AddonsMap;
  setAddonsBySvc: React.Dispatch<React.SetStateAction<AddonsMap>>;
  setAddonQty: (
    svcKey: string,
    addon: { addonId: string; variationId?: string; variationName?: string; name?: string; price: number; originalUnitPrice?: number; applyMarkup?: boolean },
    qty: number
  ) => void;
  updateAddon: (svcKey: string, addonId: string, selections: SelectedAddon[]) => void;
  getAddonsTotal: (svcKey: string) => number;

  // available (fetched) addons
  availableAddonsBySvc: AvailableAddonsMap;
  loadingAddons: boolean;
  // full delivery types (fetched from service tree, overrides stored order data)
  fullDeliveryTypesBySvc: Record<string, Record<DeliveryKey, DeliveryType>>;

  applyDeliveryFee: boolean;
  setApplyDeliveryFee: (b: boolean) => void;
  applyGst: boolean;
  setApplyGst: (b: boolean) => void;
};


const CheckoutCtx = createContext<Ctx | null>(null);
export const useCheckout = () => {
  const ctx = useContext(CheckoutCtx);
  if (!ctx) throw new Error("useCheckout outside provider");
  return ctx;
};

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const { cartItems, clear } = useCart();
  const router = useRouter();

  const [editingOrderId, setEditingOrderId] = useState<string | undefined>();
  const [initialDistanceFee, setInitialDistanceFee] = useState<number>();
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [shopDiscountAmount, setShopDiscountAmount] = useState<number>(0);
  const [userId, setUserId] = useState<string | undefined>();
  const [isFulfillmentMode, setIsFulfillmentMode] = useState(false);

  const [lastLoadedOrderId, setLastLoadedOrderId] = useState<string | undefined>();
  const [lastLoadedFulfillmentMode, setLastLoadedFulfillmentMode] = useState<boolean | undefined>();
  const [lastLoadedUpdatedAt, setLastLoadedUpdatedAt] = useState<string | undefined>();

  const [savedAddr, setSavedAddr] = useState<SavedAddress | null>(null);
  const [couponCode, setCouponCode] = useState<string>();
  const [notes, setNotes] = useState<string>();
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi" | "card">(
    "cod"
  );

  const memoSetIsFulfillmentMode = useMemo(() => setIsFulfillmentMode, []);
  const memoSetLastLoadedOrderId = useMemo(() => setLastLoadedOrderId, []);
  const memoSetLastLoadedFulfillmentMode = useMemo(() => setLastLoadedFulfillmentMode, []);
  const memoSetLastLoadedUpdatedAt = useMemo(() => setLastLoadedUpdatedAt, []);

  const memoSetEditingOrderId = useMemo(() => setEditingOrderId, []);
  const memoSetInitialDistanceFee = useMemo(() => setInitialDistanceFee, []);
  const memoSetDiscountAmount = useMemo(() => setDiscountAmount, []);
  const memoSetUserId = useMemo(() => setUserId, []);
  const memoSetSavedAddr = useMemo(() => setSavedAddr, []);
  const memoSetCouponCode = useMemo(() => setCouponCode, []);
  const memoSetNotes = useMemo(() => setNotes, []);
  const memoSetPaymentMethod = useMemo(() => setPaymentMethod, []);

  const [applyDeliveryFee, setApplyDeliveryFee] = useState(false);
  const [applyGst, setApplyGst] = useState(false);

  /* ---- group cart ---- */
  const grouped = useMemo<Grouped[]>(() => {
    const map: Record<string, Grouped> = {};
    cartItems.forEach((l) => {
      const key = `${l.shopId}-${l.serviceId}`;
      map[key] ??= {
        shopId: l.shopId,
        shopName: l.shopName,
        serviceId: l.serviceId,
        serviceName: l.serviceName,
        deliveryTypes: l.deliveryTypes,
        categories: [],
      };
      let cat = map[key].categories.find((c) => c.categoryId === l.categoryId);
      if (!cat) {
        cat = {
          categoryId: l.categoryId,
          categoryName: l.categoryName,
          items: [],
        };
        map[key].categories.push(cat);
      }
      cat.items.push(l);
    });
    return Object.values(map);
  }, [cartItems]);

  /* ---- selected addons state ---- */
  const [addonsBySvc, setAddonsBySvc] = useState<AddonsMap>({});

  // ✅ Addons are reset explicitly in CheckoutPage during hydration (no useEffect needed)

  const setAddonQty = (
    svcKey: string,
    addon: { addonId: string; variationId?: string; variationName?: string; name?: string; price: number; originalUnitPrice?: number; applyMarkup?: boolean },
    qty: number
  ) => {
    setAddonsBySvc((prev) => {
      const copy = { ...prev };
      const arr = copy[svcKey] ? [...copy[svcKey]] : [];
      const idx = arr.findIndex((a) => a.addonId === addon.addonId && a.variationId === addon.variationId);

      if (qty <= 0) {
        if (idx >= 0) arr.splice(idx, 1);
      } else {
        const entry: SelectedAddon = { ...addon, qty };
        if (idx >= 0) arr[idx] = entry;
        else arr.push(entry);
      }

      if (arr.length) copy[svcKey] = arr;
      else delete copy[svcKey];
      return copy;
    });
  };

  const updateAddon = (svcKey: string, addonId: string, selections: SelectedAddon[]) => {
    setAddonsBySvc((prev) => {
      const copy = { ...prev };
      const arr = copy[svcKey] ? [...copy[svcKey]] : [];
      
      // Remove all existing selections for this addonId
      const filtered = arr.filter(a => a.addonId !== addonId);
      
      // Add new selections
      const nextArr = [...filtered, ...selections];
      
      if (nextArr.length) copy[svcKey] = nextArr;
      else delete copy[svcKey];
      
      return copy;
    });
  };



  const getAddonsTotal = (svcKey: string) => {
    return (addonsBySvc[svcKey] ?? []).reduce((s, a) => s + a.price * a.qty, 0);
  };

  /* ---- available addons (fetching) ---- */
  const [availableAddonsBySvc, setAvailableAddonsBySvc] = useState<AvailableAddonsMap>({});
  const [loadingAddons, setLoadingAddons] = useState(false);
  const [fullDeliveryTypesBySvc, setFullDeliveryTypesBySvc] = useState<Record<string, Record<DeliveryKey, DeliveryType>>>({}); 

  useEffect(() => {
    const fetchAllAddons = async () => {
      if (grouped.length === 0) return;
      setLoadingAddons(true);
      try {
        const uniqueShopIds = [...new Set(grouped.map(g => g.shopId))];
        
        // Fetch public shop JSON for each unique shop
        const shopResponses = await Promise.all(
          uniqueShopIds.map(sid => apiClient.get(`/public/shop/json/${sid}`))
        );

        const shopServiceTrees = shopResponses.map(res => res.data?.services || []);

        const map: AvailableAddonsMap = {};
        const delivMap: Record<string, Record<DeliveryKey, DeliveryType>> = {};

        uniqueShopIds.forEach((shopId, shopIndex) => {
          const services = shopServiceTrees[shopIndex];
          
          services.forEach((svc: any) => {
            const key = `${shopId}-${svc.shopServiceId || svc.serviceID}`;
            
            // Map Delivery Types
            if (svc.deliveryTypes) {
                delivMap[key] = svc.deliveryTypes;
            }

            // Map Addons
            if (svc.addons?.length) {
                map[key] = svc.addons.map((a: any) => ({
                    addonId: a.shopServiceAddonId,
                    name: a.name,
                    price: a.price,
                    originalUnitPrice: a.originalUnitPrice,
                    applyMarkup: !!a.applyMarkup,
                    variations: a.variations,
                }));
            }
          });
        });

        setAvailableAddonsBySvc(map);
        setFullDeliveryTypesBySvc(delivMap);
      } catch (err) {
        console.error("❌ Failed to fetch available addons/services via JSON:", err);
      } finally {
        setLoadingAddons(false);
      }
    };
    fetchAllAddons();
  }, [grouped]);


  /* ---- delivery per service ---- */
  const [deliveryBySvc, setDeliveryBySvc] = useState<
    Record<string, DeliveryKey>
  >({});
  const [hasInteractedWithDelivery, setHasInteractedWithDelivery] = useState(false);

  useEffect(() => {
    setDeliveryBySvc((prev) => {
      const next: Record<string, DeliveryKey> = {};
      grouped.forEach((g) => {
        const key = `${g.shopId}-${g.serviceId}`;
        const want = prev[key] ?? DEFAULT_DELIVERY;
        next[key] = g.deliveryTypes[want] ? want : firstKey(g.deliveryTypes);
      });
      return next;
    });
  }, [grouped]);

  const setDelivery = (svcKey: string, k: DeliveryKey) =>
    setDeliveryBySvc((prev) => {
      const next: Record<string, DeliveryKey> = { ...prev, [svcKey]: k };

      // Sync-once logic: first interaction updates all matching services
      if (!hasInteractedWithDelivery) {
        grouped.forEach((g) => {
          const key = `${g.shopId}-${g.serviceId}`;
          if (g.deliveryTypes[k]) {
            next[key] = k;
          }
        });
        setHasInteractedWithDelivery(true);
      }

      return next;
    });

  /* ---- accordion open map ---- */
  const [openBySvc, setOpenBySvc] = useState<Record<string, boolean>>({});
  const toggleOpen = (k: string) => setOpenBySvc((p) => ({ ...p, [k]: !p[k] }));

  /* ---- address & misc fields ---- */
  // (State moved to top to prevent ReferenceErrors during memoization)

  /* ---- totals ---- */
  const [totals, setTotals] = useState<Totals>({
    base: 0,
    addonsTotal: 0,
    multiplierUpcharge: 0,
    distanceFee: 0,
    deliveryTotal: 0,
    lowCartFee: 0,
    lowCartFeeBreakdown: { total: 0, breakdown: [] },
    tax: 0,
    discount: 0,
    shopDiscount: 0,
    grand: 0,
    multiplierBreakdown: {},
    tripCount: 0,
    shopBaseAmount: 0,
    shopAddonsTotal: 0,
    shopTotalAmount: 0,
  });
  const [loadingTotals, setLoadingTotals] = useState(false);

  useEffect(() => {
    const fetchTotals = async () => {
      if (!cartItems || !cartItems.length) return;
      setLoadingTotals(true);
      try {
        // 🟢 Enrich mapping to ensure we never drop the `applyMarkup` flag if it was missing
        const enrichedAddonsBySvc: typeof addonsBySvc = {};
        for (const [svcKey, addons] of Object.entries(addonsBySvc)) {
          enrichedAddonsBySvc[svcKey] = addons.map(a => {
            if (a.applyMarkup !== undefined) return a;
            const liveMatch = availableAddonsBySvc[svcKey]?.find(live => live.addonId === a.addonId);
            return { ...a, applyMarkup: liveMatch?.applyMarkup };
          });
        }

        const tempPayload = cartToOrderPayload(cartItems, deliveryBySvc, {
          paymentMethod,
          address: {
            line1: savedAddr?.line1 || "",
            area: savedAddr?.area || "",
            city: savedAddr?.city || "",
            state: savedAddr?.state || "",
            pincode: savedAddr?.pincode || "",
            label: savedAddr?.label || "others",
            country: "IN",
            lat: savedAddr?.lat,
            lng: savedAddr?.lng,
          } as any,
          deliveryCharges: applyDeliveryFee ? (initialDistanceFee ?? undefined) : 0,
          discountAmount: discountAmount || 0,
          shopDiscountAmount: shopDiscountAmount || 0,
          baseAmount: 0,
          multiplierUpcharge: 0,
          addonsBySvc: enrichedAddonsBySvc,
          shopGstRate: applyGst ? undefined : 0, // undefined uses the shop default (e.g. 5%), 0 means no GST
        });


        const res = await calculateOrderBreakdown({
          shopId: cartItems[0].shopId,
          services: tempPayload.services,
          deliveryBySvc,

          userCoords: savedAddr ? { lat: savedAddr.lat, lng: savedAddr.lng } : undefined,
          discountAmountRequested: discountAmount || 0,
          initialDistanceFee: initialDistanceFee, // ✅ Pass initial fee for fallback scaling
          applyMarkup: true, // ✅ Admin checkout should show marked-up prices
        });

        if (res && res.success && res.data) {
          const breakdown = res.data;
          setTotals({
            base: breakdown.baseAmount,
            addonsTotal: breakdown.addonsTotal || 0,
            multiplierUpcharge: breakdown.multiplierUpcharge,
            distanceFee: breakdown.distanceFee / (breakdown.tripCount || 1), // Per-trip fee
            deliveryTotal: breakdown.distanceFee, // Frontend deliveryTotal is total for all trips
            lowCartFee: breakdown.lowCartFee,
            lowCartFeeBreakdown: breakdown.lowCartFeeBreakdown || { total: 0, breakdown: [] },
            tax: breakdown.taxAmount,
            discount: breakdown.discountAmount,
            shopDiscount: breakdown.shopDiscountAmount || 0,
            grand: breakdown.grandTotal,
            multiplierLabel: breakdown.multiplierLabel,
            multiplierBreakdown: breakdown.multiplierBreakdown || {},
            tripCount: breakdown.tripCount,
            shopBaseAmount: breakdown.shopBaseAmount || 0,
            shopAddonsTotal: breakdown.shopAddonsTotal || 0,
            shopTotalAmount: breakdown.shopTotalAmount || 0,
          });
        } else {
          // Fallback to local computation (backend calculate endpoint unavailable)
          let preMultiplierTotal = 0;
          let upcharge = 0;
          let maxMultiplier = 1;
          const mBreakdown: Record<string, { amount: number; label: string }> = {};

          // Compute addons total from current selections
          let fallbackAddonsTotal = 0;
          Object.values(addonsBySvc).forEach(addons => {
            fallbackAddonsTotal += addons.reduce((s, a) => s + a.price * a.qty, 0);
          });

          tempPayload.services.forEach((svc: any) => {
            preMultiplierTotal += svc.baseAmount || 0;
            const svcUpcharge = (svc.serviceTotal || 0) - (svc.baseAmount || 0);
            upcharge += svcUpcharge;
            const dKey = svc.selectedDeliveryKey;
            const mult = svc.deliveryTypes?.[dKey]?.priceMultiplier || 1;
            if (mult > maxMultiplier) {
              maxMultiplier = mult;
            }

            // Build per-service multiplier breakdown with real values
            if (mult > 1 && svcUpcharge > 0) {
              let typeLabel = "Priority";
              if (dKey === "express") typeLabel = "Express";
              else if (dKey === "oneDay") typeLabel = "One Day";
              const svcKey = svc.shopServiceId || svc.serviceName;
              mBreakdown[svcKey] = {
                amount: svcUpcharge,
                label: `${svc.serviceName} - ${typeLabel} X${mult}`,
              };
            }
          });

          // Simple label for when breakdown is empty but upcharge exists
          let mLabel = "";
          if (upcharge > 0 && Object.keys(mBreakdown).length === 0) {
            const hasExpress = Object.values(deliveryBySvc).some(k => k === "express");
            const hasOneDay = Object.values(deliveryBySvc).some(k => k === "oneDay");
            if (hasExpress) mLabel = "Express fee";
            else if (hasOneDay) mLabel = "One Day fee";
            else mLabel = "Priority fee";
            if (maxMultiplier > 1) mLabel += ` X${maxMultiplier}`;
          }

          setTotals({
            base: preMultiplierTotal || 0,
            addonsTotal: fallbackAddonsTotal,
            multiplierUpcharge: upcharge || 0,
            multiplierLabel: mLabel || undefined,
            distanceFee: tempPayload.deliveryCharges || 0,
            deliveryTotal: tempPayload.deliveryCharges || 0,
            lowCartFee: 0,
            lowCartFeeBreakdown: { total: 0, breakdown: [] },
            tax: tempPayload.taxAmount || 0,
            discount: tempPayload.discountAmount || 0,
            shopDiscount: tempPayload.shopDiscountAmount || 0,
            grand: tempPayload.grandTotalPaid || 0,
            multiplierBreakdown: mBreakdown,
            tripCount: 1,
            shopBaseAmount: 0,
            shopAddonsTotal: 0,
            shopTotalAmount: 0,
          });
        }
      } catch (err) {
        console.error("❌ Failed to fetch backend totals:", err);
      } finally {
        setLoadingTotals(false);
      }
    };

    const timeout = setTimeout(fetchTotals, 500);
    return () => clearTimeout(timeout);
  }, [cartItems, deliveryBySvc, savedAddr, discountAmount, shopDiscountAmount, paymentMethod, addonsBySvc, applyDeliveryFee, applyGst, initialDistanceFee]);


  /* ---- place order (create or update) ---- */
  const [pending, startTransition] = useTransition();
  const placeOrder = () => {
    if (pending) return;

    startTransition(async () => {
      if (!cartItems.length || !savedAddr) return;

      // 🎯 Capture initial state intent to prevent race condition "illegal fallbacks"
      const currentEditingId = editingOrderId;
      const currentFulfillmentMode = isFulfillmentMode;

      const lcFee = totals.lowCartFee ?? 0;
      const lcBreakdown =
        lcFee > 0
          ? totals.lowCartFeeBreakdown
          : { total: 0, breakdown: [] as { service: string; fee: number }[] };

      // 🟢 Enrich mapping to ensure we never drop the `applyMarkup` flag if it was missing
      const enrichedAddonsBySvc: typeof addonsBySvc = {};
      for (const [svcKey, addons] of Object.entries(addonsBySvc)) {
        enrichedAddonsBySvc[svcKey] = addons.map(a => {
          if (a.applyMarkup !== undefined) return a;
          const liveMatch = availableAddonsBySvc[svcKey]?.find(live => live.addonId === a.addonId);
          return { ...a, applyMarkup: liveMatch?.applyMarkup };
        });
      }

      const payload = cartToOrderPayload(cartItems, deliveryBySvc, {
        paymentMethod,
        address: {
          line1: savedAddr.houseNo ?? savedAddr.line1,
          area: savedAddr.area ?? "",
          city: savedAddr.city ?? "",
          state: savedAddr.state ?? "",
          pincode: savedAddr.pincode ?? "",
          label: savedAddr.label || "others",
          country: "IN",
          lat: savedAddr.lat,
          lng: savedAddr.lng,
        },
        deliveryCharges: applyDeliveryFee ? (initialDistanceFee ?? totals.deliveryTotal ?? undefined) : 0,
        couponCode,
        notes,
        baseAmount: totals.base,
        multiplierUpcharge: totals.multiplierUpcharge,
        multiplierBreakdown: totals.multiplierBreakdown,
        tripCount: totals.tripCount,
        lowCartFee: lcFee,
        lowCartFeeBreakdown: lcBreakdown,
        discountAmount, // send admin discount to backend
        shopDiscountAmount, // send shop discount to backend
        userId, // ✅ Pass userId if present
        addonsBySvc: enrichedAddonsBySvc, // ✅ Pass correctly mapped addons
        shopGstRate: applyGst ? undefined : 0,
      });


      try {
        if (currentEditingId) {
          if (currentFulfillmentMode) {
            await updateFulfillmentCartByAdmin(currentEditingId, {
              fulfillmentCart: payload.services,
              fulfillmentStatus: "built_unverified",
            });
          } else {
            await updateOrderDetailsByAdmin(currentEditingId, payload);
          }
        } else {
          // 🛡️ Strict Guard: If we are in fulfillment mode but lost the ID, DO NOT fallback to create.
          if (currentFulfillmentMode) {
            throw new Error("Critical: Order context lost in fulfillment mode. Please refresh the page.");
          }
          await createOrder(payload);
        }

        // ✅ Success logic: Clear local state and navigate away
        clear();
        setEditingOrderId(undefined);
        setUserId(undefined);
        setIsFulfillmentMode(false);
        setInitialDistanceFee(undefined);
        setDiscountAmount(0);
        // Clear session tracking so emergency replaceCart can't fire with null editingOrderId/userId
        setLastLoadedOrderId(undefined);
        setLastLoadedFulfillmentMode(undefined);
        setLastLoadedUpdatedAt(undefined);

        router.replace("/orders");
      } catch (err: any) {
        console.error("❌ Order failed:", err);
        alert(`Failed to place order: ${err.message || "Unknown error"}`);
      }
    });
  };

  const value: Ctx = {
    grouped,
    deliveryBySvc,
    setDelivery,
    openBySvc,
    toggleOpen,
    savedAddr,
    setSavedAddr,
    couponCode,
    setCouponCode,
    notes,
    setNotes: memoSetNotes,
    paymentMethod,
    setPaymentMethod: memoSetPaymentMethod,
    totals,
    editingOrderId,
    setEditingOrderId: memoSetEditingOrderId,
    initialDistanceFee,
    setInitialDistanceFee: memoSetInitialDistanceFee,
    discountAmount,
    setDiscountAmount: memoSetDiscountAmount,
    shopDiscountAmount,
    setShopDiscountAmount,
    userId,
    setUserId: memoSetUserId,
    isFulfillmentMode,
    setIsFulfillmentMode: memoSetIsFulfillmentMode,
    lastLoadedOrderId,
    setLastLoadedOrderId: memoSetLastLoadedOrderId,
    lastLoadedFulfillmentMode,
    setLastLoadedFulfillmentMode: memoSetLastLoadedFulfillmentMode,
    lastLoadedUpdatedAt,
    setLastLoadedUpdatedAt: memoSetLastLoadedUpdatedAt,
    placeOrder,
    pending,
    addonsBySvc,
    setAddonsBySvc,
    setAddonQty,
    updateAddon,
    getAddonsTotal,
    availableAddonsBySvc,
    loadingAddons,
    fullDeliveryTypesBySvc,
    applyDeliveryFee,
    setApplyDeliveryFee,
    applyGst,
    setApplyGst,
  };


  return <CheckoutCtx.Provider value={value}>{children}</CheckoutCtx.Provider>;
}
