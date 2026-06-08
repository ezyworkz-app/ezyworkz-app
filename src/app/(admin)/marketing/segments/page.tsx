import React from "react";
import { Metadata } from "next";
import { getSegmentedUsers } from "@/lib/actions/users";
import { getDashboardStats } from "@/lib/actions/dashboard";
import SegmentationStats from "@/components/marketing/SegmentationStats";
import SegmentedUserTable from "@/components/marketing/SegmentedUserTable";
import SegmentationChart from "@/components/marketing/SegmentationChart";
import { AOVDistributionChart } from "@/components/marketing/AOVDistributionChart";
import { RecencyDistributionChart } from "@/components/marketing/RecencyDistributionChart";
import { TopServicesChart } from "@/components/marketing/TopServicesChart";
import { InfluencerTiersChart } from "@/components/marketing/InfluencerTiersChart";
import { UserSegment } from "@/types/user";

export const metadata: Metadata = {
    title: "Marketing Hub | Launezy Admin",
    description: "Identify and re-engage dormant users with precision marketing.",
};

export default async function SegmentedUsersPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    
    const page = typeof searchParams.page === "string" ? parseInt(searchParams.page) : 1;
    const limit = typeof searchParams.limit === "string" ? parseInt(searchParams.limit) : 10;
    const search = typeof searchParams.search === "string" ? searchParams.search : undefined;
    const segment = typeof searchParams.segment === "string" ? searchParams.segment : undefined;
    const sortBy = typeof searchParams.sortBy === "string" ? searchParams.sortBy : "daysSinceLastOrder";
    const sortDir = typeof searchParams.sortDir === "string" ? searchParams.sortDir : "desc";

    // Fetch both re-engagement data and broad distribution stats
    const [segmentedData, dashboardStats] = await Promise.all([
        getSegmentedUsers(page, limit, search, segment, sortBy, sortDir),
        getDashboardStats("Last 30 days")
    ]);

    const { users, total } = segmentedData;

    // Calculate funnel stats for re-engagement
    const { users: allUsers } = await getSegmentedUsers(1, 1000); 
    const funnelStats: Record<UserSegment, number> = {
        FIRST_TIME: allUsers.filter(u => u.segment === "FIRST_TIME").length,
        INACTIVE_ONE_TIME: allUsers.filter(u => u.segment === "INACTIVE_ONE_TIME").length,
        INACTIVE_FREQUENT: allUsers.filter(u => u.segment === "INACTIVE_FREQUENT").length,
    };

    return (
        <div className="p-4 md:p-8 space-y-12 max-w-[1600px] mx-auto min-h-screen relative overflow-hidden">
            {/* Background Decorative Glow */}
            <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-brand-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-brand-500/5 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2" />

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/40 rotate-3 transition-transform hover:rotate-0">
                            <span className="text-white font-black text-2xl">M</span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
                                Marketing Hub
                            </h1>
                            <div className="h-1 w-24 bg-brand-500 rounded-full mt-1" />
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 max-w-2xl leading-relaxed">
                        Precision re-engagement and market analysis. Leverage distribution data to launch targeted campaigns and maximize your platform's customer lifetime value.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-3 overflow-hidden">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="inline-block h-10 w-10 rounded-full ring-4 ring-white dark:ring-gray-950 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 border border-gray-200 dark:border-gray-700">
                                {i}
                            </div>
                        ))}
                    </div>
                    <div className="h-10 w-px bg-gray-200 dark:bg-gray-800" />
                    <div className="px-5 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm group">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block group-hover:text-brand-500 transition-colors">Real-time Scan</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-black text-gray-900 dark:text-white">LIVE NOW</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Re-engagement Funnel Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black bg-brand-500/10 text-brand-600 px-2 py-1 rounded-md tracking-widest uppercase">Phase 1</span>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Re-engagement Funnel</h2>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    <div className="xl:col-span-3">
                        <SegmentationStats stats={funnelStats} />
                    </div>
                    <div className="xl:col-span-1">
                        <SegmentationChart data={funnelStats} />
                    </div>
                </div>
            </div>

            {/* Market Insights Distribution Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black bg-brand-500/10 text-brand-600 px-2 py-1 rounded-md tracking-widest uppercase">Phase 2</span>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight text-brand-600">Market Insights</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-2">
                        <AOVDistributionChart data={dashboardStats?.advanced?.aovDistribution || {}} />
                    </div>
                    <div className="lg:col-span-2">
                        <RecencyDistributionChart data={dashboardStats?.advanced?.recencyDistribution || {}} />
                    </div>
                    <div className="lg:col-span-2">
                        <TopServicesChart data={dashboardStats?.advanced?.topServices || {}} />
                    </div>
                    <div className="lg:col-span-2">
                        <InfluencerTiersChart data={dashboardStats?.advanced?.influencerTiers || {}} />
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black bg-brand-500/10 text-brand-600 px-2 py-1 rounded-md tracking-widest uppercase">Action</span>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Active Opportunities</h2>
                        <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Launch targeted outreach to 45+ day dormant users</p>
                    </div>
                </div>
                <div className="bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl rounded-[2.5rem] p-1 border border-gray-100 dark:border-white/5 shadow-2xl shadow-gray-200/50 dark:shadow-none">
                    <SegmentedUserTable 
                        users={users} 
                        total={total} 
                        currentPage={page} 
                        limit={limit} 
                    />
                </div>
            </div>
        </div>
    );
}
