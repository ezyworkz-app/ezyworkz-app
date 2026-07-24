"use client";
import { useState, useEffect } from "react";
import ItemCard from "./ItemCard";
import { ShopItem } from "@/types/shop-menu";
import { DeliveryKey, DeliveryType } from "@/types/common";
import { useCart } from "@/context/CartContext";
import { Search } from "lucide-react";

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
  onOpenSearch?: () => void;
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
  onOpenSearch,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortedItems, setSortedItems] = useState<ShopItem[]>([]);
  const { cartItems } = useCart();

  // Sort items when the category/items change, prioritizing those already in the cart
  useEffect(() => {
    const sorted = [...items].sort((a, b) => {
      const getQty = (item: ShopItem) => {
        if (!item.variants || item.variants.length === 0) {
          return cartItems.find(ci => ci.itemId === item.shopServiceCategoryItemId && ci.serviceId === serviceId && ci.shopId === shopId)?.qty || 0;
        }
        return item.variants.reduce((sum, v) => sum + (cartItems.find(ci => ci.itemId === v.variantId && ci.serviceId === serviceId && ci.shopId === shopId)?.qty || 0), 0);
      };

      const qtyA = getQty(a);
      const qtyB = getQty(b);

      if (qtyA > 0 && qtyB === 0) return -1;
      if (qtyB > 0 && qtyA === 0) return 1;
      
      // Sort alphabetically as a fallback
      return (a.name || "").localeCompare(b.name || "");
    });
    setSortedItems(sorted);
    // We intentionally omit cartItems from the dependency array so the grid doesn't re-sort and jump while the user is actively adding items.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, serviceId, shopId]);

  // Filter out inactive items and apply search query
  const activeItems = sortedItems.filter(itm => 
    itm.isActive !== false && 
    (itm.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col gap-4">
      {activeItems.length === 0 ? (
        <p className="text-sm text-neutral-500">No items found.</p>
      ) : (
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
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
      )}
    </div>
  );
}
