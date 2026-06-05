"use client";

import React, { useState } from "react";
import { Bell, BellOff, Clock, Send, CheckCircle2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { DailyNotifConfig, saveDailyNotifConfig, sendDailyNotifNow } from "@/lib/actions/daily-notification";

interface Props {
    initialConfig: DailyNotifConfig | null;
}

const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function pad(n: number) { return String(n).padStart(2, "0"); }

function fmt12(h: number, m: number) {
    const ampm = h >= 12 ? "PM" : "AM";
    const hh   = h % 12 || 12;
    return `${hh}:${pad(m)} ${ampm}`;
}

export default function DailyNotificationWidget({ initialConfig }: Props) {
    const cfg = initialConfig ?? { enabled: false, sendHour: 12, sendMinute: 0 };

    const [enabled,    setEnabled]    = useState(cfg.enabled);
    const [sendHour,   setSendHour]   = useState(cfg.sendHour);
    const [sendMinute, setSendMinute] = useState(cfg.sendMinute);
    const [lastSent,   setLastSent]   = useState(cfg.lastSentDate);
    const [expanded,   setExpanded]   = useState(false);

    // Toggle state — independent so it never blocks itself
    const [toggling,   setToggling]   = useState(false);

    // Save time state
    const [saving,    setSaving]    = useState(false);
    const [saveMsg,   setSaveMsg]   = useState<string | null>(null);

    // Send now state
    const [sending,    setSending]    = useState(false);
    const [sendResult, setSendResult] = useState<{ sent: number; skipped: number } | null>(null);
    const [sendError,  setSendError]  = useState<string | null>(null);

    async function handleToggle() {
        if (toggling) return;
        const next = !enabled;
        setEnabled(next);           // optimistic update
        setToggling(true);
        try {
            const res = await saveDailyNotifConfig({ enabled: next, sendHour, sendMinute });
            if (!res.success) setEnabled(!next); // revert on failure
        } catch {
            setEnabled(!next);      // revert on error
        } finally {
            setToggling(false);
        }
    }

    async function handleSaveTime() {
        if (saving) return;
        setSaveMsg(null);
        setSaving(true);
        try {
            const res = await saveDailyNotifConfig({ enabled, sendHour, sendMinute });
            setSaveMsg(res.success ? "Saved!" : (res.message ?? "Error saving"));
        } catch (e: any) {
            setSaveMsg(e?.message ?? "Error saving");
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMsg(null), 2500);
        }
    }

    async function handleSendNow() {
        if (sending) return;
        setSendResult(null);
        setSendError(null);
        setSending(true);
        try {
            const res = await sendDailyNotifNow();
            if (res.success) {
                setSendResult({ sent: res.sent ?? 0, skipped: res.skipped ?? 0 });
                setLastSent(new Date().toISOString().slice(0, 10));
            } else {
                setSendError(res.message ?? "Failed to send");
            }
        } catch (e: any) {
            setSendError(e?.message ?? "Failed to send");
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden">

            {/* Header row — always visible */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setExpanded((v) => !v)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setExpanded((v) => !v)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
            >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${enabled ? "bg-brand-500/10" : "bg-gray-100 dark:bg-white/5"}`}>
                    {enabled
                        ? <Bell size={18} className="text-brand-500" />
                        : <BellOff size={18} className="text-gray-400" />
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        Daily Engagement Notification
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium truncate">
                        {enabled
                            ? `Fires every day at ${fmt12(sendHour, sendMinute)} IST · ${lastSent ? `last sent ${lastSent}` : "not sent yet"}`
                            : "Currently disabled — click to configure"
                        }
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Toggle pill — stopPropagation so it doesn't collapse the panel */}
                    <div
                        role="switch"
                        aria-checked={enabled}
                        aria-label="Toggle daily notification"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                handleToggle();
                            }
                        }}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                            enabled ? "bg-brand-500" : "bg-gray-200 dark:bg-white/10"
                        } ${toggling ? "opacity-60" : ""}`}
                    >
                        <span className={`inline-flex items-center justify-center h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`}>
                            {toggling && <Loader2 size={8} className="animate-spin text-gray-400" />}
                        </span>
                    </div>
                    {expanded
                        ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                        : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                    }
                </div>
            </div>

            {/* Expanded settings */}
            {expanded && (
                <div className="border-t border-gray-100 dark:border-white/5 p-5 space-y-5">

                    {/* Time picker */}
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Send Time (IST)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={sendHour}
                                onChange={(e) => setSendHour(Number(e.target.value))}
                                className="text-sm font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            >
                                {HOURS.map((h) => (
                                    <option key={h} value={h}>{pad(h)}:00 ({h < 12 ? "AM" : "PM"})</option>
                                ))}
                            </select>
                            <span className="text-gray-400 font-black">:</span>
                            <select
                                value={sendMinute}
                                onChange={(e) => setSendMinute(Number(e.target.value))}
                                className="text-sm font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            >
                                {MINUTES.map((m) => (
                                    <option key={m} value={m}>{pad(m)}</option>
                                ))}
                            </select>
                            <span className="text-[11px] font-medium text-gray-400 ml-1">
                                = {fmt12(sendHour, sendMinute)} IST
                            </span>
                        </div>

                        <button
                            onClick={handleSaveTime}
                            disabled={saving}
                            className="ml-auto flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors"
                        >
                            {saving
                                ? <><Loader2 size={12} className="animate-spin" /> Saving…</>
                                : saveMsg === "Saved!"
                                    ? <><CheckCircle2 size={12} /> Saved!</>
                                    : "Save Time"
                            }
                        </button>
                    </div>

                    {saveMsg && saveMsg !== "Saved!" && (
                        <p className="text-xs text-red-500 font-medium">{saveMsg}</p>
                    )}

                    {/* Message preview */}
                    <div className="bg-gray-50 dark:bg-white/[0.03] rounded-2xl p-4 space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sample Messages</p>
                        {[
                            { day: "Mon", title: "Fresh week, fresh clothes 💪", body: "Let Launezy handle the washing while you conquer the week!" },
                            { day: "Fri", title: "TGIF! 🥳", body: "Weekend plans need fresh fits. Get your laundry sorted with Launezy today." },
                            { day: "Sun", title: "Sunday sorted! 🌅", body: "Fresh clothes for the week ahead. Book a Launezy pickup in 60 seconds." },
                        ].map(({ day, title, body }) => (
                            <div key={day} className="flex items-start gap-3">
                                <span className="text-[9px] font-black bg-brand-500/10 text-brand-600 px-1.5 py-0.5 rounded-md w-7 text-center flex-shrink-0 mt-0.5">{day}</span>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black text-gray-800 dark:text-gray-100 truncate">{title}</p>
                                    <p className="text-[10px] text-gray-500 leading-snug">{body}</p>
                                </div>
                            </div>
                        ))}
                        <p className="text-[9px] text-gray-400 italic pt-1">28 messages total · 4 per day of week · rotates automatically</p>
                    </div>

                    {/* Send now */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                            onClick={handleSendNow}
                            disabled={sending}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/20 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors"
                        >
                            {sending
                                ? <><Loader2 size={12} className="animate-spin" /> Sending…</>
                                : <><Send size={12} /> Send Now</>
                            }
                        </button>
                        <p className="text-[10px] text-gray-400">
                            Bypasses the schedule — fires immediately to all users with tokens.
                        </p>
                    </div>

                    {sendResult && (
                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 rounded-xl px-4 py-2">
                            <CheckCircle2 size={14} />
                            Sent to <strong>{sendResult.sent.toLocaleString()}</strong> users
                            {sendResult.skipped > 0 && <span className="text-gray-400 font-normal ml-1">· {sendResult.skipped} failed</span>}
                        </div>
                    )}
                    {sendError && (
                        <p className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-2">{sendError}</p>
                    )}

                    {lastSent && (
                        <p className="text-[10px] text-gray-400">
                            Last sent: <span className="font-black text-gray-600 dark:text-gray-300">{lastSent}</span>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
