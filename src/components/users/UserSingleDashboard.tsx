"use client";
import React from "react";
import { 
    ShoppingBag, 
    IndianRupee, 
    BarChart3, 
    Calendar, 
    Mail, 
    Phone, 
    Wallet, 
    UserPlus, 
    ChevronRight,
    TrendingUp,
    ShieldCheck,
    MapPin,
    ExternalLink,
    Clock,
    User as UserIcon,
    Copy,
    Share2,
    Activity,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import Badge from "@/components/ui/badge/Badge";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import { UserTrendChart } from "./UserTrendChart";

interface UserSingleDashboardProps {
    stats: any;
}

export const UserSingleDashboard = ({ stats }: UserSingleDashboardProps) => {
    if (!stats) return <div className="p-10 text-center text-gray-400">Loading user data...</div>;

    const { user, metrics, statusBreakdown, recentActivity } = stats;
    const { setCustomTitle } = useBreadcrumb();

    React.useEffect(() => {
        if (user?.name) {
            setCustomTitle(user.name);
        }
        return () => setCustomTitle(null);
    }, [user?.name, setCustomTitle]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const metricItems = [
        {
            title: "Total Orders",
            value: metrics.totalOrders,
            icon: ShoppingBag,
            color: "text-brand-500",
            bg: "bg-brand-50 dark:bg-brand-500/10"
        },
        {
            title: "LTV",
            value: `₹${metrics.ltv.toLocaleString()}`,
            icon: IndianRupee,
            color: "text-success-500",
            bg: "bg-success-50 dark:bg-success-500/10"
        },
        {
            title: "Avg Order Value",
            value: `₹${Math.round(metrics.avgOrderValue).toLocaleString()}`,
            icon: BarChart3,
            color: "text-warning-500",
            bg: "bg-warning-50 dark:bg-warning-500/10"
        },
        {
            title: "Wallet Balance",
            value: `₹${user.walletBalance.toLocaleString()}`,
            icon: Wallet,
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-500/10"
        },
        {
            title: "EZY Tokens",
            value: `${(user.launezyCoins || 0).toLocaleString()} EZY`,
            icon: Activity,
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-500/10"
        },
        {
            title: "Total Profit",
            value: `₹${metrics.totalProfit.toLocaleString()}`,
            icon: TrendingUp,
            color: "text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-500/10"
        },
        {
            title: "Frequency",
            value: `${metrics.ordersPerMonth} /mo`,
            icon: Activity,
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-500/10"
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-lg">
                            {getInitials(user.name)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {user.name}
                                {user.referralCount >= 5 && <Badge color="success" variant="solid">VIP REFERRER</Badge>}
                            </h2>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 font-medium">
                                <span className="font-mono text-xs text-gray-400">ID: {user.userId}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={12} />
                                    Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
                                </span>
                                {metrics.lastOrderDate && (
                                    <>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <span className="flex items-center gap-1.5 text-brand-500">
                                            <Clock size={12} />
                                            Last Active {format(new Date(metrics.lastOrderDate), "MMM d, yyyy")}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Referral Code</p>
                        <p className="text-sm font-bold text-brand-500">{user.referralCode || "NONE"}</p>
                    </div>
                </div>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {metricItems.map((item, idx) => (
                    <div 
                        key={idx}
                        className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 flex items-center justify-between shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{item.title}</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{item.value}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                            <item.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Frequency Trend Graph */}
            <div className="animate-in slide-in-from-bottom duration-500 delay-150">
                <UserTrendChart 
                    title="Order Frequency (Last 12 Months)"
                    categories={stats.trends.categories}
                    currentSeries={stats.trends.current}
                    previousSeries={stats.trends.previous}
                    currentLabel="Current Year"
                    previousLabel="Previous Year"
                    color="#465fff"
                />
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Secondary Cards Column */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* User Details Card */}
                    <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">
                            Contact Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500">
                                    <Mail size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider leading-none mb-1">Email Address</p>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{user.email || "Not provided"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-success-50 dark:bg-success-500/10 text-success-500">
                                    <Phone size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider leading-none mb-1">Phone Number</p>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.phoneNumber || "Not provided"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-warning-50 dark:bg-warning-500/10 text-warning-500">
                                    <UserPlus size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider leading-none mb-1">Referred By</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{user.referredBy || "DIRECT SIGNUP"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Order Status Distribution</h3>
                        <div className="space-y-4">
                            {Object.entries(statusBreakdown).map(([status, count]) => {
                                const total = metrics.totalOrders + metrics.cancelledOrders + metrics.pendingOrders;
                                const percentage = Math.round((Number(count) / (total || 1)) * 100);
                                
                                return (
                                    <div key={status} className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            <span>{status.replace(/_/g, " ")}</span>
                                            <span className="text-gray-900 dark:text-white">{String(count)} ({percentage}%)</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-brand-500 rounded-full" 
                                                style={{ width: `${percentage}%` }} 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="col-span-12 lg:col-span-8">
                    <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 shadow-sm overflow-hidden h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <Activity size={18} className="text-brand-500" />
                                Recent Activity
                            </h3>
                            <Link href={`/orders?userId=${user.userId}`} className="text-xs font-bold text-brand-500 hover:underline">View All</Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800">
                                        <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                                        <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                                        <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="pb-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {recentActivity.length > 0 ? (
                                        recentActivity.map((order: any) => (
                                            <tr key={order.orderId} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="py-4">
                                                    <span className="font-mono text-xs font-bold text-gray-900 dark:text-white px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">#{order.orderId.slice(-6)}</span>
                                                </td>
                                                <td className="py-4 text-xs text-gray-500">
                                                    {format(new Date(order.createdAt), "MMM d, hh:mm a")}
                                                </td>
                                                <td className="py-4 font-bold text-sm">
                                                    ₹{order.grandTotalPaid || 0}
                                                </td>
                                                <td className="py-4">
                                                    <Badge 
                                                        color={order.status === "delivered" ? "success" : order.status === "cancelled" ? "error" : "warning"}
                                                        variant="solid"
                                                        size="sm"
                                                    >
                                                        {order.status.replace(/_/g, " ")}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <Link href={`/orders/${order.orderId}`} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-brand-500 transition-colors">
                                                        <ChevronRight size={14} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-10 text-center text-sm text-gray-400 italic">No orders found for this user.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
