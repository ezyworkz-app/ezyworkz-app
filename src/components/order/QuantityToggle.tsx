"use client";

import { useCart } from "@/context/CartContext";
import { DeliveryKey, DeliveryType } from "@/types/common";
import { useEffect, useState } from "react";

type Props = {
  shopId: string;
  shopName: string;
  serviceId: string;
  shopLat: number;
  shopLng: number;
  serviceName: string;
  categoryId: string;
  categoryName: string;
  deliveryTypes: Record<DeliveryKey, DeliveryType>;
  itemId: string;
  itemName: string;
  unit: "piece" | "kg" | "sft";
  price: number;
  originalUnitPrice?: number;
};

export default function QuantityToggle({
  shopId,
  shopName,
  shopLat,
  shopLng,
  serviceId,
  serviceName,
  categoryId,
  categoryName,
  deliveryTypes,
  itemId,
  itemName,
  unit,
  price,
  originalUnitPrice,
}: Props) {
  const { getItemQty, addItem, setQty } = useCart();
  const currentQty = getItemQty(itemId, serviceId, shopId);

  const [inputQty, setInputQty] = useState(
    currentQty > 0 ? String(currentQty) : ""
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const currentQtyStr = currentQty > 0 ? String(currentQty) : "";
    if (!isFocused && inputQty !== currentQtyStr) {
      setInputQty(currentQtyStr);
    }
  }, [currentQty, isFocused]);

  // ✅ parseFloat so user can type decimals
  const qty = parseFloat(inputQty) || 0;

  const handlePlus = () => {
    const newQty = qty + 1; // increment by 1
    setQty(itemId, serviceId, shopId, newQty);
    setInputQty(String(newQty));
  };

  const handleMinus = () => {
    const newQty = Math.max(0, qty - 1); // decrement by 1
    setQty(itemId, serviceId, shopId, newQty);
    setInputQty(newQty === 0 ? "" : String(newQty));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.]/g, "");
    // avoid multiple dots
    val = val.replace(/(\..*)\./g, "$1");
    setInputQty(val);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const finalQty = parseFloat(inputQty) || 0;
    if (finalQty > 0) setQty(itemId, serviceId, shopId, finalQty);
    else setQty(itemId, serviceId, shopId, 0);
  };

  return currentQty > 0 || isFocused ? (
    <div className="flex w-full items-center justify-between rounded-lg border border-purple-200 bg-purple-50 px-2 py-1">
      <button
        onClick={handleMinus}
        className="px-2 text-lg font-bold text-purple-500 transition hover:opacity-80"
      >
        −
      </button>

      <input
        className="w-14 text-center font-semibold text-purple-500 bg-transparent outline-none"
        value={inputQty}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        type="text"
      />

      <button
        onClick={handlePlus}
        className="px-2 text-lg font-bold text-purple-500 transition hover:opacity-80"
      >
        +
      </button>
    </div>
  ) : (
    <button
      onClick={() =>
        addItem({
          shopId,
          shopName,
          shopLat,
          shopLng,
          serviceId,
          serviceName,
          categoryId,
          categoryName,
          unit,
          itemId,
          itemName,
          price,
          originalUnitPrice,
          qty: 1,
          deliveryTypes: deliveryTypes as Record<DeliveryKey, DeliveryType>,
        })
      }
      className="w-full rounded-lg bg-purple-50 py-1 text-sm font-medium text-purple-500 border border-purple-200 transition hover:bg-purple-200"
    >
      Add
    </button>
  );
}
