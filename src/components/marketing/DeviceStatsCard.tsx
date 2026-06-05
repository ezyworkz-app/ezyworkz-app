"use client";
import React from "react";
import { DeviceStats } from "@/lib/actions/campaigns";
import { Smartphone, WifiOff, Layers, Clock, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Props {
    stats: DeviceStats;
}

function FreshnessBar({ fresh, recent, stale, unknown }: {
    fresh: number; recent: number; stale: number; unknown: number;
}) {
    const total = fresh + recent + stale + unknown || 1;
    const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;

    const bars = [
        { label: "< 7d",    value: fresh,   color: "bg-emerald-500", pct: pct(fresh) },
        { label: "7–30d",   value: recent,  color: "bg-brand-500",   pct: pct(recent) },
        { label: "30–90d",  value: stale,   color: "bg-amber-400",   pct: pct(stale) },
        { label: "90d+ / unknown", value: unknown, color: "bg-gray-300 dark:bg-gray-700", pct: pct(unknown) },
    ];

    return (
        <div className="space-y-3">
            {/* Stacked bar */}
            <div className="flex rounded-full overflow-hidden h-3 w-full gap-0.5">
                {bars.map((b) => (
                    <div
                        key={b.label}
                        className={`${b.color} transition-all`}
                        style={{ width: b.pct }}
                        title={`${b.label}: ${b.value}`}
                    />
                ))}
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {bars.map((b) => (
                    <div key={b.label} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${b.color} flex-shrink-0`} />
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{b.label}</span>
                        <span className="text-[10px] font-black text-gray-800 dark:text-gray-100 ml-auto">{b.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const SEGMENT_CONFIG = [
    { key: "firstTime" as const,        label: "Never ordered",     color: "text-brand-500",   bg: "bg-brand-500/10" },
    { key: "inactiveOneTime" as const,  label: "One-time dormant",  color: "text-amber-500",   bg: "bg-amber-500/10" },
    { key: "inactiveFrequent" as const, label: "Frequent dormant",  color: "text-red-500",     bg: "bg-red-500/10"   },
    { key: "active" as const,           label: "Active customers",  color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

export default function DeviceStatsCard({ stats }: Props) {
    const reachPct = stats.usersWithToken + stats.usersWithoutToken > 0
        ? ((stats.usersWithToken / (stats.usersWithToken + stats.usersWithoutToken)) * 100).toFixed(1)
        : "0.0";

    return (
        <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-500/10 rounded-2xl flex items-center justify-center">
                        <Smartphone size={18} className="text-brand-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Active Devices</h3>
                        <p className="text-[10px] text-gray-400 font-medium">Push-reachable users right now</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                    <RefreshCw size={10} />
                    <span>Scanned {format(parseISO(stats.scannedAt), "dd MMM, hh:mm a")}</span>
                </div>
            </div>

            {/* Top stats row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-brand-50 dark:bg-brand-500/10 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Reachable</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.usersWithToken.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{reachPct}% of all users</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/[0.03] rounded-2xl p-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <Layers size={9} /> Total Tokens
                    </p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.totalTokens.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{stats.multiDeviceUsers.toLocaleString()} multi-device</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/[0.03] rounded-2xl p-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <WifiOff size={9} /> No Token
                    </p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stats.usersWithoutToken.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">can't be reached</p>
                </div>
            </div>

            {/* Token freshness */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Clock size={12} className="text-gray-400" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Token Freshness</p>
                </div>
                <FreshnessBar
                    fresh={stats.freshTokens}
                    recent={stats.recentTokens}
                    stale={stats.staleTokens}
                    unknown={stats.unknownTokens}
                />
            </div>

            {/* Segment breakdown */}
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Reachable by Segment</p>
                <div className="grid grid-cols-2 gap-2">
                    {SEGMENT_CONFIG.map((s) => {
                        const count = stats.segments[s.key];
                        const pct = stats.usersWithToken > 0
                            ? ((count / stats.usersWithToken) * 100).toFixed(0)
                            : "0";
                        return (
                            <div key={s.key} className={`${s.bg} rounded-2xl p-3 flex items-center justify-between`}>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-wide ${s.color}`}>{s.label}</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{count.toLocaleString()}</p>
                                </div>
                                <p className={`text-2xl font-black opacity-40 ${s.color}`}>{pct}%</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
