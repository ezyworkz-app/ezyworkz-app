import React from "react";
import { Metadata } from "next";
import { getDeviceStats } from "@/lib/actions/campaigns";
import DeviceStatsCard from "@/components/marketing/DeviceStatsCard";
import { Smartphone } from "lucide-react";

export const metadata: Metadata = {
    title: "Device Audience | Launezy Admin",
    description: "Push notification reachability — active devices, token freshness, and user segments.",
};

export default async function AudiencePage() {
    const deviceStats = await getDeviceStats();

    return (
        <div className="p-4 md:p-8 space-y-10 max-w-[1600px] mx-auto min-h-screen relative overflow-hidden">
            {/* Glows */}
            <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-brand-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-brand-500/5 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2" />

            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/40 rotate-3 transition-transform hover:rotate-0">
                    <Smartphone className="text-white" size={22} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
                        Device Audience
                    </h1>
                    <div className="h-1 w-24 bg-brand-500 rounded-full mt-1" />
                </div>
            </div>
            <p className="text-sm font-semibold text-gray-400 max-w-2xl leading-relaxed -mt-6">
                Real-time snapshot of push-reachable users — token freshness, multi-device users, and segment breakdown.
            </p>

            {/* Stats */}
            {deviceStats ? (
                <DeviceStatsCard stats={deviceStats} />
            ) : (
                <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-white/5 rounded-[2rem] p-12 text-center">
                    <Smartphone size={32} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-400">Could not load device stats. Check backend logs.</p>
                </div>
            )}
        </div>
    );
}
