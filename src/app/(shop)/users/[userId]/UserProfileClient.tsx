"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";
import {
    ArrowLeft, ShoppingBag, IndianRupee, BarChart3, CalendarClock,
    Mail, Phone, Globe, Store, MapPin, ChevronRight, AlertCircle,
    TrendingUp, Clock
} from "lucide-react";
import { useMemo } from "react";

interface UserProfileData {
    customerId: string;
    userId: string;
    shopId: string;
    email?: string;
    name: string;
    phone?: string;
    savedAddresses?: any[];
    createdAt: string;
    joinedAt: string;
    lastActiveAt?: string;
    source: "shop" | "organic";
    stats: {
        totalOrders: number;
        totalSpent: number;
        avgOrderValue: number;
        frequency: number;
    };
    monthlyTrend: { month: string; orders: number }[];
    statusDistribution: { status: string; count: number; percentage: number }[];
    recentOrders: {
        orderId: string;
        date: string;
        amount: number;
        status: string;
        itemCount: number;
    }[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    waiting_confirmation: { bg: "bg-yellow-100 dark:bg-yellow-500/10", text: "text-yellow-700 dark:text-yellow-400", label: "Waiting" },
    waiting_user_review: { bg: "bg-orange-100 dark:bg-orange-500/10", text: "text-orange-700 dark:text-orange-400", label: "Review" },
    confirmed: { bg: "bg-blue-100 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", label: "Confirmed" },
    in_pickup: { bg: "bg-cyan-100 dark:bg-cyan-500/10", text: "text-cyan-700 dark:text-cyan-400", label: "Pickup" },
    in_process: { bg: "bg-indigo-100 dark:bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-400", label: "In Process" },
    ready_to_deliver: { bg: "bg-teal-100 dark:bg-teal-500/10", text: "text-teal-700 dark:text-teal-400", label: "Ready" },
    out_for_delivery: { bg: "bg-purple-100 dark:bg-purple-500/10", text: "text-purple-700 dark:text-purple-400", label: "Out for Delivery" },
    delivered: { bg: "bg-emerald-100 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", label: "Delivered" },
    cancelled: { bg: "bg-red-100 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400", label: "Cancelled" },
    payment_pending: { bg: "bg-amber-100 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", label: "Payment Pending" },
};

const STATUS_BAR_COLORS: Record<string, string> = {
    waiting_confirmation: "bg-yellow-500",
    waiting_user_review: "bg-orange-500",
    confirmed: "bg-blue-500",
    in_pickup: "bg-cyan-500",
    in_process: "bg-indigo-500",
    ready_to_deliver: "bg-teal-500",
    out_for_delivery: "bg-purple-500",
    delivered: "bg-emerald-500",
    cancelled: "bg-red-500",
    payment_pending: "bg-amber-500",
};

function getStatusStyle(status: string) {
    return STATUS_COLORS[status] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", label: status.replace(/_/g, " ") };
}

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .map(w => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", {
        month: "short", day: "numeric", year: "numeric",
    }).format(d);
}

function formatDateTime(dateStr: string) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
    }).format(d);
}

export default function UserProfileClient({ userData, error }: { userData: UserProfileData | null; error?: string }) {
    // IMPORTANT: Call all hooks before any early returns to comply with React Rules of Hooks
    const chartMax = useMemo(() => {
        if (!userData?.monthlyTrend?.length) return 1;
        return Math.max(...userData.monthlyTrend.map(m => m.orders), 1);
    }, [userData?.monthlyTrend]);

    if (error || !userData) {
        return (
            <ProtectedRoute>
                <main className="flex-1 p-6 lg:p-8">
                    <Link href="/users" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500 mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Users
                    </Link>
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-700 dark:text-red-400">User Not Found</h3>
                            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error || "The requested user could not be loaded."}</p>
                        </div>
                    </div>
                </main>
            </ProtectedRoute>
        );
    }

    const user = userData;

    return (
        <ProtectedRoute>
            <main className="flex-1 p-6 lg:p-8 max-w-[1200px]">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
                    <Link href="/" className="hover:text-gray-600 transition-colors">🏠 Home</Link>
                    <span>›</span>
                    <Link href="/users" className="hover:text-gray-600 transition-colors">Users</Link>
                    <span>›</span>
                    <span className="text-gray-600 dark:text-gray-300">User {user.customerId}</span>
                </div>

                {/* User Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-lg font-bold shadow-md flex-shrink-0">
                            {getInitials(user.name || "U")}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name || "Unknown"}</h1>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                                <span className="font-mono text-xs text-gray-400">ID: {user.customerId}</span>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <span className="flex items-center gap-1">
                                    <CalendarClock className="w-3.5 h-3.5" />
                                    Joined {formatDate(user.joinedAt)}
                                </span>
                                {user.lastActiveAt && (
                                    <>
                                        <span className="text-gray-300 dark:text-gray-600">•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            Last Active {formatDate(user.lastActiveAt)}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Source Badge */}
                    <div className="flex-shrink-0">
                        {user.source === "organic" ? (
                            <div className="px-3 py-2 rounded-xl border-2 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-center">
                                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Signup Type</div>
                                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 justify-center">
                                    <Globe className="w-3.5 h-3.5" />
                                    Organic
                                </div>
                            </div>
                        ) : (
                            <div className="px-3 py-2 rounded-xl border-2 border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-center">
                                <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Signup Type</div>
                                <div className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 justify-center">
                                    <Store className="w-3.5 h-3.5" />
                                    Shop Created
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        label="Total Orders"
                        value={user.stats.totalOrders.toString()}
                        icon={<ShoppingBag className="w-5 h-5 text-brand-500" />}
                    />
                    <StatCard
                        label="LTV"
                        value={`₹${user.stats.totalSpent.toLocaleString("en-IN")}`}
                        icon={<IndianRupee className="w-5 h-5 text-emerald-500" />}
                    />
                    <StatCard
                        label="Avg Order Value"
                        value={`₹${user.stats.avgOrderValue.toLocaleString("en-IN")}`}
                        icon={<BarChart3 className="w-5 h-5 text-blue-500" />}
                    />
                    <StatCard
                        label="Frequency"
                        value={`${user.stats.frequency}/mo`}
                        icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
                    />
                </div>

                {/* Order Frequency Chart */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Order Frequency (Last 12 Months)</h3>
                    <div className="flex items-end gap-1.5" style={{ height: 180 }}>
                        {user.monthlyTrend.map((m, i) => {
                            const barMaxPx = 148; // leave room for label + hover value
                            const barHeight = chartMax > 0 ? Math.max((m.orders / chartMax) * barMaxPx, m.orders > 0 ? 8 : 3) : 3;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end group" style={{ height: '100%' }}>
                                    {/* Hover value */}
                                    {m.orders > 0 && (
                                        <span className="text-[10px] font-bold text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                                            {m.orders}
                                        </span>
                                    )}
                                    {/* Bar */}
                                    <div
                                        className={`w-full max-w-[32px] rounded-t-md transition-all duration-300 ${m.orders > 0
                                            ? "bg-gradient-to-t from-brand-500 to-brand-400 group-hover:from-brand-600 group-hover:to-brand-500"
                                            : "bg-gray-100 dark:bg-gray-800"
                                        }`}
                                        style={{ height: barHeight }}
                                    />
                                    {/* Label */}
                                    <span className="text-[10px] text-gray-400 font-medium mt-1.5">{m.month}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Grid: Contact + Recent Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
                    {/* Contact Information */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Contact Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.email || "Not provided"}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.phone || "Not provided"}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                    {user.source === "organic" ? <Globe className="w-4 h-4 text-purple-500" /> : <Store className="w-4 h-4 text-purple-500" />}
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Signed Up Via</div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white uppercase">
                                        {user.source === "organic" ? "Website / App" : "Shop Created"}
                                    </div>
                                </div>
                            </div>
                            {user.savedAddresses && user.savedAddresses.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <MapPin className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Address</div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {user.savedAddresses[0]?.area}{user.savedAddresses[0]?.city ? `, ${user.savedAddresses[0].city}` : ""}
                                        </div>
                                        {user.savedAddresses.length > 1 && (
                                            <div className="text-xs text-gray-400 mt-0.5">+{user.savedAddresses.length - 1} more addresses</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Recent Activity
                            </h3>
                            {user.recentOrders.length > 5 && (
                                <span className="text-xs font-medium text-brand-500 cursor-pointer hover:underline">View All</span>
                            )}
                        </div>

                        {user.recentOrders.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">No orders yet</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            <th className="pb-2.5 pr-3">Order ID</th>
                                            <th className="pb-2.5 pr-3">Date</th>
                                            <th className="pb-2.5 pr-3 text-right">Amount</th>
                                            <th className="pb-2.5 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                        {user.recentOrders.slice(0, 5).map((order) => {
                                            const statusStyle = getStatusStyle(order.status);
                                            return (
                                                <tr key={order.orderId} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                                                    <td className="py-3 pr-3">
                                                        <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                                                            #{order.orderId.replace("order_", "").slice(0, 6).toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-3">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                            {formatDateTime(order.date)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-3 text-right">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                            ₹{order.amount.toLocaleString("en-IN")}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                                                            {statusStyle.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Status Distribution */}
                {user.statusDistribution.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm max-w-md">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Order Status Distribution</h3>
                        <div className="space-y-3">
                            {user.statusDistribution
                                .sort((a, b) => b.count - a.count)
                                .map((item) => {
                                    const statusStyle = getStatusStyle(item.status);
                                    const barColor = STATUS_BAR_COLORS[item.status] || "bg-gray-400";
                                    return (
                                        <div key={item.status} className="flex items-center gap-3">
                                            <div className="w-28 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase truncate">
                                                {statusStyle.label}
                                            </div>
                                            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${barColor}`}
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                            <div className="text-xs font-bold text-gray-500 w-16 text-right whitespace-nowrap">
                                                {item.count} ({item.percentage}%)
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </div>
                )}
            </main>
        </ProtectedRoute>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                {icon}
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
        </div>
    );
}
