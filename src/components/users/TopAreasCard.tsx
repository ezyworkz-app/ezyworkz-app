"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { getUserLocationClusters } from "@/lib/actions/users";

interface AreaRow {
    area: string;
    count: number;
    pct: number;
}

export default function TopAreasCard() {
    const [rows, setRows] = useState<AreaRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(false);
    const cacheRef = useRef<Record<string, string>>({});

    useEffect(() => {
        (async () => {
            setLoading(true);
            const clusters = await getUserLocationClusters();
            if (!clusters.length) { setLoading(false); return; }

            // Show raw counts immediately while geocoding
            const total = clusters.reduce((s, c) => s + c.count, 0);
            setRows(clusters.map(c => ({
                area: `${c.lat}, ${c.lng}`,
                count: c.count,
                pct: Math.round((c.count / total) * 100),
            })));
            setLoading(false);
            const hasUnresolved = clusters.some(c => !c.areaName);
            setResolving(hasUnresolved);

            // Reverse-geocode centroids that don't already have a stored areaName (staggered 300ms)
            const resolved: AreaRow[] = [...clusters.map(c => ({
                area: c.areaName || `${c.lat}, ${c.lng}`,
                count: c.count,
                pct: Math.round((c.count / total) * 100),
            }))];

            // Pre-populate cache from stored areaNames
            for (const c of clusters) {
                if (c.areaName) cacheRef.current[`${c.lat},${c.lng}`] = c.areaName;
            }

            const needsGeo = clusters.filter(c => !c.areaName);
            for (let j = 0; j < needsGeo.length; j++) {
                const c = needsGeo[j];
                const i = clusters.indexOf(c);
                const key = `${c.lat},${c.lng}`;
                let area = cacheRef.current[key];
                if (!area) {
                    try {
                        const controller = new AbortController();
                        const timeout = setTimeout(() => controller.abort(), 5000);
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${c.lat}&lon=${c.lng}&zoom=14`,
                            { headers: { "Accept-Language": "en" }, signal: controller.signal }
                        );
                        clearTimeout(timeout);
                        const data = await res.json();
                        const addr = data?.address || {};
                        const sub = addr.suburb || addr.neighbourhood || addr.village || addr.county || "";
                        const city = addr.city || addr.town || addr.city_district || addr.state_district || "";
                        area = sub && city && sub !== city ? `${sub}, ${city}` : sub || city || key;
                        cacheRef.current[key] = area;
                    } catch {
                        area = key;
                    }
                }
                resolved[i] = { ...resolved[i], area };
                setRows([...resolved]);
                if (j < needsGeo.length - 1) await new Promise(r => setTimeout(r, 300));
            }
            setResolving(false);
        })();
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex items-center justify-center h-48">
                <RefreshCw className="animate-spin text-brand-400" size={24} />
            </div>
        );
    }

    if (!rows.length) return null;

    const max = rows[0]?.count || 1;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                        <MapPin size={16} className="text-brand-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Top Areas by Users</h3>
                        <p className="text-xs text-gray-400">Where your users are located</p>
                    </div>
                </div>
                {resolving && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <RefreshCw size={11} className="animate-spin" />
                        Resolving areas…
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {rows.map((row, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-5 text-[11px] font-bold text-gray-400 text-right shrink-0">
                            {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate pr-2">
                                    {row.area}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-xs font-bold text-gray-900 dark:text-white">{row.count}</span>
                                    <span className="text-[10px] text-gray-400">({row.pct}%)</span>
                                </div>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${(row.count / max) * 100}%`,
                                        backgroundColor: i === 0 ? "#4C9D26" : i < 3 ? "#6366F1" : "#94A3B8",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
