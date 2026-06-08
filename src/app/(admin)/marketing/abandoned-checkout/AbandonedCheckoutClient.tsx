"use client";

import React, { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    notifyAbandonedCheckoutUsers,
    triggerReEngagementSweep,
    sendCsvReEngagement,
    fetchPosthogAbandonedUsers,
    sendPosthogReEngagement,
    CsvRow,
    AbandonedCheckoutUser,
} from "@/lib/actions/abandoned-checkout";
import { Bell, Send, Clock, ShoppingBag, Phone, CheckCircle, XCircle, AlertCircle, RefreshCw, Upload, FileText, Zap, Eye, Smartphone } from "lucide-react";

// Notification messages — must match csv-reengagement.service.ts MESSAGES array
const NOTIFICATION_VARIANTS = [
  {
    title: "Still thinking about it? 🤔",
    body: (name: string) => `Hi ${name}, your laundry is waiting! Use code TRYLAUNEZY to get ₹100 off your first Launezy order.`,
  },
  {
    title: "We saved your spot! 🛒",
    body: (name: string) => `${name}, don't let your laundry pile up. Grab ₹100 off with code TRYLAUNEZY — valid this week only!`,
  },
  {
    title: "Your ₹100 coupon is waiting 🎁",
    body: (name: string) => `Hi ${name}! Use TRYLAUNEZY for ₹100 off your first order. Fresh laundry, just one tap away!`,
  },
];

// PostHog one-shot message (csv-reengagement uses a single message for CSV/PostHog flow)
const POSTHOG_NOTIFICATION = {
  title: "Your ₹100 coupon is still waiting! 🎁",
  body: (name: string) => `Hi ${name}, use code TRYLAUNEZY to get ₹100 off your first Launezy order. Fresh laundry, delivered to your door!`,
};

function NotificationPreview({ title, body, appName = "Launezy" }: { title: string; body: string; appName?: string }) {
  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Android-style */}
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Android</p>
      <div className="bg-gray-900 rounded-2xl p-4 shadow-xl mb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0 text-white font-black text-sm">L</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{appName}</span>
              <span className="text-xs text-gray-500">now</span>
            </div>
            <p className="text-sm font-bold text-white mt-0.5 leading-tight">{title}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{body}</p>
          </div>
        </div>
      </div>

      {/* iOS-style */}
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">iOS</p>
      <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-white/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0 text-white font-black text-sm shadow">L</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{appName}</span>
              <span className="text-xs text-gray-400">now</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 leading-tight">{title}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-snug">{body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseCsv(text: string): CsvRow[] {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
    // Map flexible column names
    const idx = (names: string[]) => names.reduce((found, n) => found !== -1 ? found : headers.indexOf(n), -1);
    const iUserId    = idx(["distinct_id", "userid", "user_id"]);
    const iName      = idx(["name"]);
    const iShopId    = idx(["shop_id", "shopid"]);
    const iCartValue = idx(["max_checkout_value", "cart_value", "cartvalue"]);
    const iCheckout  = idx(["last_checkout", "last_checkout_at", "checkout_at"]);

    if (iUserId === -1) return [];

    return lines.slice(1).map(line => {
        // Handle quoted fields
        const cols = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || line.split(",");
        const clean = (i: number) => i === -1 ? "" : (cols[i] || "").replace(/^["']|["']$/g, "").replace(/^\+/, "").trim();
        const val = parseFloat(clean(iCartValue));
        return {
            userId:      clean(iUserId),
            name:        clean(iName) || undefined,
            shopId:      clean(iShopId) || undefined,
            cartValue:   isNaN(val) ? undefined : val,
            lastCheckout: clean(iCheckout) || undefined,
        };
    }).filter(r => r.userId.startsWith("user-"));
}

interface Props {
    users: AbandonedCheckoutUser[];
    windowHours: number;
}

function timeAgo(minutes: number): string {
    if (minutes < 60) return `${minutes}m ago`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

export default function AbandonedCheckoutClient({ users, windowHours }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Window filter
    const [window, setWindow] = useState(windowHours);

    // Notify form state
    const [title, setTitle] = useState("Still thinking? 🛒");
    const [body, setBody] = useState("Your laundry cart is waiting! Complete your order now and get fresh clothes delivered.");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ sent: number; skipped: number; failed: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [sweeping, setSweeping] = useState(false);
    const [sweepResult, setSweepResult] = useState<string | null>(null);

    // PostHog direct state
    const [phFetching, setPhFetching] = useState(false);
    const [phSending, setPhSending] = useState(false);
    const [phPreview, setPhPreview] = useState<CsvRow[] | null>(null);
    const [phResult, setPhResult] = useState<{ sent: number; skipped: number; failed: number; noToken: number; total: number } | null>(null);
    const [phError, setPhError] = useState<string | null>(null);

    const handlePhFetch = async () => {
        setPhFetching(true);
        setPhPreview(null);
        setPhResult(null);
        setPhError(null);
        const res = await fetchPosthogAbandonedUsers();
        setPhFetching(false);
        if (res) setPhPreview(res.users);
        else setPhError("Failed to fetch from PostHog. Check POSTHOG_PERSONAL_API_KEY on the server.");
    };

    const handlePhSend = async () => {
        setPhSending(true);
        setPhResult(null);
        setPhError(null);
        const res = await sendPosthogReEngagement();
        setPhSending(false);
        if (res) setPhResult(res);
        else setPhError("Campaign failed. Check server logs.");
    };

    // CSV upload state (fallback)
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
    const [csvFileName, setCsvFileName] = useState<string | null>(null);
    const [csvSending, setCsvSending] = useState(false);
    const [csvResult, setCsvResult] = useState<{ sent: number; skipped: number; failed: number; noToken: number } | null>(null);
    const [csvError, setCsvError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvFileName(file.name);
        setCsvResult(null);
        setCsvError(null);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const rows = parseCsv(text);
            setCsvRows(rows);
            if (rows.length === 0) setCsvError("No valid rows found. Make sure the CSV has a distinct_id column.");
        };
        reader.readAsText(file);
    };

    const handleCsvSend = async () => {
        if (csvRows.length === 0) return;
        setCsvSending(true);
        setCsvResult(null);
        setCsvError(null);
        const res = await sendCsvReEngagement(csvRows);
        setCsvSending(false);
        if (res) setCsvResult(res);
        else setCsvError("Campaign failed. Check server logs.");
    };

    const handleReEngagementSweep = async () => {
        setSweeping(true);
        setSweepResult(null);
        const res = await triggerReEngagementSweep();
        setSweeping(false);
        setSweepResult(res ? "Re-engagement sweep started! Check server logs for results." : "Failed to trigger sweep.");
    };

    const notifiable = users.filter(u => u.hasToken);
    const isAllSelected = selectedIds.length === 0; // empty = all

    const handleWindowChange = (h: number) => {
        setWindow(h);
        startTransition(() => { router.push(`?windowHours=${h}`); });
    };

    const toggleUser = (userId: string) => {
        setSelectedIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) { setError("Title and message are required."); return; }
        setSending(true);
        setError(null);
        setResult(null);
        const res = await notifyAbandonedCheckoutUsers({
            userIds: selectedIds,   // empty array = notify all
            title: title.trim(),
            body: body.trim(),
            windowHours: window,
        });
        setSending(false);
        if (res) setResult(res);
        else setError("Failed to send notifications. Check that POSTHOG_PERSONAL_API_KEY is set on the server.");
    };

    return (
        <div className="space-y-6">
            {/* PostHog direct campaign */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white">PostHog Direct Campaign</h3>
                    <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full">Live data</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Queries PostHog for <strong>all-time</strong> users who fired <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">begin_checkout</code> but never <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">purchase</code>.
                    No CSV export needed — always fresh data.
                </p>

                <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={handlePhFetch} disabled={phFetching}
                        className="flex items-center gap-2 border border-amber-400 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-40 font-semibold px-4 py-2 rounded-xl text-sm transition-all">
                        <Eye size={14} className={phFetching ? "animate-pulse" : ""} />
                        {phFetching ? "Fetching…" : "Preview"}
                    </button>
                    <button onClick={handlePhSend} disabled={phSending}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all">
                        <Send size={14} />
                        {phSending ? "Sending…" : "Fetch & Notify All"}
                    </button>
                </div>

                {phPreview && (
                    <div className="space-y-4">
                        {/* Stats row */}
                        <div className="flex items-center gap-3 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
                            <CheckCircle size={16} />
                            <span><strong>{phPreview.length}</strong> all-time abandoned users found in PostHog</span>
                            <span className="text-xs text-gray-400 ml-1">· Sample: {phPreview.slice(0, 3).map(u => u.name || u.userId).join(", ")}{phPreview.length > 3 ? ` +${phPreview.length - 3} more` : ""}</span>
                        </div>

                        {/* Notification preview */}
                        <div className="border border-gray-100 dark:border-gray-700 rounded-2xl p-5 bg-gray-50 dark:bg-gray-900/40">
                            <div className="flex items-center gap-2 mb-4">
                                <Smartphone size={15} className="text-gray-400" />
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notification Preview</span>
                                <span className="text-xs text-gray-400 ml-1">— sent to each user</span>
                            </div>
                            <NotificationPreview
                                title={POSTHOG_NOTIFICATION.title}
                                body={POSTHOG_NOTIFICATION.body(phPreview[0]?.name?.split(" ")[0] || "there")}
                            />
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
                                "Hi" name is personalised per user · Coupon: <strong>TRYLAUNEZY</strong> · ₹100 off · Min order ₹200
                            </p>
                        </div>

                        <button onClick={handlePhSend} disabled={phSending}
                            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold px-4 py-3 rounded-xl text-sm transition-all">
                            <Send size={15} />
                            {phSending ? "Sending…" : `Send to all ${phPreview.length} users`}
                        </button>
                    </div>
                )}
                {phResult && (
                    <div className="flex items-center gap-3 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
                        <CheckCircle size={16} />
                        Found <strong>{phResult.total}</strong> in PostHog · Sent <strong>{phResult.sent}</strong> · Skipped (ordered) <strong>{phResult.skipped}</strong> · No token <strong>{phResult.noToken}</strong> · Failed <strong>{phResult.failed}</strong>
                    </div>
                )}
                {phError && (
                    <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                        <XCircle size={16} />{phError}
                    </div>
                )}
            </div>

            {/* CSV import (fallback / historical export) */}
            <details className="group">
                <summary className="cursor-pointer flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 select-none">
                    <FileText size={15} />
                    Import from CSV instead (use a PostHog export)
                    <span className="ml-auto text-xs opacity-60 group-open:hidden">▼ expand</span>
                </summary>
                <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Upload the CSV exported from PostHog. Columns needed: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">distinct_id</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">name</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">shop_id</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">max_checkout_value</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">last_checkout</code>.
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-500 text-gray-600 dark:text-gray-400 hover:text-emerald-600 font-semibold px-4 py-2 rounded-xl text-sm transition-all">
                            <Upload size={15} />
                            {csvFileName ?? "Choose CSV file"}
                        </button>
                        {csvRows.length > 0 && <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{csvRows.length} users loaded</span>}
                        <button onClick={handleCsvSend} disabled={csvRows.length === 0 || csvSending}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all">
                            <Send size={14} />
                            {csvSending ? "Sending…" : `Notify ${csvRows.length || ""} users`}
                        </button>
                    </div>
                    {csvResult && (
                        <div className="flex items-center gap-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
                            <CheckCircle size={16} />
                            Sent <strong>{csvResult.sent}</strong> · Skipped <strong>{csvResult.skipped}</strong> · No token <strong>{csvResult.noToken}</strong> · Failed <strong>{csvResult.failed}</strong>
                        </div>
                    )}
                    {csvError && (
                        <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                            <XCircle size={16} />{csvError}
                        </div>
                    )}
                </div>
            </details>

            {/* Re-engagement sweep banner */}
            <div className="bg-gradient-to-r from-purple-500/10 to-brand-500/10 border border-purple-200 dark:border-purple-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <RefreshCw size={16} className="text-purple-500" />
                        All-time Re-engagement Sweep
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Scans <strong>all users in DynamoDB</strong> who ever checked out but never ordered — no time restriction.
                        Rotates 3 message variants below, 7-day cooldown per user. Runs automatically daily at 10 AM IST.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                        {NOTIFICATION_VARIANTS.map((v, i) => (
                            <div key={i} className="bg-white/60 dark:bg-gray-700/40 rounded-xl p-3 border border-purple-100 dark:border-purple-900/30">
                                <p className="text-xs font-bold text-purple-400 mb-1">Variant {i + 1}</p>
                                <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{v.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{v.body("there")}</p>
                            </div>
                        ))}
                    </div>
                    {sweepResult && (
                        <p className="text-xs mt-2 font-semibold text-purple-600 dark:text-purple-400">{sweepResult}</p>
                    )}
                </div>
                <button
                    onClick={handleReEngagementSweep}
                    disabled={sweeping}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap"
                >
                    <RefreshCw size={14} className={sweeping ? "animate-spin" : ""} />
                    {sweeping ? "Starting…" : "Run Now"}
                </button>
            </div>

            {/* Time window filter */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Window:</span>
                {[6, 12, 24, 48, 72].map(h => (
                    <button
                        key={h}
                        onClick={() => handleWindowChange(h)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            window === h
                                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                        }`}
                    >
                        {h}h
                    </button>
                ))}
                {isPending && <span className="text-xs text-gray-400 ml-2 animate-pulse">Refreshing…</span>}
            </div>

            {/* Notification composer */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Bell size={18} className="text-brand-500" />
                    <h2 className="font-bold text-gray-900 dark:text-white">
                        {selectedIds.length > 0
                            ? `Notify ${selectedIds.length} selected user${selectedIds.length > 1 ? "s" : ""}`
                            : `Notify all ${notifiable.length} notifiable users`}
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Title</label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Message</label>
                        <input
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                </div>

                {selectedIds.length > 0 && (
                    <p className="text-xs text-gray-400">
                        {selectedIds.length} selected · <button onClick={() => setSelectedIds([])} className="text-brand-500 underline">clear selection (notify all)</button>
                    </p>
                )}

                <button
                    onClick={handleSend}
                    disabled={sending || notifiable.length === 0}
                    className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-500/30"
                >
                    <Send size={16} />
                    {sending ? "Sending…" : "Send Notification"}
                </button>

                {result && (
                    <div className="flex items-center gap-3 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
                        <CheckCircle size={16} />
                        Sent {result.sent} · Skipped {result.skipped} (no token) · Failed {result.failed}
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                        <XCircle size={16} />
                        {error}
                    </div>
                )}
            </div>

            {/* User table */}
            {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600 gap-3">
                    <AlertCircle size={40} />
                    <p className="font-medium">No abandoned checkouts in the last {window}h</p>
                    <p className="text-xs">Try a wider window or check PostHog has events flowing.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === notifiable.length && notifiable.length > 0}
                                        onChange={e => setSelectedIds(e.target.checked ? notifiable.map(u => u.userId) : [])}
                                        className="rounded"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">User</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Cart Value</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Abandoned</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Token</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {users.map(user => (
                                <tr key={user.userId} className={`hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors ${selectedIds.includes(user.userId) ? "bg-brand-50/30 dark:bg-brand-900/10" : ""}`}>
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            disabled={!user.hasToken}
                                            checked={selectedIds.includes(user.userId)}
                                            onChange={() => toggleUser(user.userId)}
                                            className="rounded disabled:opacity-30"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-900 dark:text-white">{user.name || "Unknown"}</div>
                                        {user.phoneNumber && (
                                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                                <Phone size={10} />
                                                {user.phoneNumber}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-white">
                                            <ShoppingBag size={14} className="text-brand-500" />
                                            ₹{user.cartValue.toFixed(0)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                            <Clock size={12} />
                                            {timeAgo(user.minutesAgo)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                            user.hasToken
                                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                        }`}>
                                            {user.hasToken ? <><CheckCircle size={10} /> Yes</> : <><XCircle size={10} /> No</>}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.hasToken && (
                                            <button
                                                onClick={() => {
                                                    setSelectedIds([user.userId]);
                                                    document.getElementById("send-btn")?.scrollIntoView({ behavior: "smooth" });
                                                }}
                                                className="text-xs font-semibold text-brand-500 hover:text-brand-600 hover:underline transition-colors"
                                            >
                                                Select & Notify
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
