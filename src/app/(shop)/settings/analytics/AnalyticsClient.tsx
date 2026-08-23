"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import type { Shop } from "@/types";
import { updateShopDetails } from "@/lib/actions/shops";
import { Loader2, Save, CheckCircle2 } from "lucide-react";

export default function AnalyticsClient() {
    const { selectedShopId, selectedShop, isLoading: isShopLoading, refreshShop } = useShop();

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    // `|| {}` widened the type to `{}`, so every property read below became a
    // compile error. Partial<Shop> keeps the fields visible and optional.
    const shopData: Partial<Shop> = selectedShop ?? {};

    const [googleAnalyticsId, setGoogleAnalyticsId] = useState<string>(shopData.googleAnalyticsId || "");
    const [googleAdsId, setGoogleAdsId] = useState<string>(shopData.googleAdsId || "");
    const [googleAdsCheckoutLabel, setGoogleAdsCheckoutLabel] = useState<string>(shopData.googleAdsCheckoutLabel || "");
    const [googleAdsPurchaseLabel, setGoogleAdsPurchaseLabel] = useState<string>(shopData.googleAdsPurchaseLabel || "");

    useEffect(() => {
        if (selectedShop) {
            setGoogleAnalyticsId(selectedShop.googleAnalyticsId || "");
            setGoogleAdsId(selectedShop.googleAdsId || "");
            setGoogleAdsCheckoutLabel(selectedShop.googleAdsCheckoutLabel || "");
            setGoogleAdsPurchaseLabel(selectedShop.googleAdsPurchaseLabel || "");
        }
    }, [selectedShop]);

    const activeShopId = selectedShopId;

    const handleSave = async () => {
        if (!activeShopId) return;
        setIsSaving(true);
        setSaveMessage(null);

        const payload = {
            googleAnalyticsId,
            googleAdsId,
            googleAdsCheckoutLabel,
            googleAdsPurchaseLabel,
        };

        const result = await updateShopDetails(activeShopId, payload);
        setIsSaving(false);

        if (result.success) {
            setSaveMessage("Settings saved successfully!");
            await refreshShop();
            setTimeout(() => setSaveMessage(null), 3000);
        } else {
            alert(`Failed to save: ${result.error}`);
        }
    };

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
                        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                        <p className="text-gray-500 mt-1">Manage your shop's tracking IDs and analytics integration.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {saveMessage && (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> {saveMessage}
                            </span>
                        )}
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium disabled:opacity-70 transition-colors shadow-sm"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </div>

                <div className="pb-12 max-w-3xl space-y-8">
                    {/* Analytics & Tracking */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Analytics & Tracking</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Google Analytics Measurement ID</label>
                                <input 
                                    type="text" 
                                    value={googleAnalyticsId}
                                    onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. G-XXXXXXXXXX"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Enter your Google Analytics Measurement ID (starts with "G-") to track visitors on your custom domain.
                                </p>
                            </div>
                            <hr className="border-gray-100" />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Google Ads Conversion ID</label>
                                <input 
                                    type="text" 
                                    value={googleAdsId}
                                    onChange={(e) => setGoogleAdsId(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. AW-XXXXXXXXX"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Enter your Google Ads ID (starts with "AW-") to enable conversion tracking and remarketing on your custom domain.
                                </p>
                            </div>
                            <hr className="border-gray-100" />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Google Ads Checkout Conversion Label</label>
                                <input 
                                    type="text" 
                                    value={googleAdsCheckoutLabel}
                                    onChange={(e) => setGoogleAdsCheckoutLabel(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. z01vCLyzwMUcEN664IZE"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Enter the specific conversion label for the "Begin checkout" or "Order placed" event to track successful checkouts in Google Ads.
                                </p>
                            </div>
                            <hr className="border-gray-100" />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Google Ads Purchase Conversion Label</label>
                                <input 
                                    type="text" 
                                    value={googleAdsPurchaseLabel}
                                    onChange={(e) => setGoogleAdsPurchaseLabel(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. y02wDKxzxNVdFO775JAF"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Enter the specific conversion label for the "Purchase" event to track successful payments in Google Ads.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
