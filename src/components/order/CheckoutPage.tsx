"use client";

// import { Order } from "/types/order";
import { useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useCheckout, SelectedAddon, AddonsMap } from "./CheckoutState";
import { convertOrderToCartLines } from "@/utils/orderToCartLines";
import PaymentAndTotals from "./PaymentAndTotals";
import ServicesBlock from "./ServicesBlock";
import { DeliveryKey } from "@/types/common";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Order } from "@/types/order";

export default function CheckoutClientPage({ order }: { order: Order }) {
  const { replaceCart, cartItems, clear } = useCart();
  const {
    setSavedAddr,
    setPaymentMethod,
    setDelivery,
    setEditingOrderId,
    setInitialDistanceFee,
    setDiscountAmount,
    setIsFulfillmentMode,
    userId,
    setUserId,
    lastLoadedOrderId,
    setLastLoadedOrderId,
    lastLoadedFulfillmentMode,
    setLastLoadedFulfillmentMode,
    lastLoadedUpdatedAt,
    setLastLoadedUpdatedAt,
    setAddonsBySvc,
    setApplyDeliveryFee,
    setApplyGst,
    setShopDiscountAmount,
  } = useCheckout();

  const searchParams = useSearchParams();
  const isFulfillment = searchParams.get("mode") === "fulfillment";

  const effectiveShopId = isFulfillment
    ? order.shopId
    : (order.originalShopId || order.shopId);

  useEffect(() => {
    setIsFulfillmentMode(isFulfillment);
  }, [isFulfillment, setIsFulfillmentMode]);

  useEffect(() => {
    if (
      !order ||
      (!isFulfillment && !order.services?.length) ||
      (isFulfillment && !order.fulfillmentCart?.length && !order.services?.length)
    )
      return;

    const sourceOrder = isFulfillment
      ? { ...order, services: (order.fulfillmentCart?.length ? order.fulfillmentCart : order.services) }
      : order;

    // 🎯 Target Shop ID Logic:
    // When editing enrollment, the 'template' (customer's original request) should keep its Original Shop ID.
    // This ensures that if the admin adds a REAL item from the fulfilling shop's menu, the shop-mismatch 
    // logic in CartContext will automatically reset the cart for them.
    const targetShopId = (isFulfillment && !order.fulfillmentCart?.length)
      ? (order.originalShopId || order.shopId) // Use template's origin
      : effectiveShopId; // Use current mode's shop

    const lines = convertOrderToCartLines(sourceOrder as Order, {}, targetShopId);

    const isSameSession = order.orderId === lastLoadedOrderId
      && isFulfillment === lastLoadedFulfillmentMode
      && order.updatedAt === lastLoadedUpdatedAt;
    const currentCartShopId = cartItems.length > 0 ? cartItems[0].shopId : undefined;
    
    // 🎯 Session-Aware Shop Validation:
    // A cart is 'invalid' for this checkout if it doesn't match the original shop (template) 
    // AND doesn't match the fulfilling shop (actual record).
    // This allows the user to transition from the template (Shop A) to a real fulfillment (Shop B) 
    // without the cart being wiped when they return to the checkout page.
    const isCartNotForThisOrder = cartItems.length > 0 && 
                                  currentCartShopId !== order.shopId && 
                                  currentCartShopId !== (order.originalShopId || order.shopId);

    // 🚀 Session Persistence & Isolation Check: 
    // - If we are entering a NEW order or a NEW mode (!isSameSession), replace cart.
    // - If the current cart contains items from an unrelated shop (isCartNotForThisOrder), replace cart.
    // - Otherwise, keep the cart as is to preserve local modifications from the shop menu.
    if (!isSameSession || isCartNotForThisOrder) {
      // clear(); 
      replaceCart(lines);
      setLastLoadedOrderId(order.orderId);
      setLastLoadedFulfillmentMode(isFulfillment);
      setLastLoadedUpdatedAt(order.updatedAt);

      // 🔹 Initialize order-specific fields ONLY on first load of this session
      lines.forEach((line) => {
        const svcKey = `${line.shopId}-${line.serviceId}`;
        const service = (isFulfillment ? order.fulfillmentCart : order.services)?.find(
          (s) => s.shopServiceId === line.serviceId
        );
  
        const selectedKey =
          (service as any)?.selectedDeliveryKey ??
          Object.keys(line.deliveryTypes)[0];
  
        if (selectedKey) {
          setDelivery(svcKey, selectedKey as DeliveryKey);
        }
      });
  
      if (order.address) setSavedAddr(order.address);
      if (order.paymentMethod) setPaymentMethod(order.paymentMethod);
  
      // 🟢 Hydrate addons directly from the source order (avoiding duplicates)
      const addonsMap: AddonsMap = {};
      sourceOrder.services?.forEach(svc => {
        const svcKey = `${targetShopId}-${svc.shopServiceId}`;
        const serviceAddonsList: SelectedAddon[] = [];

        svc.addons?.forEach(a => {
          const aId = (a as any).shopServiceAddonId || (a as any).addonId || (a as any).id;
          if (!aId) return;

          serviceAddonsList.push({
            addonId: aId,
            variationId: a.variationId,
            variationName: a.variationName,
            name: a.addonName || "Addon",
            price: a.price ?? 0,
            originalUnitPrice: a.originalUnitPrice ?? (a.price ?? 0),
            qty: a.qty || 1,
            applyMarkup: a.applyMarkup
          });
        });

        if (serviceAddonsList.length > 0) {
          addonsMap[svcKey] = serviceAddonsList;
        }
      });
      // console.log("🟢 Hydrating addonsMap:", addonsMap);
      // We need a way to set this in the state. 
      // I'll update CheckoutState to provide a 'replaceAddons' or just use existing toggle logic?
      // Actually, setAddonsBySvc is already in Ctx!
      
      // 🟢 Synchronously set addons - no setTimeout needed since we removed the reset useEffect
      setAddonsBySvc(addonsMap);

      if (order.orderId) {
        setEditingOrderId(order.orderId);
        setUserId(order.userId);
        if (order.deliveryCharges != null && order.deliveryCharges > 0) {
          setInitialDistanceFee(order.deliveryCharges);
          setApplyDeliveryFee(true);
        } else {
          setApplyDeliveryFee(false);
        }
        
        if (order.taxAmount && order.taxAmount > 0) {
          setApplyGst(true);
        } else {
          setApplyGst(false);
        }

        // ✅ Prefill admin and shop discounts if present on order
        setDiscountAmount(order.discountAmount ?? 0);
        setShopDiscountAmount(order.shopDiscountAmount ?? 0);
      }
    } else if (cartItems.length === 0) {
      // Emergency catch for empty cart if something went wrong
      replaceCart(lines);
    }
  }, [
    order,
    isFulfillment,
    effectiveShopId,
    replaceCart,
    cartItems.length,
    setSavedAddr,
    setPaymentMethod,
    setDelivery,
    setEditingOrderId,
    setInitialDistanceFee,
    setDiscountAmount,
    setShopDiscountAmount,
    setApplyDeliveryFee,
    setApplyGst,
    lastLoadedOrderId,
    setLastLoadedOrderId,
    lastLoadedFulfillmentMode,
    setLastLoadedFulfillmentMode,
    lastLoadedUpdatedAt,
    setLastLoadedUpdatedAt,
  ]);

  return (
    <main className="mx-auto max-w-2xl space-y-2 lg:space-y-6 bg-purple-50 p-4 m-4 mb-16 rounded-2xl">
      <Link
        href={`/orders/${order.orderId}/edit/menu?orderId=${order.orderId}&mode=${isFulfillment ? "fulfillment" : "customer"}`}
        className="mt-4 text-purple-700 underline"
      >
        ← Back to Menu
      </Link>

      <h1 className="text-2xl font-bold">
        {isFulfillment ? "Edit Fulfillment Cart" : "Edit Customer Cart"}
      </h1>

      <ServicesBlock />
      <PaymentAndTotals token={undefined} />
    </main>
  );
}
