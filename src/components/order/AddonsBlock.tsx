"use client";

import React from "react";
import { useCheckout } from "./CheckoutState";
import { Modal } from "../ui/modal";
import { useState } from "react";

type ApiAddon = { 
    addonId: string; 
    name: string; 
    price: number; 
    originalUnitPrice?: number; 
    applyMarkup?: boolean;
    variations?: { id: string; name: string; price: number; originalUnitPrice: number }[];
};

export default function AddonsBlock({
    svcKey,
    addons,
    loading,
}: {
    svcKey: string;
    addons: ApiAddon[];
    loading?: boolean;
}) {
    const { addonsBySvc, setAddonQty } = useCheckout();
    const [showModalAddon, setShowModalAddon] = useState<ApiAddon | null>(null);

    const selected = addonsBySvc[svcKey] ?? [];

    const getAddonSelections = (id: string) =>
        selected.filter((s) => s.addonId === id);

    const getTotalQty = (id: string) =>
        getAddonSelections(id).reduce((sum, s) => sum + s.qty, 0);

    const handleMinus = (a: ApiAddon, variationId?: string) => {
        const selections = getAddonSelections(a.addonId);
        let target;

        if (variationId) {
            target = selections.find(s => s.variationId === variationId);
        } else {
            target = selections.find(s => !s.variationId);
        }

        if (!target) return;

        const newQty = Math.max(0, target.qty - 1);
        setAddonQty(
            svcKey,
            {
                addonId: a.addonId,
                name: target.name,
                price: target.price,
                originalUnitPrice: target.originalUnitPrice,
                applyMarkup: target.applyMarkup ?? a.applyMarkup,
                variationId: target.variationId,
                variationName: target.variationName,
            },
            newQty
        );
    };

    const handlePlus = (a: ApiAddon, v?: { id: string; name: string; price: number; originalUnitPrice: number }) => {
        const selections = getAddonSelections(a.addonId);
        let target;

        if (v) {
            target = selections.find(s => s.variationId === v.id);
        } else {
            target = selections.find(s => !s.variationId);
        }

        const currentQty = target?.qty ?? 0;
        const newQty = currentQty + 1;

        // Correctly derive originalUnitPrice from the API data to avoid backend "Price Pollution"
        const originalPrice = v ? v.originalUnitPrice : a.originalUnitPrice;

        setAddonQty(
            svcKey,
            {
                addonId: a.addonId,
                name: v ? `${a.name} - ${v.name}` : a.name,
                price: v ? v.price : a.price,
                originalUnitPrice: originalPrice ?? (v ? v.price : a.price),
                applyMarkup: a.applyMarkup,
                variationId: v?.id,
                variationName: v?.name,
            },
            newQty
        );
    };

    const formatPrice = (p: number) =>
        `₹${Number(Math.round(p * 100) / 100).toLocaleString("en-IN", {
            minimumFractionDigits: p % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2,
        })}`;

    if (!loading && (!addons || addons.length === 0)) {
        return null;
    }

    return (
        <div className="pt-4 pb-2">
            <h3 className="text-base font-bold text-gray-900 mb-0.5">Extra Add-ons</h3>
            <p className="text-xs text-gray-500 mb-3">Recommended for better wash quality</p>

            {!selected.length && (
                <div className="flex items-center bg-purple-50 px-3 py-2 rounded-lg mb-4 self-start max-w-fit">
                    <span className="text-[10px] text-purple-700 font-bold">💡 Tip: 1 Add-on per 4kg load is recommended</span>
                </div>
            )}

            {loading ? (
                <div className="flex items-center gap-2 p-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading add-ons...</span>
                </div>
            ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {addons.map((a) => {
                        const totalQty = getTotalQty(a.addonId);
                        const hasVariations = a.variations && a.variations.length > 0;

                        return (
                            <div
                                key={a.addonId}
                                className={`flex-shrink-0 w-[160px] p-3 rounded-2xl border-2 flex flex-col justify-between min-h-[130px] transition ${totalQty > 0
                                    ? "border-purple-600 bg-purple-50"
                                    : "border-gray-200 bg-white"
                                    }`}
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight mb-1">
                                        {a.name}
                                    </p>
                                    {!hasVariations && (
                                        <p className="text-sm font-bold text-gray-900">
                                            {formatPrice(a.price)}
                                        </p>
                                    )}
                                    {hasVariations && (
                                        <div className="mt-2">
                                            <button
                                                onClick={() => setShowModalAddon(a)}
                                                className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition ${totalQty > 0
                                                    ? "bg-purple-600 text-white"
                                                    : "border border-purple-600 text-purple-600 bg-white hover:bg-purple-50"
                                                    }`}
                                            >
                                                {totalQty > 0 ? `EDIT (${totalQty})` : "SELECT +"}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {!hasVariations && (
                                    totalQty > 0 ? (
                                        <div className="flex items-center justify-between bg-purple-600 rounded-lg p-1 text-white">
                                            <button
                                                onClick={() => handleMinus(a)}
                                                className="w-8 h-8 flex items-center justify-center font-bold text-lg"
                                            >
                                                −
                                            </button>
                                            <span className="font-bold text-sm">{totalQty}</span>
                                            <button
                                                onClick={() => handlePlus(a)}
                                                className="w-8 h-8 flex items-center justify-center font-bold text-lg"
                                            >
                                                +
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handlePlus(a)}
                                            className="w-full py-2 rounded-lg border border-purple-600 text-purple-600 text-xs font-bold bg-white hover:bg-purple-50 transition"
                                        >
                                            ADD +
                                        </button>
                                    )
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Selected variations summary as chips */}
            <div className="flex flex-wrap gap-2 mt-4">
                {selected.filter(s => s.variationId).map(s => (
                    <div key={`${s.addonId}-${s.variationId}`} className="bg-purple-50 border border-purple-200 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {s.name} - {s.variationName} × {s.qty}
                    </div>
                ))}
            </div>

            {/* Variation Selection Modal */}
            <Modal
                isOpen={!!showModalAddon}
                onClose={() => setShowModalAddon(null)}
                className="max-w-md"
            >
                {showModalAddon && (
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">{showModalAddon.name}</h2>
                        <p className="text-sm text-gray-500 mb-6">Select variations and quantities</p>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {showModalAddon.variations?.map(v => {
                                const vQty = selected.find(s => s.addonId === showModalAddon.addonId && s.variationId === v.id)?.qty ?? 0;
                                return (
                                    <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900">{v.name}</span>
                                            <span className="text-xs text-purple-600 font-bold">{formatPrice(v.price)}</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white border border-purple-100 rounded-lg p-1 shadow-sm">
                                            <button
                                                onClick={() => handleMinus(showModalAddon, v.id)}
                                                className="w-8 h-8 flex items-center justify-center text-purple-600 hover:bg-purple-50 rounded-md transition-colors font-bold text-lg"
                                            >
                                                −
                                            </button>
                                            <span className="text-sm font-bold min-w-[20px] text-center">{vQty}</span>
                                            <button
                                                onClick={() => handlePlus(showModalAddon, v)}
                                                className="w-8 h-8 flex items-center justify-center text-purple-600 hover:bg-purple-50 rounded-md transition-colors font-bold text-lg"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setShowModalAddon(null)}
                            className="w-full mt-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200"
                        >
                            DONE
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
