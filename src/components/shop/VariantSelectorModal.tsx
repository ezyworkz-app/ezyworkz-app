"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { ShopItem } from "@/types/shop-menu";
import { DeliveryKey, DeliveryType } from "@/types/common";
import QuantityToggle from "../order/QuantityToggle";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    item: ShopItem;
    shopId: string;
    shopName: string;
    shopLat: number;
    shopLng: number;
    serviceId: string;
    serviceName: string;
    deliveryTypes: Record<DeliveryKey, DeliveryType>;
    categoryId: string;
    categoryName: string;
}

export default function VariantSelectorModal({
    isOpen,
    onClose,
    item,
    shopId,
    shopName,
    shopLat,
    shopLng,
    serviceId,
    serviceName,
    deliveryTypes,
    categoryId,
    categoryName,
}: Props) {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen || !item.variants) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl transition-all animate-in slide-in-from-bottom-10 fade-in duration-300">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-slate-800">{item.name}</h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-slate-100 transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
                    Select a Variation
                </p>

                <div className="max-h-[60vh] overflow-y-auto space-y-0 pr-2 -mr-2">
                    {item.variants.map((variant, index) => {
                        if (!variant.isActive) return null;
                        const combinedName = `${item.name} - ${variant.name}`;
                        
                        const variantPrice = Number((variant as any).price ?? (variant as any).pricePerPiece ?? (variant as any).pricePerKg ?? (variant as any).pricePerSft ?? 0);
                        const originalPrice = Number((variant as any).original_price ?? variantPrice);
                        const uniqueId = variant.variantId || `variant-${item.shopServiceCategoryItemId}-${index}`;

                        return (
                            <div
                                key={uniqueId}
                                className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0"
                            >
                                <div>
                                    <p className="font-medium text-slate-800">{variant.name}</p>
                                    <p className="text-sm text-slate-600 font-semibold mt-0.5">₹{variantPrice}</p>
                                </div>

                                <div className="w-32">
                                    <QuantityToggle
                                        shopLat={shopLat}
                                        shopLng={shopLng}
                                        shopId={shopId}
                                        shopName={shopName}
                                        serviceId={serviceId}
                                        serviceName={serviceName}
                                        deliveryTypes={deliveryTypes}
                                        categoryId={categoryId}
                                        categoryName={categoryName}
                                        itemId={uniqueId}
                                        itemName={combinedName}
                                        unit={item.unit}
                                        price={variantPrice}
                                        originalUnitPrice={originalPrice}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full rounded-xl bg-purple-600 py-3 font-semibold text-white shadow-sm hover:bg-purple-700 transition"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
