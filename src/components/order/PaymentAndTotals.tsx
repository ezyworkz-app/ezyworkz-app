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
      shopDiscount,
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
    shopDiscountAmount,
    setShopDiscountAmount,
    addonsBySvc,
    applyDeliveryFee,
    setApplyDeliveryFee,
    applyGst,
    setApplyGst,
    applyLowCartFee,
    setApplyLowCartFee,
    initialDistanceFee,
    setInitialDistanceFee,
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
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Billing Adjustments</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-semibold text-gray-800">Delivery Fee</label>
                <p className="text-xs text-gray-500">Add delivery charges to the order</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={applyDeliveryFee}
                  onChange={(e) => setApplyDeliveryFee(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            {applyDeliveryFee && (
              <div className="flex justify-between items-center mt-1">
                <label className="text-xs font-medium text-gray-600">Delivery Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                  <input
                    type="number"
                    value={initialDistanceFee || ""}
                    onChange={(e) => setInitialDistanceFee(Math.max(0, Number(e.target.value) || 0))}
                    className="w-24 pl-7 pr-2 py-1 border border-gray-300 rounded-lg text-right text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-semibold text-gray-800">GST / Tax</label>
              <p className="text-xs text-gray-500">Apply goods and services tax</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={applyGst}
                onChange={(e) => setApplyGst(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <div className="space-y-0.5">
              <label className="text-sm font-semibold text-gray-800">Low Cart Fee</label>
              <p className="text-xs text-gray-500">Apply low cart penalty if applicable</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={applyLowCartFee}
                onChange={(e) => setApplyLowCartFee(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </section>

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

          {/* Shop Discount input */}
          <div className="flex justify-between items-center mt-2">
            <label className="font-medium">Discount</label>
            <input
              type="number"
              value={shopDiscountAmount}
              onChange={(e) =>
                setShopDiscountAmount(Math.max(0, Number(e.target.value) || 0))
              }
              className="w-28 border border-gray-300 rounded-lg text-right px-2 py-1"
              placeholder="0"
            />
          </div>

          {/* Show discount as negative value (both combined) */}
          <Row label="Discount" value={-(discount + shopDiscount)} formatFn={formatCurrency} />

          <div className="flex justify-between pt-2 text-base font-semibold">
            <span>Grand Total</span>
            <span>₹{formatCurrency(grand)}</span>
          </div>
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
