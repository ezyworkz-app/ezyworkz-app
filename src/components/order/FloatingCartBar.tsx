"use client";
import Link from "next/link";
import { useCart, useCartTotals } from "@/context/CartContext";
import { useCheckout } from "./CheckoutState";

export default function FloatingCartBar() {
  const { qty, base } = useCartTotals();
  const { editingOrderId, isFulfillmentMode } = useCheckout();
  if (qty === 0) return null;

  const checkoutUrl = isFulfillmentMode
    ? `/orders/${editingOrderId}/edit?mode=fulfillment`
    : `/orders/${editingOrderId}/edit`;

  return (
    <div className="fixed inset-x-0 bottom-4 flex justify-center">
      <Link
        href={checkoutUrl}
        className="
          w-[calc(100%-2rem)] max-w-3xl
          rounded-xl bg-purple-600 px-4 py-3
          flex justify-between items-center
          text-white shadow-md
        "
      >
        <span>
          {qty} item{qty > 1 && "s"} | ₹{base}
        </span>
        <span className="font-semibold">Checkout →</span>
      </Link>
    </div>
  );
}
