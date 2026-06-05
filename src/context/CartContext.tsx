"use client";

import { DeliveryKey, DeliveryType } from "@/types/common";
// import { DeliveryKey, DeliveryType } from "@/types/common";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";

export type CartLine = {
  shopId: string;
  shopName: string;
  shopLat: number;
  shopLng: number;
  serviceId: string;
  serviceName: string;
  categoryId: string;
  categoryName: string;
  itemId: string;
  itemName: string;
  unit: "piece" | "kg" | "sft";
  price: number;
  qty: number;
  deliveryTypes: Record<DeliveryKey, DeliveryType>;

  originalUnitPrice?: number;

  // ✅ Optional future-proofing fields
  notes?: string;
  addons?: { id: string; name: string; price: number; originalUnitPrice?: number; applyMarkup?: boolean; qty?: number; variationId?: string; variationName?: string }[];
  selectedDeliveryKey?: DeliveryKey;
};

type CartContextType = {
  cartItems: CartLine[];
  addItem: (line: CartLine, skipConfirm?: boolean) => void;
  setQty: (
    itemId: string,
    serviceId: string,
    shopId: string,
    qty: number
  ) => void;
  removeItem: (itemId: string, serviceId: string, shopId: string) => void;
  clear: () => void;
  getItemQty: (itemId: string, serviceId: string, shopId: string) => number;
  replaceCart: (lines: CartLine[]) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);
const LS_KEY = "cart";

const keyOf = (o: { itemId: string; serviceId: string; shopId: string }) =>
  `${o.shopId}-${o.serviceId}-${o.itemId}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setCartItems(JSON.parse(stored));
    } catch {
      localStorage.removeItem(LS_KEY);
    }
  }, []);

  const saveRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      localStorage.setItem(LS_KEY, JSON.stringify(cartItems));
    }, 150);
  }, [cartItems]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === LS_KEY && e.newValue) {
        setCartItems(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const addItem = (line: CartLine, skipConfirm = false) =>
    setCartItems((prev) => {
      const switchingShop = prev.length > 0 && prev[0].shopId !== line.shopId;
      const base = switchingShop ? [] : prev;
      const id = keyOf(line);
      const exists = base.find((x) => keyOf(x) === id);

      return exists
        ? base.map((x) =>
          keyOf(x) === id ? { ...x, qty: x.qty + line.qty } : x
        )
        : [...base, line];
    });

  const setQty = (
    itemId: string,
    serviceId: string,
    shopId: string,
    qty: number
  ) => {
    const id = keyOf({ itemId, serviceId, shopId });
    setCartItems((prev) =>
      qty <= 0
        ? prev.filter((x) => keyOf(x) !== id)
        : prev.map((x) => (keyOf(x) === id ? { ...x, qty } : x))
    );
  };

  const removeItem = (itemId: string, serviceId: string, shopId: string) => {
    const id = keyOf({ itemId, serviceId, shopId });
    setCartItems((prev) => prev.filter((x) => keyOf(x) !== id));
  };

  const clear = () => setCartItems([]);

  const getItemQty = (itemId: string, serviceId: string, shopId: string) => {
    const id = keyOf({ itemId, serviceId, shopId });
    return cartItems.find((x) => keyOf(x) === id)?.qty ?? 0;
  };

  const replaceCart = (lines: CartLine[]) => {
    setCartItems(lines);
  };

  const value = useMemo<CartContextType>(
    () => ({
      cartItems,
      addItem,
      setQty,
      removeItem,
      clear,
      getItemQty,
      replaceCart,
    }),
    [cartItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const useCartTotals = () => {
  const { cartItems } = useCart();
  return useMemo(() => {
    const qty = cartItems.reduce((s, l) => s + l.qty, 0);
    const base = cartItems.reduce((s, l) => s + l.qty * l.price, 0);
    return { qty, base };
  }, [cartItems]);
};

export const useCartTotalsByService = () => {
  const { cartItems } = useCart();
  return useMemo(() => {
    const out: Record<
      string,
      { base: number; qty: number; shopId: string; serviceId: string }
    > = {};
    cartItems.forEach((l) => {
      const key = `${l.shopId}-${l.serviceId}`;
      out[key] ??= {
        base: 0,
        qty: 0,
        shopId: l.shopId,
        serviceId: l.serviceId,
      };
      out[key].base += l.price * l.qty;
      out[key].qty += l.qty;
    });
    return out;
  }, [cartItems]);
};
