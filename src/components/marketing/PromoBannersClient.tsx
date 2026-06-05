"use client";

import React, { useState, useTransition } from "react";
import { PromoCard, upsertPromoCard, deletePromoCard } from "@/lib/actions/promoBanners";
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";

/* ─── gradient presets the admin can pick ─── */
const GRADIENT_PRESETS = [
    { label: "Purple",  start: "#826CBB", end: "#5B3F9E" },
    { label: "Green",   start: "#059669", end: "#047857" },
    { label: "Amber",   start: "#D97706", end: "#B45309" },
    { label: "Blue",    start: "#2563EB", end: "#1D4ED8" },
    { label: "Rose",    start: "#E11D48", end: "#9F1239" },
    { label: "Teal",    start: "#0D9488", end: "#0F766E" },
];

const ICON_OPTIONS = [
    "pricetag", "people", "flash", "wallet", "gift", "star",
    "heart", "ribbon", "sparkles", "trophy", "megaphone", "checkmark-circle",
];

const ROUTE_OPTIONS = [
    { label: "Home", value: "/" },
    { label: "Refer & Earn", value: "/refer-and-earn" },
    { label: "EZY Coins", value: "/coins" },
    { label: "Wallet", value: "/wallet" },
    { label: "Orders", value: "/orders" },
    { label: "Profile", value: "/AccountScreen" },
];

const EMPTY: Partial<PromoCard> = {
    tag: "OFFER",
    headline: "",
    subText: "",
    ctaText: "Learn more",
    route: "/",
    gradientStart: "#826CBB",
    gradientEnd: "#5B3F9E",
    iconName: "pricetag",
    sortOrder: 10,
    isActive: "TRUE",
};

interface Props { initialCards: PromoCard[] }

export default function PromoBannersClient({ initialCards }: Props) {
    const [cards, setCards] = useState<PromoCard[]>(initialCards);
    const [editing, setEditing] = useState<Partial<PromoCard> | null>(null);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const flash = (type: "ok" | "err", msg: string) => {
        if (type === "ok") { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }
        else { setError(msg); setTimeout(() => setError(null), 4000); }
    };

    const handleSave = () => {
        if (!editing) return;
        if (!editing.headline?.trim()) { flash("err", "Headline is required"); return; }
        startTransition(async () => {
            const res = await upsertPromoCard(editing);
            if (res.success && res.data) {
                setCards(prev => {
                    const idx = prev.findIndex(c => c.adId === res.data!.adId);
                    return idx >= 0
                        ? prev.map(c => c.adId === res.data!.adId ? res.data! : c)
                        : [res.data!, ...prev];
                });
                setEditing(null);
                flash("ok", editing.adId ? "Banner updated!" : "Banner created!");
            } else {
                flash("err", res.message || "Save failed");
            }
        });
    };

    const handleToggle = (card: PromoCard) => {
        startTransition(async () => {
            const res = await upsertPromoCard({ ...card, isActive: card.isActive === "TRUE" ? "FALSE" : "TRUE" });
            if (res.success && res.data) {
                setCards(prev => prev.map(c => c.adId === res.data!.adId ? res.data! : c));
            }
        });
    };

    const handleDelete = (adId: string) => {
        if (!confirm("Delete this banner permanently?")) return;
        startTransition(async () => {
            const res = await deletePromoCard(adId);
            if (res.success) {
                setCards(prev => prev.filter(c => c.adId !== adId));
                flash("ok", "Deleted");
            } else {
                flash("err", res.message || "Delete failed");
            }
        });
    };

    const sortedCards = [...cards].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return (
        <div className="space-y-6">
            {/* Toast */}
            {success && (
                <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-bold animate-in slide-in-from-top-2">
                    ✓ {success}
                </div>
            )}
            {error && (
                <div className="fixed top-6 right-6 z-50 bg-red-500 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-bold animate-in slide-in-from-top-2">
                    ✕ {error}
                </div>
            )}

            {/* Add button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setEditing({ ...EMPTY })}
                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-brand-500/30"
                >
                    <Plus size={16} /> New Banner
                </button>
            </div>

            {/* Modal */}
            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 dark:border-white/10">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">
                                {editing.adId ? "Edit Banner" : "New Banner"}
                            </h2>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Preview */}
                            <div
                                className="w-full h-36 rounded-2xl flex items-center justify-center relative overflow-hidden"
                                style={{ background: `linear-gradient(135deg, ${editing.gradientStart}, ${editing.gradientEnd})` }}
                            >
                                <div className="absolute top-3 left-4">
                                    <span className="bg-white/25 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                        {editing.tag || "TAG"}
                                    </span>
                                </div>
                                <div className="absolute bottom-4 left-4">
                                    <p className="text-white font-black text-2xl leading-none">{editing.headline || "Headline"}</p>
                                    <p className="text-white/80 text-xs mt-1">{editing.subText || "Sub copy"}</p>
                                    <span className="mt-2 inline-block bg-white/20 border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        {editing.ctaText || "CTA"} →
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Tag (e.g. NEW USER OFFER)">
                                    <input className={inputCls} value={editing.tag || ""} onChange={e => setEditing(p => ({ ...p!, tag: e.target.value }))} />
                                </Field>
                                <Field label="Headline (e.g. 10% OFF)">
                                    <input className={inputCls} value={editing.headline || ""} onChange={e => setEditing(p => ({ ...p!, headline: e.target.value }))} />
                                </Field>
                                <Field label="Sub-copy">
                                    <input className={inputCls} value={editing.subText || ""} onChange={e => setEditing(p => ({ ...p!, subText: e.target.value }))} />
                                </Field>
                                <Field label="CTA button text">
                                    <input className={inputCls} value={editing.ctaText || ""} onChange={e => setEditing(p => ({ ...p!, ctaText: e.target.value }))} />
                                </Field>
                                <Field label="Route (in-app screen)">
                                    <select className={inputCls} value={editing.route || "/"} onChange={e => setEditing(p => ({ ...p!, route: e.target.value }))}>
                                        {ROUTE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label} ({r.value})</option>)}
                                    </select>
                                </Field>
                                <Field label="Sort order (lower = first)">
                                    <input type="number" className={inputCls} value={editing.sortOrder ?? 10} onChange={e => setEditing(p => ({ ...p!, sortOrder: Number(e.target.value) }))} />
                                </Field>
                            </div>

                            {/* Gradient presets */}
                            <Field label="Gradient colour">
                                <div className="flex gap-2 flex-wrap">
                                    {GRADIENT_PRESETS.map(g => (
                                        <button
                                            key={g.label}
                                            title={g.label}
                                            onClick={() => setEditing(p => ({ ...p!, gradientStart: g.start, gradientEnd: g.end }))}
                                            className="w-9 h-9 rounded-xl border-2 transition-transform hover:scale-110"
                                            style={{
                                                background: `linear-gradient(135deg, ${g.start}, ${g.end})`,
                                                borderColor: editing.gradientStart === g.start ? "#fff" : "transparent",
                                                outline: editing.gradientStart === g.start ? "2px solid #826CBB" : "none",
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Custom start</p>
                                        <input type="color" className="h-9 w-16 rounded cursor-pointer" value={editing.gradientStart || "#826CBB"} onChange={e => setEditing(p => ({ ...p!, gradientStart: e.target.value }))} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Custom end</p>
                                        <input type="color" className="h-9 w-16 rounded cursor-pointer" value={editing.gradientEnd || "#5B3F9E"} onChange={e => setEditing(p => ({ ...p!, gradientEnd: e.target.value }))} />
                                    </div>
                                </div>
                            </Field>

                            {/* Icon picker */}
                            <Field label="Icon">
                                <div className="flex gap-2 flex-wrap">
                                    {ICON_OPTIONS.map(icon => (
                                        <button
                                            key={icon}
                                            onClick={() => setEditing(p => ({ ...p!, iconName: icon }))}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-colors ${editing.iconName === icon ? "bg-brand-500 text-white border-brand-500" : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-brand-500"}`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            <Field label="Status">
                                <div className="flex gap-3">
                                    {(["TRUE", "FALSE"] as const).map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setEditing(p => ({ ...p!, isActive: v }))}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${editing.isActive === v ? "bg-brand-500 text-white border-brand-500" : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-300"}`}
                                        >
                                            {v === "TRUE" ? "✓ Active" : "✕ Inactive"}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
                            <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={isPending} className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-lg shadow-brand-500/30">
                                {isPending ? "Saving…" : "Save banner"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cards table */}
            {sortedCards.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-4xl mb-3">🖼️</p>
                    <p className="font-semibold">No promo banners yet. Create one to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedCards.map(card => (
                        <div
                            key={card.adId}
                            className={`flex items-center gap-4 bg-white dark:bg-gray-900 border rounded-2xl p-4 transition-all ${card.isActive === "FALSE" ? "opacity-50 border-gray-100 dark:border-white/5" : "border-gray-100 dark:border-white/10 shadow-sm"}`}
                        >
                            {/* Mini preview */}
                            <div
                                className="w-24 h-14 rounded-xl flex-shrink-0 flex items-center justify-center"
                                style={{ background: `linear-gradient(135deg, ${card.gradientStart}, ${card.gradientEnd})` }}
                            >
                                <span className="text-white font-black text-sm text-center px-1 leading-tight">{card.headline}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{card.tag}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${card.isActive === "TRUE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-white/5"}`}>
                                        {card.isActive === "TRUE" ? "Active" : "Inactive"}
                                    </span>
                                    <span className="text-[10px] bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-mono">#{card.sortOrder}</span>
                                </div>
                                <p className="font-black text-gray-900 dark:text-white text-sm mt-0.5 truncate">{card.headline}</p>
                                <p className="text-xs text-gray-400 truncate">{card.subText}</p>
                                <p className="text-xs font-mono text-brand-500 mt-0.5">{card.route}</p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleToggle(card)}
                                    title={card.isActive === "TRUE" ? "Deactivate" : "Activate"}
                                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    {card.isActive === "TRUE" ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                <button
                                    onClick={() => setEditing({ ...card })}
                                    className="p-2 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-500/10 text-gray-400 hover:text-brand-500 transition-colors"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(card.adId)}
                                    className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5 col-span-2 md:col-span-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</label>
            {children}
        </div>
    );
}

const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500";
