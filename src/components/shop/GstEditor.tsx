"use client";

import React, { useState, useEffect } from "react";
// Matches the shape ShopContext provides — see the note in @/types/index.ts
import { Shop } from "@/types";
import { updateShopDetails } from "@/lib/actions/shops";
import { useShop } from "@/context/ShopContext";

const GST_RATES = [5, 12, 18, 28];

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

interface Props {
    shop: Shop;
}

export default function GstEditor({ shop }: Props) {
    const [gstEnabled, setGstEnabled] = useState<boolean>(shop.gstEnabled ?? false);
    const [gstNumber, setGstNumber]   = useState<string>(shop.gstNumber ?? "");
    const [gstRate, setGstRate]       = useState<number>(shop.gstRate ?? 18);
    
    const [deliveryFeeEnabled, setDeliveryFeeEnabled] = useState<boolean>(shop.deliveryFeeEnabled ?? false);
    const [baseDeliveryFee, setBaseDeliveryFee] = useState<number>(shop.baseDeliveryFee ?? 0);
    const [freeDeliveryRadius, setFreeDeliveryRadius] = useState<number>(shop.freeDeliveryRadius ?? 0);
    const [baseDeliveryRadius, setBaseDeliveryRadius] = useState<number>(shop.baseDeliveryRadius ?? 0);
    const [deliveryFeePerKm, setDeliveryFeePerKm] = useState<number>(shop.deliveryFeePerKm ?? 0);
    const [lowCartFeeEnabled, setLowCartFeeEnabled] = useState<boolean>(shop.lowCartFeeEnabled ?? false);
    // Default ON for new shops (field absent), OFF only when explicitly saved as false.
    const [autoWhatsappEnabled, setAutoWhatsappEnabled] = useState<boolean>(shop.autoWhatsappEnabled !== false);

    // Re-sync whenever the parent shop prop changes (e.g. context finishes loading after mount)
    useEffect(() => {
        setGstEnabled(shop.gstEnabled ?? false);
        setGstNumber(shop.gstNumber ?? "");
        setGstRate(shop.gstRate ?? 18);
        setDeliveryFeeEnabled(shop.deliveryFeeEnabled ?? false);
        setBaseDeliveryFee(shop.baseDeliveryFee ?? 0);
        setFreeDeliveryRadius(shop.freeDeliveryRadius ?? 0);
        setBaseDeliveryRadius(shop.baseDeliveryRadius ?? 0);
        setDeliveryFeePerKm(shop.deliveryFeePerKm ?? 0);
        setLowCartFeeEnabled(shop.lowCartFeeEnabled ?? false);
        // Read the exact saved boolean: false stays false, undefined defaults to true.
        setAutoWhatsappEnabled(shop.autoWhatsappEnabled !== false);
    }, [shop.shopId, shop.autoWhatsappEnabled, shop.gstEnabled, shop.gstNumber,
        shop.gstRate, shop.deliveryFeeEnabled, shop.baseDeliveryFee,
        shop.freeDeliveryRadius, shop.baseDeliveryRadius, shop.deliveryFeePerKm,
        shop.lowCartFeeEnabled]);

    const [saving, setSaving]         = useState(false);
    const [msg, setMsg]               = useState<{ type: "success" | "error"; text: string } | null>(null);

    const { refreshShop } = useShop();
    const gstinValid = !gstEnabled || !gstNumber || GSTIN_REGEX.test(gstNumber.toUpperCase());

    const handleSave = async () => {
        if (gstEnabled && gstNumber && !GSTIN_REGEX.test(gstNumber.toUpperCase())) {
            setMsg({ type: "error", text: "Invalid GSTIN format (e.g. 29ABCDE1234F1Z5)." });
            return;
        }
        setSaving(true);
        setMsg(null);
        try {
            const res = await updateShopDetails(shop.shopId, {
                gstEnabled,
                gstNumber: gstEnabled ? gstNumber.toUpperCase().trim() : undefined,
                gstRate: gstEnabled ? gstRate : 0,
                gstPercentage: gstEnabled ? gstRate : 0,
                deliveryFeeEnabled,
                baseDeliveryFee: deliveryFeeEnabled ? baseDeliveryFee : 0,
                freeDeliveryRadius: deliveryFeeEnabled ? freeDeliveryRadius : 0,
                baseDeliveryRadius: deliveryFeeEnabled ? baseDeliveryRadius : 0,
                deliveryFeePerKm: deliveryFeeEnabled ? deliveryFeePerKm : 0,
                lowCartFeeEnabled,
                autoWhatsappEnabled,
            });
            if (res.success) {
                setMsg({ type: "success", text: "Billing & preferences saved successfully." });
                // Re-fetch shop so context reflects the confirmed server state
                refreshShop().catch(() => {});
            } else {
                setMsg({ type: "error", text: res.error || "Save failed." });
            }
        } catch (e: any) {
            setMsg({ type: "error", text: e.message || "Unexpected error." });
        } finally {
            setSaving(false);
        }
    };

    const exampleBase = 500;
    const gstAmount   = gstEnabled ? Math.round(exampleBase * gstRate / 100 * 100) / 100 : 0;
    const exampleTotal = exampleBase + gstAmount;

    return (
        <div className="space-y-6 max-w-lg">
            {/* GST Card */}
            <div>
                <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        GST Applicability
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        When enabled, GST is added on top of this shop's service prices — similar to how the commission markup works. Delivery charges are excluded. The GST amount is tracked per order for settlement.
                    </p>
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-white/10 mt-4">
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">GST Applicable</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {gstEnabled
                                ? `Service prices include ${gstRate}% GST`
                                : "No GST applied to this shop's orders"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setGstEnabled(v => !v); setMsg(null); }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            gstEnabled ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                            gstEnabled ? "translate-x-6" : "translate-x-1"
                        }`} />
                    </button>
                </div>

                {gstEnabled && (
                    <div className="space-y-5 mt-4">
                        {/* GST Rate */}
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                GST Rate
                            </label>
                            <div className="flex gap-2">
                                {GST_RATES.map(rate => (
                                    <button
                                        key={rate}
                                        type="button"
                                        onClick={() => setGstRate(rate)}
                                        className={`px-5 py-2 rounded-xl text-sm font-bold border transition-all ${
                                            gstRate === rate
                                                ? "bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/30"
                                                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-brand-400"
                                        }`}
                                    >
                                        {rate}%
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Most laundry &amp; dry-cleaning services: <strong>18%</strong>. Confirm with your CA.
                            </p>
                        </div>

                        {/* GSTIN */}
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                GSTIN <span className="normal-case font-normal text-gray-400">(optional — for records)</span>
                            </label>
                            <input
                                type="text"
                                value={gstNumber}
                                onChange={e => setGstNumber(e.target.value.toUpperCase())}
                                placeholder="29ABCDE1234F1Z5"
                                maxLength={15}
                                className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition ${
                                    gstNumber && !gstinValid
                                        ? "border-red-400 focus:ring-red-400/20"
                                        : "border-gray-200 dark:border-white/10 focus:ring-brand-500/20"
                                }`}
                            />
                            {gstNumber && !gstinValid && (
                                <p className="text-xs text-red-500 mt-1">Invalid GSTIN — must be 15 chars (e.g. 29ABCDE1234F1Z5)</p>
                            )}
                            {gstNumber.length === 15 && gstinValid && (
                                <p className="text-xs text-emerald-500 mt-1">✓ Valid format</p>
                            )}
                        </div>

                        {/* Price impact preview */}
                        <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-400/20">
                            <p className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3">
                                Price impact (example ₹{exampleBase} order)
                            </p>
                            <div className="space-y-1 text-sm font-mono text-gray-700 dark:text-gray-300">
                                <div className="flex justify-between">
                                    <span>Services subtotal</span>
                                    <span>₹{exampleBase.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-brand-600 dark:text-brand-400 text-xs">
                                    <span>+ GST ({gstRate}%) on services</span>
                                    <span>₹{gstAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500 text-xs">
                                    <span>+ Delivery charges</span>
                                    <span>₹50.00</span>
                                </div>
                                <div className="flex justify-between font-bold border-t border-brand-200 dark:border-brand-400/30 pt-2 mt-1">
                                    <span>Customer pays</span>
                                    <span>₹{(exampleTotal + 50).toFixed(2)}</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-3">
                                GST is applied to service prices only. Delivery is excluded. The GST amount (₹{gstAmount.toFixed(2)}) is tracked internally per order for accounting.
                            </p>
                        </div>
                    </div>
                )}

                {!gstEnabled && (
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-white/8 mt-4">
                        <p className="text-sm text-gray-500">
                            No GST will be applied to orders from this shop. Customer pays base service price + delivery only.
                        </p>
                    </div>
                )}
            </div>

            {/* Delivery Fee Card */}
            <div className="border-t pt-6">
                <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        Delivery Fee Preferences
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        When enabled, a standard base delivery fee is added to orders requiring home delivery during checkout.
                    </p>
                </div>
                
                {/* Delivery Fee Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-white/10 mt-4">
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Charge Delivery Fee</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {deliveryFeeEnabled
                                ? `Base delivery fee of ₹${baseDeliveryFee} will be charged`
                                : "No delivery fee applied to orders"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setDeliveryFeeEnabled(v => !v); setMsg(null); }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            deliveryFeeEnabled ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                            deliveryFeeEnabled ? "translate-x-6" : "translate-x-1"
                        }`} />
                    </button>
                </div>

                {deliveryFeeEnabled && (
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                Base Delivery Fee (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={baseDeliveryFee}
                                onChange={e => setBaseDeliveryFee(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 border-gray-200 dark:border-white/10 transition"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2" title="Up to this distance, delivery is free.">
                                    Free Radius (km)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={freeDeliveryRadius}
                                    onChange={e => setFreeDeliveryRadius(parseFloat(e.target.value) || 0)}
                                    placeholder="e.g. 0.5"
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 border-gray-200 dark:border-white/10 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2" title="Up to this distance (after free radius), base fee applies.">
                                    Base Radius (km)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={baseDeliveryRadius}
                                    onChange={e => setBaseDeliveryRadius(parseFloat(e.target.value) || 0)}
                                    placeholder="e.g. 1.5"
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 border-gray-200 dark:border-white/10 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2" title="Charge for every extra km beyond base radius.">
                                    Extra Charge/km (₹)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={deliveryFeePerKm}
                                    onChange={e => setDeliveryFeePerKm(parseFloat(e.target.value) || 0)}
                                    placeholder="e.g. 15"
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 border-gray-200 dark:border-white/10 transition"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Example: Up to {freeDeliveryRadius} km is free. Up to {baseDeliveryRadius} km costs ₹{baseDeliveryFee}. After that, it costs ₹{deliveryFeePerKm} per km.
                        </p>
                    </div>
                )}
            </div>

            {/* Low Cart Fee Card */}
            <div className="border-t pt-6">
                <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        Low Cart Fee Preferences
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        When enabled, a low cart fee is automatically calculated and added if order subtotal is below minimum service thresholds to help cover platform costs.
                    </p>
                </div>
                
                {/* Low Cart Fee Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-white/10 mt-4">
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Enable Low Cart Fee</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {lowCartFeeEnabled
                                ? "Low cart recovery fee is active"
                                : "No low cart fee applied"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setLowCartFeeEnabled(v => !v); setMsg(null); }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            lowCartFeeEnabled ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                            lowCartFeeEnabled ? "translate-x-6" : "translate-x-1"
                        }`} />
                    </button>
                </div>

                {/* Automated WhatsApp Messages Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-white/10 mt-4">
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Automated WhatsApp Messages</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {autoWhatsappEnabled
                                ? "Automated WhatsApp order status updates & digital receipts are enabled (default)"
                                : "Automated WhatsApp order notifications are disabled for this shop"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setAutoWhatsappEnabled(v => !v); setMsg(null); }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            autoWhatsappEnabled ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                            autoWhatsappEnabled ? "translate-x-6" : "translate-x-1"
                        }`} />
                    </button>
                </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-4 pt-4 border-t">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || (gstEnabled && gstNumber.length > 0 && !gstinValid)}
                    className="px-6 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {saving ? "Saving…" : "Save Preferences"}
                </button>
                {msg && (
                    <span className={`text-sm font-semibold ${msg.type === "success" ? "text-emerald-500" : "text-red-500"}`}>
                        {msg.type === "success" ? "✓ " : "✗ "}{msg.text}
                    </span>
                )}
            </div>
        </div>
    );
}
