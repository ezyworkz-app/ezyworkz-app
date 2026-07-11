"use client";
// import QuantityToggle from "../QuantityToggle";
import { ShopItem } from "@/types/shop-menu";
import { DeliveryKey, DeliveryType } from "@/types/common";
import QuantityToggle from "../order/QuantityToggle";
import VariantSelectorModal from "./VariantSelectorModal";
import { useCart } from "@/context/CartContext";
import { useState, useMemo } from "react";

const getUnitPrice = (item: ShopItem) => {
  if ((item as any).price !== undefined && (item as any).price !== null) {
    return (item as any).price;
  }
  const p = item.unit === "kg"
    ? item.pricePerKg
    : item.unit === "sft"
      ? item.pricePerSft
      : item.pricePerPiece;
  return p ?? 0;
};

const getOriginalUnitPrice = (item: ShopItem) => {
  if ((item as any).original_price !== undefined && (item as any).original_price !== null) {
    return (item as any).original_price;
  }
  const original = item.unit === "kg"
    ? (item as any).original_pricePerKg
    : item.unit === "sft"
      ? (item as any).original_pricePerSft
      : (item as any).original_pricePerPiece;
  return original != null ? original : getUnitPrice(item);
};

interface Props {
  shopId: string;
  shopName: string;
  shopLat: number;
  shopLng: number;
  serviceId: string;
  serviceName: string;
  deliveryTypes: Record<DeliveryKey, DeliveryType>;
  categoryId: string;
  categoryName: string;
  item: ShopItem;
}

export default function ItemCard({
  shopId,
  shopName,
  shopLat,
  shopLng,
  serviceId,
  serviceName,
  deliveryTypes,
  categoryId,
  categoryName,
  item,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const { cartItems } = useCart();

  const variants = item.variants || [];
  const hasVariants = variants.length > 0;
  
  if (hasVariants) {
    console.log(`[ItemCard] ${item.name} variants:`, JSON.stringify(variants, null, 2));
  }

  // Helper to extract variant price robustly
  const getVariantPrice = (v: any) => {
    const p = v.price ?? v.pricePerPiece ?? v.pricePerKg ?? v.pricePerSft;
    return Number(p) || 0;
  };

  // Price display logic
  const priceDisplay = useMemo(() => {
    if (hasVariants) {
      if (variants.length > 1) {
        const minPrice = Math.min(...variants.map(getVariantPrice));
        return `From ₹${minPrice}`;
      }
      return `₹${getVariantPrice(variants[0])}`;
    }
    return `₹${getUnitPrice(item)}`;
  }, [item, variants, hasVariants]);

  // Total qty logic for this item's variants
  const totalItemQty = useMemo(() => {
    if (!hasVariants) return 0;
    return cartItems
      .filter(ci =>
        ci.shopId === shopId &&
        ci.serviceId === serviceId &&
        variants.some(v => v.variantId === ci.itemId)
      )
      .reduce((sum, ci) => sum + ci.qty, 0);
  }, [cartItems, hasVariants, variants, shopId, serviceId]);

  return (
    <>
      <div
        className="group flex flex-col justify-between border-r border-primary-100
                   p-3  transition hover:-translate-y-1
                   hover:shadow-lg relative"
      >
        {/* name & price */}
        <div className="capitalize">
          <p className=" font-medium text-xs lg:text-base text-slate-900 capitalize leading-tight mb-1">
            {item.name}
          </p>
          <p className="my-2 text-sm text-primary-700 font-semibold">{priceDisplay}</p>
        </div>

        {/* quantity toggle or variant add button */}
        {hasVariants ? (
          <button
            onClick={() => setModalOpen(true)}
            className={`w-full rounded-lg py-1.5 text-xs font-bold transition border relative ${totalItemQty > 0
              ? "bg-purple-100 text-purple-700 border-purple-200"
              : "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100"
              }`}
          >
            {totalItemQty > 0 ? `${totalItemQty} ADDED` : "ADD"}
            {totalItemQty === 0 && variants.length > 1 && (
              <span className="block text-[9px] font-normal opacity-75 mt-0.5">{variants.length} options</span>
            )}
          </button>
        ) : (
          <QuantityToggle
            shopLat={shopLat}
            shopLng={shopLng}
            shopId={shopId}
            shopName={shopName}
            serviceId={serviceId}
            serviceName={serviceName}
            deliveryTypes={deliveryTypes}
            categoryId={categoryId}
            categoryName={categoryName}
            itemId={item.shopServiceCategoryItemId}
            itemName={item.name}
            unit={item.unit}
            price={getUnitPrice(item)}
            originalUnitPrice={getOriginalUnitPrice(item)}
          />
        )}
      </div>

      <VariantSelectorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={item}
        shopId={shopId}
        shopName={shopName}
        shopLat={shopLat}
        shopLng={shopLng}
        serviceId={serviceId}
        serviceName={serviceName}
        deliveryTypes={deliveryTypes}
        categoryId={categoryId}
        categoryName={categoryName}
      />
    </>
  );
}
