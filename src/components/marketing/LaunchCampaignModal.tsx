"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Rocket, ChevronDown } from "lucide-react";
import { launchCampaign } from "@/lib/actions/campaigns";
import Button from "@/components/ui/button/Button";

const SEGMENTS = [
    { value: "FIRST_TIME",        label: "Never Ordered",       desc: "Signed up but placed 0 orders", code: "TRYEZYWORKZ" },
    { value: "INACTIVE_ONE_TIME", label: "One-Time Dormant",    desc: "1 order, inactive 45+ days",    code: "MISSEDYOU" },
    { value: "INACTIVE_FREQUENT", label: "Frequent Dormant",    desc: "2+ orders, inactive 45+ days",  code: "EZYWORKZIT" },
    { value: "ALL",               label: "All Segments",        desc: "Every unconverted user",         code: "EZYWORKZBACK" },
];

export default function LaunchCampaignModal() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [segment, setSegment]         = useState("FIRST_TIME");
    const [discountType, setDiscountType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
    const [discountValue, setDiscountValue] = useState(100);
    const [minOrderValue, setMinOrderValue] = useState<number | "">("");
    const [validDays, setValidDays]     = useState(7);
    const [result, setResult]           = useState<{ success: boolean; usersTargeted?: number; tokensSent?: number; couponCode?: string; message?: string } | null>(null);

    const selectedSeg = SEGMENTS.find((s) => s.value === segment)!;

    const handleLaunch = () => {
        startTransition(async () => {
            const res = await launchCampaign({
                segment,
                discountType,
                discountValue,
                minOrderValue: minOrderValue !== "" ? Number(minOrderValue) : undefined,
                validDays,
            });
            setResult(res);
            if (res.success) router.refresh();
        });
    };

    const handleClose = () => { setOpen(false); setResult(null); };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm uppercase tracking-wide"
            >
                <Rocket size={16} />
                Launch Campaign
            </button>

            {open && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
                    <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden">

                        {result ? (
                            /* ── Result screen ── */
                            <div className="p-10 flex flex-col items-center gap-6 text-center">
                                {result.success ? (
                                    <>
                                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center">
                                            <Rocket size={28} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">Campaign Launched!</h3>
                                            <p className="text-sm text-gray-400 mt-2">Notifications sent successfully.</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 w-full">
                                            {[
                                                { label: "Users targeted", value: result.usersTargeted?.toLocaleString() ?? "—" },
                                                { label: "Notifications sent", value: result.tokensSent?.toLocaleString() ?? "—" },
                                                { label: "Coupon code", value: result.couponCode ?? "—" },
                                            ].map((s) => (
                                                <div key={s.label} className="bg-gray-50 dark:bg-white/[0.03] rounded-2xl p-4">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                                                    <p className="text-xl font-black text-gray-900 dark:text-white mt-1">{s.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={handleClose} className="px-8 py-3 bg-brand-500 text-white font-black rounded-2xl text-sm">Done</button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center">
                                            <X size={28} className="text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">Launch Failed</h3>
                                            <p className="text-sm text-red-400 mt-2">{result.message || "Unknown error"}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => setResult(null)} className="px-8 py-3 bg-brand-500 text-white font-black rounded-2xl text-sm">Try Again</button>
                                            <button onClick={handleClose} className="px-8 py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-black rounded-2xl text-sm">Cancel</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            /* ── Config form ── */
                            <div className="flex flex-col md:flex-row">
                                {/* Preview panel */}
                                <div className="w-full md:w-5/12 bg-gray-50 dark:bg-white/[0.02] p-8 border-r border-gray-100 dark:border-white/5 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest bg-brand-50 dark:bg-brand-500/10 px-2 py-1 rounded-md">Preview</span>
                                        <h4 className="text-lg font-black text-gray-900 dark:text-white mt-3">Notification Glance</h4>

                                        <div className="mt-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-white/10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">L</div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Ezyworkz · Now</p>
                                                </div>
                                            </div>
                                            <p className="text-xs font-black text-gray-900 dark:text-white leading-tight">
                                                {discountType === "FIXED" ? `₹${discountValue} off just for you!` : `${discountValue}% off your next wash!`}
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                                Use code <span className="font-mono font-black text-brand-500">{selectedSeg.code}</span> — valid {validDays} days
                                                {minOrderValue ? `, min ₹${minOrderValue}` : ""}.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-brand-50 dark:bg-brand-500/10 rounded-2xl">
                                        <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Target Segment</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white mt-1">{selectedSeg.label}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{selectedSeg.desc}</p>
                                        <p className="text-[10px] font-mono font-black text-brand-500 mt-2">Code: {selectedSeg.code}</p>
                                    </div>
                                </div>

                                {/* Form */}
                                <div className="w-full md:w-7/12 p-8 space-y-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Configure Campaign</h3>
                                            <p className="text-xs font-medium text-gray-400 mt-1">Platform-funded — Ezyworkz absorbs the discount</p>
                                        </div>
                                        <button type="button" onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                                            <X size={18} className="text-gray-400" />
                                        </button>
                                    </div>

                                    {/* Segment */}
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Target Segment</label>
                                        <div className="relative">
                                            <select
                                                value={segment}
                                                onChange={(e) => setSegment(e.target.value)}
                                                className="w-full appearance-none p-3 pr-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                            >
                                                {SEGMENTS.map((s) => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Discount type + value */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Discount Type</label>
                                            <div className="flex rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                                                {(["FIXED", "PERCENTAGE"] as const).map((t) => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setDiscountType(t)}
                                                        className={`flex-1 py-2.5 text-xs font-black transition-colors ${discountType === t ? "bg-brand-500 text-white" : "bg-white dark:bg-gray-950 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"}`}
                                                    >
                                                        {t === "FIXED" ? "₹ Fixed" : "% Percent"}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                                {discountType === "FIXED" ? "Amount (₹)" : "Percent (%)"}
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={discountValue}
                                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Min order + valid days */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Min Order (₹) — optional</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={minOrderValue}
                                                placeholder="No minimum"
                                                onChange={(e) => setMinOrderValue(e.target.value === "" ? "" : Number(e.target.value))}
                                                className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none placeholder:text-gray-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valid Days</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={90}
                                                value={validDays}
                                                onChange={(e) => setValidDays(Number(e.target.value))}
                                                className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLaunch}
                                        disabled={isPending}
                                        className="w-full h-12 bg-brand-500 hover:bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm uppercase tracking-wide disabled:opacity-60 disabled:pointer-events-none"
                                    >
                                        <Rocket size={16} />
                                        {isPending ? "Sending..." : "Launch Campaign"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
