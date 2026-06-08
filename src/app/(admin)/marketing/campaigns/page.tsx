import React from "react";
import { Metadata } from "next";
import { listCampaigns } from "@/lib/actions/campaigns";
import { getDailyNotifConfig } from "@/lib/actions/daily-notification";
import CampaignTable from "@/components/marketing/CampaignTable";
import LaunchCampaignModal from "@/components/marketing/LaunchCampaignModal";
import DailyNotificationWidget from "@/components/marketing/DailyNotificationWidget";

export const metadata: Metadata = {
    title: "Campaigns | Launezy Admin",
    description: "Push notification campaign analytics — delivery, taps, and redemptions.",
};

export default async function CampaignsPage() {
    const [campaigns, dailyConfig] = await Promise.all([
        listCampaigns(),
        getDailyNotifConfig(),
    ]);

    const totalSent     = campaigns.reduce((s, c) => s + (c.tokensSent || 0), 0);
    const totalTapped   = campaigns.reduce((s, c) => s + (c.tappedCount || 0), 0);
    const totalRedeemed = campaigns.reduce((s, c) => s + (c.redeemedCount || 0), 0);
    const avgTapRate    = totalSent > 0 ? ((totalTapped / totalSent) * 100).toFixed(1) : "0.0";
    const avgConvRate   = totalSent > 0 ? ((totalRedeemed / totalSent) * 100).toFixed(1) : "0.0";

    return (
        <div className="p-4 md:p-8 space-y-10 max-w-[1600px] mx-auto min-h-screen relative overflow-hidden">
            {/* Glows */}
            <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-brand-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-brand-500/5 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2" />

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/40 rotate-3 transition-transform hover:rotate-0">
                            <span className="text-white font-black text-2xl">C</span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
                                Campaigns
                            </h1>
                            <div className="h-1 w-24 bg-brand-500 rounded-full mt-1" />
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-400 max-w-2xl leading-relaxed">
                        Track every push notification campaign — how many were delivered, tapped, and converted with a coupon redemption.
                    </p>
                </div>
                <LaunchCampaignModal />
            </div>

            {/* Daily Notification */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-black bg-brand-500/10 text-brand-600 px-2 py-1 rounded-md tracking-widest uppercase">Auto</span>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Daily Notification</h2>
                </div>
                <DailyNotificationWidget initialConfig={dailyConfig} />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: "Campaigns", value: campaigns.length, sub: "all time" },
                    { label: "Delivered", value: totalSent.toLocaleString(), sub: "notifications" },
                    { label: "Tapped", value: totalTapped.toLocaleString(), sub: "opened app" },
                    { label: "Tap Rate", value: `${avgTapRate}%`, sub: "avg across all" },
                    { label: "Redeemed", value: totalRedeemed.toLocaleString(), sub: `${avgConvRate}% conv rate` },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-white/5 rounded-3xl p-5 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{s.value}</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl rounded-[2.5rem] p-1 border border-gray-100 dark:border-white/5 shadow-2xl">
                <CampaignTable campaigns={campaigns} />
            </div>
        </div>
    );
}
