import React from "react";
import { Metadata } from "next";
import { listAnnouncements } from "@/lib/actions/announcements";
import AnnouncementManager from "@/components/marketing/AnnouncementManager";
import { Megaphone } from "lucide-react";

export const metadata: Metadata = {
    title: "Announcements | Launezy Admin",
    description: "Manage home-screen alerts — delays, price surges, and offers.",
};

export default async function AnnouncementsPage() {
    const announcements = await listAnnouncements();

    const active   = announcements.filter(a => a.isActive === "TRUE").length;
    const inactive = announcements.length - active;

    return (
        <div className="p-4 md:p-8 space-y-10 max-w-[1400px] mx-auto min-h-screen relative overflow-hidden">
            {/* Glows */}
            <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-brand-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-brand-500/5 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2" />

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/40 rotate-3 transition-transform hover:rotate-0">
                            <Megaphone className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
                                Announcements
                            </h1>
                            <div className="h-1 w-32 bg-brand-500 rounded-full mt-1" />
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-400 max-w-2xl leading-relaxed">
                        Push real-time alerts to the user home screen — rain delays, LPG price surges, or limited-time offers. Active announcements appear instantly.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-sm">
                {[
                    { label: "Total",    value: announcements.length, accent: false },
                    { label: "Active",   value: active,   accent: active > 0 },
                    { label: "Inactive", value: inactive, accent: false },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-white/5 rounded-3xl p-5 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                        <p className={`text-3xl font-black mt-1 ${s.accent ? "text-emerald-500" : "text-gray-900 dark:text-white"}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Manager: create button + table */}
            <AnnouncementManager announcements={announcements} />
        </div>
    );
}
