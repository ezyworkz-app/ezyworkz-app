// src/components/checkout/PaymentAndTotals.tsx
"use client";
import Row from "./Row";
import { useCheckout } from "./CheckoutState";

export default function PaymentAndTotals({ token }: { token?: string }) {
  const {
    totals: {
      base,
      addonsTotal,
      multiplierUpcharge,
      distanceFee,
      deliveryTotal,
      lowCartFee,
      lowCartFeeBreakdown,
      tax,
      discount,
      grand,
      multiplierLabel,
      multiplierBreakdown,
      tripCount,
      shopBaseAmount,
      shopAddonsTotal,
      shopTotalAmount,
    },
    placeOrder,
    pending,
    discountAmount,
    setDiscountAmount,
    addonsBySvc,
  } = useCheckout();

  // ✅ Currency formatter (always 2 decimal places)
  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <>
      <section className="space-y-4 rounded-2xl border-2 border-primary-200 bg-white p-4">
        <div className="space-y-1 text-sm text-gray-700">
          <h2 className="font-bold text-lg">Bill summary</h2>

          <Row label="Items total" value={base} formatFn={formatCurrency} />

          {addonsTotal > 0 && (
            <div className="mt-1">
              <div className="flex justify-between text-gray-700 font-medium">
                <span>Extra Add-ons</span>
                <span>₹{formatCurrency(addonsTotal)}</span>
              </div>
              <ul className="mt-1 ml-4 space-y-0.5 text-xs text-gray-500 italic">
                {Object.values(addonsBySvc).flat().map((a, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{a.name} {a.variationName ? `(${a.variationName})` : ""} × {a.qty}</span>
                    <span>₹{formatCurrency(a.price * a.qty)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {multiplierBreakdown && Object.keys(multiplierBreakdown).length > 0 ? (
            Object.values(multiplierBreakdown).map((item: any, idx) => (
              <Row key={idx} label={item.label} value={item.amount} formatFn={formatCurrency} />
            ))
          ) : (
            multiplierUpcharge > 0 && (
              <Row
                label={multiplierLabel || "Priority fee"}
                value={multiplierUpcharge}
                formatFn={formatCurrency}
              />
            )
          )}

          <Row
            label={tripCount > 1 ? `Delivery charges (x${tripCount})` : "Delivery charges"}
            value={deliveryTotal}
            freeText="FREE"
            greenWhenZero
            formatFn={formatCurrency}
          />

          {/* ✅ Show only when it applies */}
          {lowCartFee > 0 && (
            <div className="mt-1">
              <Row
                label="Low cart fee"
                value={lowCartFee}
                formatFn={formatCurrency}
              />
              {lowCartFeeBreakdown?.breakdown?.length > 0 && (
                <ul className="mt-1 ml-2 space-y-0.5 text-xs text-gray-600">
                  {lowCartFeeBreakdown.breakdown.map((b, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{b.service}</span>
                      <span>₹{formatCurrency(b.fee)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Row label="GST & Tax" value={tax} formatFn={formatCurrency} />

          {/* Admin Discount input */}
          <div className="flex justify-between items-center mt-2">
            <label className="font-medium">Discount (Admin)</label>
            <input
              type="number"
              value={discountAmount}
              onChange={(e) =>
                setDiscountAmount(Math.max(0, Number(e.target.value) || 0))
              }
              className="w-28 border border-gray-300 rounded-lg text-right px-2 py-1"
              placeholder="0"
            />
          </div>

          {/* Show discount as negative value */}
          <Row label="Discount" value={-discount} formatFn={formatCurrency} />

          <div className="flex justify-between pt-2 text-base font-semibold">
            <span>Grand Total</span>
            <span>₹{formatCurrency(grand)}</span>
          </div>
        </div>
      </section>

      {/* ✅ Shop Facing Totals (for Admin transparency) */}
      <section className="space-y-4 rounded-2xl border-2 border-purple-200 bg-purple-50 p-4">
        <div className="space-y-1 text-sm text-purple-900">
          <h2 className="font-bold text-lg">Shop Earnings (Recalculated)</h2>
          <Row label="Shop Base Amount" value={shopBaseAmount} formatFn={formatCurrency} />
          {shopAddonsTotal > 0 && (
            <Row label="Shop Addons Total" value={shopAddonsTotal} formatFn={formatCurrency} />
          )}
          <div className="flex justify-between pt-2 text-base font-bold">
            <span>Shop Grand Total</span>
            <span>₹{formatCurrency(shopTotalAmount)}</span>
          </div>
          <p className="text-[10px] text-purple-600 mt-2">
            * These totals use the shop's original base prices without any markup applied.
          </p>
        </div>
      </section>

      <div className="fixed bottom-0 inset-x-0 z-40 flex justify-center bg-white/90 backdrop-blur-md border-t border-gray-200 px-4 py-3">
        <button
          onClick={placeOrder}
          disabled={pending}
          className="w-[calc(100%-2rem)] max-w-3xl rounded-xl bg-purple-600 px-4 py-3 flex justify-between items-center text-white shadow-md disabled:opacity-50"
        >
          {pending ? "Placing…" : `Place Order – ₹${formatCurrency(grand)}`}
        </button>
      </div>
    </>
  );
}
