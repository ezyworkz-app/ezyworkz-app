"use client";

import React, { useState, useTransition } from "react";
import { Advertisement, upsertAdvertisement, deleteAdvertisement } from "@/lib/actions/advertisements";
import { Plus, Pencil, Trash2, Star, ExternalLink, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

interface Props {
    initialAds: Advertisement[];
}

const PRESET_COLORS = [
    { label: "Gold",    bg: "#B8860B" },
    { label: "Purple",  bg: "#6C3FC5" },
    { label: "Teal",    bg: "#0D9488" },
    { label: "Red",     bg: "#DC2626" },
    { label: "Blue",    bg: "#2563EB" },
    { label: "Black",   bg: "#111111" },
];

function TabBarPreview({ ad }: { ad: Partial<Advertisement> }) {
    const bg = ad.backgroundColor || "#B8860B";
    return (
        <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tab Bar Preview</p>
            <div className="bg-gray-950 rounded-2xl px-6 py-3 flex items-end gap-6 border border-white/10">
                {["Home", "Orders", "Repeat"].map((tab) => (
                    <div key={tab} className="flex flex-col items-center gap-1 opacity-40">
                        <div className="w-5 h-5 rounded bg-white/20" />
                        <span className="text-[9px] text-white">{tab}</span>
                    </div>
                ))}
                <div className="flex flex-col items-center gap-1">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: bg }}
                    >
                        {ad.iconUrl ? (
                            <img src={ad.iconUrl} alt="icon" className="w-5 h-5 object-contain" />
                        ) : (
                            <Star size={16} className="text-yellow-300 fill-yellow-300" />
                        )}
                    </div>
                    <span className="text-[9px] text-white font-semibold truncate max-w-[40px] text-center">
                        {ad.brandName || "Brand"}
                    </span>
                </div>
            </div>
        </div>
    );
}

const EMPTY: Partial<Advertisement> = {
    brandName: "",
    iconUrl: "",
    targetUrl: "",
    backgroundColor: "#B8860B",
    isActive: "TRUE",
};

export default function AdvertisementsClient({ initialAds }: Props) {
    const [ads, setAds] = useState<Advertisement[]>(initialAds);
    const [editing, setEditing] = useState<Partial<Advertisement> | null>(null);
    const [isPending, startTransition] = useTransition();
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const handleSave = () => {
        if (!editing) return;
        startTransition(async () => {
            const res = await upsertAdvertisement(editing);
            if (res.success && res.data) {
                setAds((prev) => {
                    const exists = prev.find((a) => a.adId === res.data!.adId);
                    return exists
                        ? prev.map((a) => (a.adId === res.data!.adId ? res.data! : a))
                        : [res.data!, ...prev];
                });
                setEditing(null);
                showToast("success", editing.adId ? "Advertisement updated." : "Advertisement created.");
            } else {
                showToast("error", res.message || "Save failed.");
            }
        });
    };

    const handleToggle = (ad: Advertisement) => {
        startTransition(async () => {
            const res = await upsertAdvertisement({ ...ad, isActive: ad.isActive === "TRUE" ? "FALSE" : "TRUE" });
            if (res.success && res.data) {
                setAds((prev) => prev.map((a) => (a.adId === res.data!.adId ? res.data! : a)));
            }
        });
    };

    const handleDelete = (adId: string) => {
        startTransition(async () => {
            const res = await deleteAdvertisement(adId);
            if (res.success) {
                setAds((prev) => prev.filter((a) => a.adId !== adId));
                setDeleteConfirm(null);
                showToast("success", "Advertisement deleted.");
            } else {
                showToast("error", res.message || "Delete failed.");
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold transition-all ${
                    toast.type === "success"
                        ? "bg-emerald-500 text-white"
                        : "bg-red-500 text-white"
                }`}>
                    {toast.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Add button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setEditing({ ...EMPTY })}
                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-brand-500/30 transition-all text-sm"
                >
                    <Plus size={16} /> New Advertisement
                </button>
            </div>

            {/* Modal */}
            {editing && (
                <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg p-7 space-y-6 border border-gray-100 dark:border-white/10">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">
                            {editing.adId ? "Edit Advertisement" : "New Advertisement"}
                        </h2>

                        {/* Live preview */}
                        <TabBarPreview ad={editing} />

                        <div className="space-y-4">
                            {/* Brand name */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Brand Name</label>
                                <input
                                    value={editing.brandName || ""}
                                    onChange={(e) => setEditing({ ...editing, brandName: e.target.value })}
                                    placeholder="e.g. Surf Excel"
                                    className="mt-1 w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>

                            {/* Icon URL */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Icon URL <span className="normal-case font-normal text-gray-400">(optional — star shown if blank)</span></label>
                                <input
                                    value={editing.iconUrl || ""}
                                    onChange={(e) => setEditing({ ...editing, iconUrl: e.target.value })}
                                    placeholder="https://cdn.example.com/brand-icon.png"
                                    className="mt-1 w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>

                            {/* Target URL */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Target URL <span className="normal-case font-normal text-gray-400">(where tapping takes the user)</span></label>
                                <input
                                    value={editing.targetUrl || ""}
                                    onChange={(e) => setEditing({ ...editing, targetUrl: e.target.value })}
                                    placeholder="https://partner.launezy.com/offer"
                                    className="mt-1 w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>

                            {/* Background color */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Background Color</label>
                                <div className="mt-2 flex items-center gap-3 flex-wrap">
                                    {PRESET_COLORS.map((p) => (
                                        <button
                                            key={p.bg}
                                            onClick={() => setEditing({ ...editing, backgroundColor: p.bg })}
                                            title={p.label}
                                            className={`w-8 h-8 rounded-xl border-2 transition-all ${
                                                editing.backgroundColor === p.bg
                                                    ? "border-brand-500 scale-110"
                                                    : "border-transparent"
                                            }`}
                                            style={{ backgroundColor: p.bg }}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={editing.backgroundColor || "#B8860B"}
                                        onChange={(e) => setEditing({ ...editing, backgroundColor: e.target.value })}
                                        className="w-8 h-8 rounded-xl border border-gray-200 dark:border-white/10 cursor-pointer"
                                        title="Custom color"
                                    />
                                    <span className="text-xs text-gray-400 font-mono">{editing.backgroundColor}</span>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</label>
                                <button
                                    onClick={() => setEditing({ ...editing, isActive: editing.isActive === "TRUE" ? "FALSE" : "TRUE" })}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        editing.isActive === "TRUE"
                                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                    }`}
                                >
                                    {editing.isActive === "TRUE" ? <><Eye size={12} /> Active</> : <><EyeOff size={12} /> Inactive</>}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setEditing(null)}
                                className="flex-1 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-bold py-2.5 rounded-2xl text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isPending || !editing.brandName}
                                className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white font-bold py-2.5 rounded-2xl text-sm transition-all"
                            >
                                {isPending ? "Saving…" : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-7 max-w-sm w-full space-y-4 border border-gray-100 dark:border-white/10">
                        <p className="text-lg font-black text-gray-900 dark:text-white">Delete this ad?</p>
                        <p className="text-sm text-gray-500">This will remove it from the tab bar immediately.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-bold py-2.5 rounded-2xl text-sm transition-all">
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)} disabled={isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold py-2.5 rounded-2xl text-sm transition-all">
                                {isPending ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ad list */}
            {ads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
                    <Star size={40} className="opacity-20" />
                    <p className="text-sm font-semibold">No advertisements yet. Create one above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {ads.map((ad) => (
                        <div
                            key={ad.adId}
                            className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-white/5 rounded-3xl p-5 shadow-sm space-y-4"
                        >
                            {/* Mini preview */}
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                                    style={{ backgroundColor: ad.backgroundColor || "#B8860B" }}
                                >
                                    {ad.iconUrl ? (
                                        <img src={ad.iconUrl} alt={ad.brandName} className="w-8 h-8 object-contain" />
                                    ) : (
                                        <Star size={22} className="text-yellow-300 fill-yellow-300" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-gray-900 dark:text-white truncate">{ad.brandName}</p>
                                    {ad.targetUrl && (
                                        <a
                                            href={ad.targetUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs text-brand-500 hover:underline truncate"
                                        >
                                            <ExternalLink size={10} /> {ad.targetUrl}
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                    ad.isActive === "TRUE"
                                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                }`}>
                                    {ad.isActive === "TRUE" ? "Active" : "Inactive"}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggle(ad)}
                                        disabled={isPending}
                                        title={ad.isActive === "TRUE" ? "Deactivate" : "Activate"}
                                        className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-all text-gray-500"
                                    >
                                        {ad.isActive === "TRUE" ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button
                                        onClick={() => setEditing({ ...ad })}
                                        className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-all text-gray-500"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(ad.adId)}
                                        className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-all text-red-500"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
