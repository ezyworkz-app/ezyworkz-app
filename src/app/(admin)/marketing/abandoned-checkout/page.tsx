import React from "react";
import { Metadata } from "next";
import { getAbandonedCheckouts } from "@/lib/actions/abandoned-checkout";
import AbandonedCheckoutClient from "./AbandonedCheckoutClient";
import { ShoppingCart } from "lucide-react";

export const metadata: Metadata = {
    title: "Abandoned Checkout | Launezy Admin",
    description: "Users who started checkout but didn't place an order — re-engage them with a push notification.",
};

export default async function AbandonedCheckoutPage(props: {
    searchParams: Promise<{ windowHours?: string }>;
}) {
    const searchParams = await props.searchParams;
    const windowHours = parseInt(searchParams.windowHours || "24", 10);
    const data = await getAbandonedCheckouts(windowHours);

    return (
        <div className="p-4 md:p-8 space-y-10 max-w-[1600px] mx-auto min-h-screen relative overflow-hidden">
            {/* Glows */}
            <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-brand-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-brand-500/5 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2" />

            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/40 rotate-3 transition-transform hover:rotate-0">
                    <ShoppingCart className="text-white" size={22} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
                        Abandoned Checkout
                    </h1>
                    <div className="h-1 w-24 bg-brand-500 rounded-full mt-1" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Powered by PostHog · Last {windowHours}h · {data.total} users
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Abandoned", value: data.total },
                    { label: "Notifiable", value: data.users.filter(u => u.hasToken).length },
                    { label: "No Token", value: data.users.filter(u => !u.hasToken).length },
                    {
                        label: "Avg Cart Value",
                        value: data.total > 0
                            ? `₹${Math.round(data.users.reduce((s, u) => s + u.cartValue, 0) / data.total)}`
                            : "—",
                    },
                ].map(stat => (
                    <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{stat.label}</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <AbandonedCheckoutClient users={data.users} windowHours={windowHours} />
        </div>
    );
}
