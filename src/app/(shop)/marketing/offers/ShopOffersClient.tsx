"use client";

import React, { useState, useEffect } from "react";
import {
    Tag,
    Plus,
    X,
    StopCircle,
    BadgePercent,
    Zap,
    CalendarDays,
    ShoppingBag,
    Info,
    ChevronDown,
    RefreshCw,
} from "lucide-react";
import apiClient from "@/lib/api/client";
import { useShop } from "@/context/ShopContext";

export type AdminOffer = {
    offerId: string;
    shopId: string;
    templateType: string;
    type: "PERCENTAGE" | "FIXED";
    subType: string;
    discountValue: number;
    minOrderValue?: number;
    maxDiscountAmount?: number;
    targetAudience: string;
    startDate: string;
    endDate: string;
    fundedBy: "SHOP" | "PLATFORM";
    isActive: boolean;
    currentUsageCount?: number;
    title?: string;
    code?: string;
    description?: string;
};

export type CreateOfferPayload = Omit<AdminOffer, "offerId" | "shopId" | "currentUsageCount">;

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

const TEMPLATE_META: Record<string, { label: string; icon: React.ReactNode; color: string; description: string }> = {
    DEAL_OF_THE_DAY: {
        label: "Deal of the Day",
        icon: <Zap className="h-4 w-4" />,
        color: "amber",
        description: "Daily flash discount on specific days",
    },
    FIRST_ORDER: {
        label: "First Order",
        icon: <BadgePercent className="h-4 w-4" />,
        color: "blue",
        description: "Welcome discount for new customers",
    },
    SEASONAL: {
        label: "Seasonal",
        icon: <CalendarDays className="h-4 w-4" />,
        color: "purple",
        description: "Time-bound seasonal promotion",
    },
    LARGE_ORDER: {
        label: "Large Order",
        icon: <ShoppingBag className="h-4 w-4" />,
        color: "green",
        description: "Discount on orders above a threshold",
    },
};

const TEMPLATE_COLORS: Record<string, string> = {
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    green: "bg-green-50 border-green-200 text-green-700",
};

const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    upcoming: "bg-blue-50 text-blue-700 border-blue-200",
    expired: "bg-gray-100 text-gray-500 border-gray-200",
    stopped: "bg-red-50 text-red-600 border-red-200",
};

function getOfferStatus(offer: AdminOffer): "active" | "upcoming" | "expired" | "stopped" {
    if (!offer.isActive) return "stopped";
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);
    if (now < start) return "upcoming";
    if (now > end) return "expired";
    return "active";
}

/* ─────────────────────────────────────────
   Offer Card
───────────────────────────────────────── */
function OfferCard({
    offer,
    shopId,
    onStopped,
}: {
    offer: AdminOffer;
    shopId: string;
    onStopped: () => void;
}) {
    const [stopping, setStopping] = useState(false);
    const status = getOfferStatus(offer);
    const meta = TEMPLATE_META[offer.templateType] ?? {
        label: offer.templateType,
        icon: <Tag className="h-4 w-4" />,
        color: "gray",
        description: "",
    };
    const colorClass = TEMPLATE_COLORS[meta.color] ?? "bg-gray-50 border-gray-200 text-gray-600";

    const handleStop = async () => {
        if (!confirm(`Stop offer "${offer.title || offer.code}"? This cannot be undone.`)) return;
        setStopping(true);
        try {
            await apiClient.patch(`/shops/${shopId}/offers/${offer.offerId}/stop`);
            onStopped();
        } catch (error) {
            console.error("Failed to stop offer", error);
        } finally {
            setStopping(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${colorClass}`}>
                        {meta.icon}
                        {meta.label}
                    </span>
                    {offer.fundedBy === "PLATFORM" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold">
                            Platform Funded
                        </span>
                    )}
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold capitalize ${STATUS_COLORS[status]}`}>
                    {status}
                </span>
            </div>

            <div>
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-gray-900 border border-dashed border-gray-300 rounded-md px-2 py-0.5 bg-gray-50">
                        {offer.code}
                    </span>
                </div>
                {offer.title && (
                    <p className="text-xs text-gray-500 mt-1 font-medium">{offer.title}</p>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 bg-green-50 border border-green-100 text-green-700 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                    {offer.type === "PERCENTAGE" ? `${offer.discountValue}% off` : `₹${offer.discountValue} off`}
                </span>
                {offer.minOrderValue && (
                    <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-500 text-[11px] font-medium px-2.5 py-1 rounded-lg">
                        Min ₹{offer.minOrderValue}
                    </span>
                )}
                {offer.maxDiscountAmount && (
                    <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-500 text-[11px] font-medium px-2.5 py-1 rounded-lg">
                        Cap ₹{offer.maxDiscountAmount}
                    </span>
                )}
                <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-500 text-[11px] font-medium px-2.5 py-1 rounded-lg capitalize">
                    {offer.targetAudience.toLowerCase().replace("_", " ")}
                </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span className="text-[11px] text-gray-400 font-medium">
                    {status === "stopped"
                        ? `Started ${fmtDate(offer.startDate)}`
                        : `${fmtDate(offer.startDate)} → ${fmtDate(offer.endDate)}`}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                    {offer.currentUsageCount ?? 0} uses
                </span>
            </div>

            {(status === "active" || status === "upcoming") && (
                <div className="flex justify-end">
                    <button
                        onClick={handleStop}
                        disabled={stopping}
                        className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                        {stopping ? <RefreshCw className="h-3 w-3 animate-spin" /> : <StopCircle className="h-3 w-3" />}
                        Stop offer
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────
   Create Offer Modal
───────────────────────────────────────── */
const TEMPLATES = ["DEAL_OF_THE_DAY", "FIRST_ORDER", "SEASONAL", "LARGE_ORDER"];

const defaultEndDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
};

const todayStr = () => new Date().toISOString().split("T")[0];

function CreateOfferModal({
    shopId,
    onClose,
    onCreated,
}: {
    shopId: string;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [template, setTemplate] = useState("DEAL_OF_THE_DAY");
    const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
    const [discountValue, setDiscountValue] = useState("");
    const [minOrder, setMinOrder] = useState("");
    const [cap, setCap] = useState("");
    const [audience, setAudience] = useState("ALL");
    const [fundedBy, setFundedBy] = useState<"SHOP" | "PLATFORM">("SHOP");
    const [startDate, setStartDate] = useState(todayStr());
    const [endDate, setEndDate] = useState(defaultEndDate());

    const showCap = template !== "LARGE_ORDER";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!discountValue || Number(discountValue) <= 0) {
            setError("Discount value must be greater than 0");
            return;
        }

        const subTypeMap: Record<string, string> = {
            DEAL_OF_THE_DAY: "DEAL_OF_THE_DAY",
            FIRST_ORDER: "FIRST_ORDER",
            SEASONAL: "SEASONAL",
            LARGE_ORDER: "LARGE_ORDER",
        };

        const payload: CreateOfferPayload = {
            templateType: template,
            type: discountType,
            subType: subTypeMap[template] || template,
            discountValue: Number(discountValue),
            targetAudience: audience,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            fundedBy,
            isActive: true,
            ...(minOrder ? { minOrderValue: Number(minOrder) } : {}),
            ...(cap && showCap ? { maxDiscountAmount: Number(cap) } : {}),
        };

        setIsPending(true);
        try {
            await apiClient.post(`/shops/${shopId}/offers`, payload);
            onCreated();
            onClose();
        } catch (error: any) {
            setError(error.response?.data?.message ?? "Failed to create offer");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-base font-black text-gray-900 tracking-tight">Create Offer</h2>
                        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Admin — on behalf of shop</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="h-4 w-4 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    <div>
                        <label className="text-xs font-black text-gray-700 uppercase tracking-widest mb-2 block">Template</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TEMPLATES.map((t) => {
                                const m = TEMPLATE_META[t];
                                const active = template === t;
                                const clr = TEMPLATE_COLORS[m.color];
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setTemplate(t)}
                                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${active
                                            ? `${clr} ring-2 ring-offset-1 ring-current`
                                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                                            }`}
                                    >
                                        <span className={active ? "" : "text-gray-400"}>{m.icon}</span>
                                        <div>
                                            <div className="text-[11px] font-bold leading-none">{m.label}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{m.description}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-black text-gray-700 uppercase tracking-widest mb-1.5 block">Type</label>
                            <div className="flex rounded-xl overflow-hidden border border-gray-200">
                                {(["PERCENTAGE", "FIXED"] as const).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setDiscountType(t)}
                                        className={`flex-1 py-2 text-xs font-bold transition-all ${discountType === t
                                            ? "bg-brand-500 text-white"
                                            : "bg-white text-gray-500 hover:bg-gray-50"
                                            }`}
                                    >
                                        {t === "PERCENTAGE" ? "%" : "₹ Fixed"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-700 uppercase tracking-widest mb-1.5 block">
                                {discountType === "PERCENTAGE" ? "% Off" : "₹ Off"}
                            </label>
                            <input
                                type="number"
                                required
                                min={1}
                                max={discountType === "PERCENTAGE" ? 100 : undefined}
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                placeholder="e.g. 20"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-black text-gray-700 uppercase tracking-widest mb-1.5 block">Min Order (₹)</label>
                            <input
                                type="number"
                                min={0}
                                value={minOrder}
                                onChange={(e) => setMinOrder(e.target.value)}
                                placeholder="Optional"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                            />
                        </div>
                        {showCap && (
                            <div>
                                <label className="text-xs font-black text-gray-700 uppercase tracking-widest mb-1.5 block">Max Discount (₹)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={cap}
                                    onChange={(e) => setCap(e.target.value)}
                                    placeholder="Optional cap"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-black text-gray-700 uppercase tracking-widest mb-1.5 block">Start Date</label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-700 uppercase tracking-widest mb-1.5 block">End Date</label>
                            <input
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black text-gray-700 uppercase tracking-widest mb-1.5 block">Target Audience</label>
                        <div className="relative">
                            <select
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 pr-8"
                            >
                                <option value="ALL">All Customers</option>
                                <option value="NEW_USERS">New Users Only</option>
                                <option value="EXISTING_USERS">Existing Users Only</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black text-gray-700 uppercase tracking-widest mb-1.5 block">Funded By</label>
                        <div className="flex rounded-xl overflow-hidden border border-gray-200">
                            {(["SHOP", "PLATFORM"] as const).map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setFundedBy(f)}
                                    className={`flex-1 py-2 text-xs font-bold transition-all ${fundedBy === f
                                        ? f === "PLATFORM"
                                            ? "bg-purple-600 text-white"
                                            : "bg-brand-500 text-white"
                                        : "bg-white text-gray-500 hover:bg-gray-50"
                                        }`}
                                >
                                    {f === "PLATFORM" ? "🏢 Platform" : "🏪 Shop"}
                                </button>
                            ))}
                        </div>
                        {fundedBy === "PLATFORM" && (
                            <div className="mt-2 flex items-start gap-1.5 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
                                <Info className="h-3.5 w-3.5 text-purple-500 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-purple-600 font-medium">
                                    This offer will be funded by Launezy platform. The shop will be reimbursed for the discount amount.
                                </p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
                            {error}
                        </div>
                    )}
                </form>

                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit as any}
                        disabled={isPending}
                        className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-black transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        {isPending ? "Creating…" : "Create Offer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
type Tab = "active" | "upcoming" | "past";

export default function ShopOffersClient({ initialOffers }: { initialOffers: AdminOffer[] }) {
    const { selectedShopId, isLoading: shopLoading } = useShop();
    const [offers, setOffers] = useState<AdminOffer[]>(initialOffers);
    const [activeTab, setActiveTab] = useState<Tab>("active");
    const [showCreate, setShowCreate] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchOffers = async () => {
        if (!selectedShopId) return;
        setLoading(true);
        try {
            const res = await apiClient.get(`/shops/${selectedShopId}/offers`);
            setOffers(res.data.offers || []);
        } catch (error) {
            console.error("Failed to fetch offers", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!shopLoading && selectedShopId) {
            // Only fetch if offers are empty meaning initial load was missing them or user changed shop
            if (offers.length === 0) {
                fetchOffers();
            }
        }
    }, [selectedShopId, shopLoading]);

    const refresh = () => fetchOffers();

    const filtered = offers.filter((o) => {
        const s = getOfferStatus(o);
        if (activeTab === "active") return s === "active";
        if (activeTab === "upcoming") return s === "upcoming";
        return s === "expired" || s === "stopped";
    });

    const count = (tab: Tab) =>
        offers.filter((o) => {
            const s = getOfferStatus(o);
            if (tab === "active") return s === "active";
            if (tab === "upcoming") return s === "upcoming";
            return s === "expired" || s === "stopped";
        }).length;

    const tabs: { key: Tab; label: string }[] = [
        { key: "active", label: "Active" },
        { key: "upcoming", label: "Upcoming" },
        { key: "past", label: "Past" },
    ];

    if (!selectedShopId && !shopLoading) return <div className="p-4 text-center">No shop selected</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2 px-1">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">
                            Offers
                        </h1>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 uppercase tracking-widest">
                            Marketing
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Create Offer
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 px-6 py-2 rounded-3xl border border-gray-200 dark:border-gray-800">
                <div className="flex space-x-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar pb-1">
                    {tabs.map(({ key, label }) => {
                        const active = activeTab === key;
                        const c = count(key);
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`shrink-0 py-3 px-4 text-xs font-bold transition-all duration-200 flex items-center gap-2 relative whitespace-nowrap ${active
                                    ? "text-brand-500"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {label}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${active
                                    ? "bg-brand-50 text-brand-500"
                                    : "bg-gray-100 text-gray-500"
                                    }`}>
                                    {c}
                                </span>
                                {active && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading || (shopLoading && offers.length === 0) ? (
                <div className="flex justify-center p-8">
                    <RefreshCw className="animate-spin text-gray-400" />
                </div>
            ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((offer) => (
                        <OfferCard
                            key={offer.offerId}
                            offer={offer}
                            shopId={selectedShopId!}
                            onStopped={refresh}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
                        <Tag className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-400">No {activeTab} offers</p>
                    <p className="text-xs text-gray-300 mt-1">
                        {activeTab === "active" ? "Create an offer to get started" : "Nothing here yet"}
                    </p>
                </div>
            )}

            {showCreate && selectedShopId && (
                <CreateOfferModal
                    shopId={selectedShopId}
                    onClose={() => setShowCreate(false)}
                    onCreated={refresh}
                />
            )}
        </div>
    );
}
