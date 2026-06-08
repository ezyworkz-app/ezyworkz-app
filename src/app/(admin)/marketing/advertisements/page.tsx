import React from "react";
import { Metadata } from "next";
import { listAdvertisements } from "@/lib/actions/advertisements";
import AdvertisementsClient from "@/components/marketing/AdvertisementsClient";
import { Star } from "lucide-react";

export const metadata: Metadata = {
    title: "Advertisements | Launezy Admin",
    description: "Manage the brand advertisement shown in the app tab bar.",
};

export default async function AdvertisementsPage() {
    const ads = await listAdvertisements();

    const active   = ads.filter((a) => a.isActive === "TRUE").length;
    const inactive = ads.length - active;

    return (
        <div className="p-4 md:p-8 space-y-10 max-w-[1400px] mx-auto min-h-screen relative overflow-hidden">
            {/* Glows */}
            <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-yellow-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-yellow-500/5 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2" />

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/40 rotate-3 transition-transform hover:rotate-0">
                            <Star className="text-white fill-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
                                Advertisements
                            </h1>
                            <div className="h-1 w-32 bg-yellow-500 rounded-full mt-1" />
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-400 max-w-2xl leading-relaxed">
                        Control the brand ad shown as the 4th icon in the app tab bar. Set a brand name, icon, background colour, and the URL users land on when they tap it.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-sm">
                {[
                    { label: "Total",    value: ads.length, accent: false },
                    { label: "Active",   value: active,     accent: active > 0 },
                    { label: "Inactive", value: inactive,   accent: false },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-white/5 rounded-3xl p-5 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                        <p className={`text-3xl font-black mt-1 ${s.accent ? "text-emerald-500" : "text-gray-900 dark:text-white"}`}>
                            {s.value}
                        </p>
                    </div>
                ))}
            </div>

            <AdvertisementsClient initialAds={ads} />
        </div>
    );
}
