"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LayoutDashboard, Users, Receipt, TrendingUp, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "@/context/ShopContext";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { getAllOrders } from "@/lib/actions/orders";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";

export default function Dashboard() {
    const { userRole, isLoading: isShopLoading } = useShop();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isShopLoading) return;

        // Staff members do NOT need the Dashboard - redirect directly to Orders page
        if (userRole === "staff") {
            router.replace("/orders");
            return;
        }

        async function fetchData() {
            try {
                // Fetch stats for "Today" to get metrics explicitly
                const data = await getDashboardStats("Today");
                setStats(data);
                
                // Fetch recent orders
                const ordersRes = await getAllOrders(5);
                if (ordersRes && ordersRes.orders) {
                    setRecentOrders(ordersRes.orders);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [userRole, isShopLoading, router]);

    if (userRole === "staff") {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex items-center gap-3 text-gray-500 font-medium">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                    <span>Redirecting to Orders...</span>
                </div>
            </div>
        );
    }

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
                        { label: "Today's Orders", value: loading ? "..." : (stats?.financials?.todayOrdersCount || 0), icon: Receipt, color: "text-blue-400", bg: "bg-blue-500/10" },
                        { label: "New Customers", value: loading ? "..." : (stats?.acquisition?.newUsersCount || 0), icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
                        { label: "Revenue (Today)", value: loading ? "..." : `₹${stats?.financials?.todaySales?.toLocaleString() || 0}`, icon: TrendingUp, color: "text-teal-400", bg: "bg-teal-500/10" },
                        { label: "Total Orders", value: loading ? "..." : (stats?.metrics?.totalOrders || 0), icon: LayoutDashboard, color: "text-amber-400", bg: "bg-amber-500/10" },
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

                <div className="mb-8 relative z-10">
                    {!loading && stats?.charts?.revenueTrend && (
                        <StatisticsChart 
                           categories={stats.charts.revenueTrend.categories}
                           salesData={stats.charts.revenueTrend.current}
                           revenueData={stats.charts.revenueTrend.previous}
                        />
                    )}
                </div>

                <div className="mb-8 relative z-10">
                    {!loading && recentOrders.length > 0 && (
                        <RecentOrders orders={recentOrders} />
                    )}
                </div>
            </main>
        </ProtectedRoute>
    );
}
