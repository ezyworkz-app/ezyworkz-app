"use client";
import ItemCard from "./ItemCard";
import { ShopItem } from "@/types/shop-menu";
import { DeliveryKey, DeliveryType } from "@/types/common";

interface Props {
  shopLat: number;
  shopLng: number;
  shopId: string;
  shopName: string;
  serviceId: string;
  serviceName: string;
  deliveryTypes: Record<DeliveryKey, DeliveryType>;
  categoryId: string;
  categoryName: string;
  items: ShopItem[];
}

export default function ItemsGrid({
  shopId,
  shopName,
  shopLat,
  shopLng,
  serviceId,
  serviceName,
  deliveryTypes,
  categoryId,
  categoryName,
  items,
}: Props) {
  // 🔵 Filter out inactive items — same as shop/user app behaviour
  const activeItems = items.filter(itm => itm.isActive !== false);

  if (activeItems.length === 0)
    return <p className=" text-sm text-neutral-500">No items.</p>;

  return (
    /* 📜 own scroll container —  calc leaves room for header / rail */
    <div className="flex-1">
      <div
        className="grid grid-cols-2 gap-4
                   sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        {activeItems.map((itm) => (
          <ItemCard
            key={itm.shopServiceCategoryItemId}
            shopLat={shopLat}
            shopLng={shopLng}
            shopId={shopId}
            shopName={shopName}
            serviceId={serviceId}
            serviceName={serviceName}
            deliveryTypes={deliveryTypes}
            categoryId={categoryId}
            categoryName={categoryName}
            item={itm}
          />
        ))}
      </div>
    </div>
  );
}
