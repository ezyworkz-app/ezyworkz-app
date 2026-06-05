import type { DeliveryType, DeliveryKey } from "@/types/common";
import { CartLine } from "../context/CartContext";
import { Order } from "../types/order";

export function convertOrderToCartLines(
  order: Order,
  serviceMetaMap: Record<string, Record<DeliveryKey, DeliveryType>> = {},
  overrideShopId?: string
): CartLine[] {
  const shopToUse = overrideShopId || order.shopId;
  const cartLines: CartLine[] = [];

  for (const service of order.services) {
    const svcKey = `${shopToUse}-${service.shopServiceId}`;

    const fullDeliveryTypes =
      serviceMetaMap[svcKey] ?? service.deliveryTypes ?? {};

    const selectedDeliveryKey = Object.keys(
      service.deliveryTypes ?? {}
    )[0] as DeliveryKey;

    const serviceAddons = service.addons?.map(a => ({
      id: a.shopServiceAddonId,
      name: a.addonName,
      price: a.price,
      originalUnitPrice: a.originalUnitPrice,
      applyMarkup: a.applyMarkup,
      variationId: a.variationId,
      variationName: a.variationName,
      qty: a.qty
    })) || [];

    for (const category of service.categories) {
      for (const item of category.items) {
        const itemAddons = item.addons?.map(a => ({
          id: a.shopItemAddonId,
          name: a.addonName,
          price: a.price,
          originalUnitPrice: a.originalUnitPrice,
          applyMarkup: a.applyMarkup,
          variationId: a.variationId,
          variationName: a.variationName
        })) || [];

        const line: CartLine = {
          shopId: shopToUse,
          shopName: order.shopName,
          shopLat: order.address?.lat ?? 0,
          shopLng: order.address?.lng ?? 0,
          serviceId: service.shopServiceId,
          serviceName: service.serviceName,
          categoryId: category.shopServiceCategoryId,
          categoryName: category.categoryName,
          itemId: item.shopServiceCategoryItemId,
          itemName: item.itemName,
          unit: (item as any).unit ?? "kg",
          price: (item as any).markedUnitPrice ?? (item as any).totalPrice / item.qty,
          originalUnitPrice: item.originalUnitPrice,
          qty: item.qty,
          deliveryTypes: fullDeliveryTypes,
          __selectedDeliveryKey: selectedDeliveryKey,
          addons: itemAddons, // 🟢 ONLY include item-level addons here
          serviceAddons: serviceAddons // 🟢 Optionally include service-level addons separately if needed
        } as any;

        cartLines.push(line);
      }
    }

  }

  return cartLines;
}
