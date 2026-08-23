"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import { Loader2 } from "lucide-react";
import GstEditor from "@/components/shop/GstEditor";

export default function BillingClient() {
    const { selectedShop, isLoading: isShopLoading } = useShop();

    if (isShopLoading) {
        return (
            <ProtectedRoute>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8 overflow-y-auto h-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Billing & Fees</h1>
                        <p className="text-gray-500 mt-1">Manage your shop's tax settings and billing preferences.</p>
                    </div>
                </div>

                <div className="pb-12 max-w-3xl space-y-8">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8">
                        {/* GstEditor reads shop.shopId and saves against it, so an
                            empty-object fallback was not just a type error — it
                            would have called updateShopDetails(undefined). */}
                        {selectedShop ? (
                            <GstEditor shop={selectedShop} />
                        ) : (
                            <p className="text-gray-500">
                                Select a shop to manage its tax and billing settings.
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
