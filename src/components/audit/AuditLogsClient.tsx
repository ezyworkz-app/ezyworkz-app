"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getAuditLogs, getAuditStats } from "@/lib/actions/audit";
import { format } from "date-fns";
import { 
    Search, 
    Filter, 
    RefreshCcw, 
    History, 
    Activity, 
    User, 
    ArrowRight,
    Terminal,
    AlertCircle,
    CheckCircle2,
    ShieldCheck
} from "lucide-react";
import AuditCharts from "./AuditCharts";

interface AuditLog {
    logId: string;
    userId: string;
    actionType: string;
    targetId?: string;
    metadata?: Record<string, any>;
    timestamp: string;
}

interface AuditStats {
    timeline: { date: string; count: number }[];
    types: { name: string; value: number }[];
    funnel: { SHOP_VISITED: number; SERVICE_SELECTED: number; CHECKOUT_STARTED: number; ORDER_PLACED: number };
    totalLogs: number;
    uniqueUsers: number;
}

export default function AuditLogsClient() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState("");
    const [lastKey, setLastKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async (isInitial = true) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAuditLogs({ 
                actionType: actionFilter || undefined,
                lastKey: isInitial ? undefined : (lastKey || undefined)
            });
            
            if (isInitial) {
                setLogs(data.logs);
            } else {
                setLogs(prev => [...prev, ...data.logs]);
            }
            setLastKey(data.nextKey);
        } catch (err: any) {
            setError(err.message || "Failed to load audit logs");
        } finally {
            setIsLoading(false);
        }
    }, [actionFilter, lastKey]);

    const loadStats = useCallback(async () => {
        setIsStatsLoading(true);
        try {
            const data = await getAuditStats();
            setStats(data);
        } catch (err) {
            console.error("Failed to load audit stats", err);
        } finally {
            setIsStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(true);
        loadStats();
    }, [actionFilter]);

    const getActionColor = (type: string) => {
        if (type.includes("SUCCESS") || type.includes("PLACED") || type.includes("CREDIT")) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10";
        if (type.includes("FAILED") || type.includes("ERROR") || type.includes("DELETED")) return "text-rose-600 bg-rose-50 dark:bg-rose-500/10";
        if (type.includes("AUTH") || type.includes("LOGIN")) return "text-blue-600 bg-blue-50 dark:bg-blue-500/10";
        return "text-gray-600 bg-gray-50 dark:bg-white/5";
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                            <Activity size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Total Activity</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalLogs || 0}</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Unique Actors</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{stats?.uniqueUsers || 0}</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10">
                            <History size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Last 24h</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {stats?.timeline.length ? stats.timeline[stats.timeline.length - 1].count : 0}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
                            <Terminal size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">Action Types</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{stats?.types.length || 0}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Component */}
            {stats && !isStatsLoading && (
                <AuditCharts timeline={stats.timeline} types={stats.types} funnel={stats.funnel} />
            )}

            {/* Logs Table Section */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Trail</h3>
                        <p className="text-sm text-gray-500">Detailed history of all system events</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select 
                                value={actionFilter} 
                                onChange={(e) => setActionFilter(e.target.value)}
                                className="h-9 w-44 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs font-medium text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                            >
                                <option value="">All Actions</option>
                                <option value="SHOP_VISITED">Shop Visit</option>
                                <option value="SERVICE_SELECTED">Service Added</option>
                                <option value="CHECKOUT_STARTED">Checkout Start</option>
                                <option value="ORDER_PLACED">Order Placed</option>
                                <option value="PAYMENT_SUCCESS">Payment Success</option>
                                <option value="PAYMENT_FAILED">Payment Failed</option>
                                <option value="PROFILE_UPDATED">Profile Update</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => { loadData(true); loadStats(); }}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5 transition-colors"
                        >
                            <RefreshCcw size={16} className={isLoading ? "animate-spin text-brand-500" : "text-gray-500"} />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-500/10 dark:bg-rose-500/5 dark:text-rose-400">
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:border-gray-800">
                                <th className="pb-4 pr-4">Action Type</th>
                                <th className="pb-4 pr-4">User</th>
                                <th className="pb-4 pr-4">Target ID</th>
                                <th className="pb-4 pr-4">Timestamp</th>
                                <th className="pb-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                            {logs.map((log) => (
                                <tr key={log.logId} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                    <td className="py-4 pr-4">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${getActionColor(log.actionType)}`}>
                                            {log.actionType.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="py-4 pr-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 dark:bg-white/10">
                                                {log.userId.slice(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white">{log.userId}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 pr-4">
                                        <span className="font-mono text-[11px] text-gray-500">{log.targetId || "N/A"}</span>
                                    </td>
                                    <td className="py-4 pr-4 text-gray-500">
                                        {format(new Date(log.timestamp), "MMM d, HH:mm:ss")}
                                    </td>
                                    <td className="py-4">
                                        <div className="max-w-[200px] truncate text-[11px] text-gray-400">
                                            {JSON.stringify(log.metadata)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {lastKey && (
                    <div className="mt-8 flex justify-center">
                        <button 
                            onClick={() => loadData(false)}
                            disabled={isLoading}
                            className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                        >
                            Load More Results
                            <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
