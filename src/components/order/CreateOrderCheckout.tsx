"use client";

import { useCheckout } from "./CheckoutState";
import PaymentAndTotals from "./PaymentAndTotals";
import ServicesBlock from "./ServicesBlock";

export default function CreateOrderCheckout() {
    const { savedAddr } = useCheckout();

    // Build a meaningful address display string
    const addressParts: string[] = [];
    if (savedAddr) {
        if (savedAddr.houseNo) addressParts.push(savedAddr.houseNo);
        if (savedAddr.block) addressParts.push(savedAddr.block);
        if (savedAddr.line1) addressParts.push(savedAddr.line1);
    }
    const addressLine1 = addressParts.join(", ") || null;

    const addressLine2Parts: string[] = [];
    if (savedAddr) {
        if (savedAddr.area) addressLine2Parts.push(savedAddr.area);
        if (savedAddr.city) addressLine2Parts.push(savedAddr.city);
    }
    const addressLine2 = addressLine2Parts.join(", ") || null;

    const addressLine3Parts: string[] = [];
    if (savedAddr) {
        if (savedAddr.state) addressLine3Parts.push(savedAddr.state);
        if (savedAddr.pincode) addressLine3Parts.push(savedAddr.pincode);
    }
    const addressLine3 = addressLine3Parts.join(" - ") || null;

    const hasAddress = addressLine1 || addressLine2 || addressLine3;

    return (
        <div className="mx-auto max-w-2xl space-y-6 bg-purple-50 p-4 rounded-2xl">
            <h2 className="text-xl font-bold text-gray-900">Review & Checkout</h2>

            {/* Address Section */}
            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2">Delivery Address</h3>
                {savedAddr && hasAddress ? (
                    <div className="text-sm text-gray-600">
                        {savedAddr.label && (
                            <p className="text-xs font-semibold text-purple-600 uppercase mb-1">{savedAddr.label}</p>
                        )}
                        {addressLine1 && <p>{addressLine1}</p>}
                        {addressLine2 && <p>{addressLine2}</p>}
                        {addressLine3 && <p>{addressLine3}</p>}
                    </div>
                ) : savedAddr ? (
                    <p className="text-sm text-amber-600">Using temporary / pickup address</p>
                ) : (
                    <p className="text-sm text-red-500">No address selected</p>
                )}
            </div>

            <ServicesBlock />
            <PaymentAndTotals token={undefined} />
        </div>
    );
}
