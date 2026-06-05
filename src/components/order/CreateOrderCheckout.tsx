"use client";

import { useCheckout } from "./CheckoutState";
import PaymentAndTotals from "./PaymentAndTotals";
import ServicesBlock from "./ServicesBlock";

export default function CreateOrderCheckout() {
    const { savedAddr } = useCheckout();

    return (
        <div className="mx-auto max-w-2xl space-y-6 bg-purple-50 p-4 rounded-2xl">
            <h2 className="text-xl font-bold text-gray-900">Review & Checkout</h2>

            {/* Address Section */}
            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2">Delivery Address</h3>
                {savedAddr ? (
                    <div className="text-sm text-gray-600">
                        <p>{savedAddr.line1}</p>
                        <p>{savedAddr.area}, {savedAddr.city}</p>
                        <p>{savedAddr.state} - {savedAddr.pincode}</p>
                    </div>
                ) : (
                    <p className="text-sm text-red-500">No address selected</p>
                )}
            </div>

            <ServicesBlock />
            <PaymentAndTotals token={undefined} />
        </div>
    );
}
