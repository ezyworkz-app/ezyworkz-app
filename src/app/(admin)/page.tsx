"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LayoutDashboard, Users, Receipt, TrendingUp } from "lucide-react";

export default function Dashboard() {
    return (
        <ProtectedRoute>
            <main className="flex-1 p-8">
                <div className="flex items-center justify-between mb-8 relative">
                    <div className="absolute -left-16 -top-16 w-48 h-48 bg-teal-50 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening at your shop today.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
                    {[
                        { label: "Today's Orders", value: "12", icon: Receipt, color: "text-blue-400", bg: "bg-blue-500/10" },
                        { label: "New Customers", value: "4", icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
                        { label: "Revenue (Today)", value: "₹2,450", icon: TrendingUp, color: "text-teal-400", bg: "bg-teal-500/10" },
                        { label: "Pending Orders", value: "8", icon: LayoutDashboard, color: "text-amber-400", bg: "bg-amber-500/10" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 relative z-10">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="text-center py-12">
                        <p className="text-gray-500">More charts and activity coming soon...</p>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
