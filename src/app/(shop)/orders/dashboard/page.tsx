import { Suspense } from "react";
import { getDashboardStats } from "@/lib/actions/dashboard";
import OrdersDashboardClient, { DashboardSkeleton } from "./OrdersDashboardClient";

export default async function OrdersDashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const range = typeof params.range === 'string' ? params.range : undefined;
    const startDate = typeof params.startDate === 'string' ? params.startDate : undefined;
    const endDate = typeof params.endDate === 'string' ? params.endDate : undefined;

    const options = (startDate && endDate) ? { startDate, endDate } : (range || "Last 30 days");
    
    // Server-side fetch
    let initialStats = null;
    try {
        initialStats = await getDashboardStats(options);
    } catch (err) {
        console.error("Failed to load dashboard stats on server", err);
    }

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <OrdersDashboardClient initialStats={initialStats} />
        </Suspense>
    );
}
