import { Suspense } from "react";
import { getDashboardStats } from "@/lib/actions/dashboard";
import RevenueGoalsClient, { GoalsSkeleton } from "./RevenueGoalsClient";

export default async function RevenueGoalsPage() {
    let initialStats = null;
    try {
        initialStats = await getDashboardStats("Last 30 days");
    } catch (err) {
        console.error("Failed to load revenue goals stats on server", err);
    }

    return (
        <Suspense fallback={<GoalsSkeleton />}>
            <RevenueGoalsClient initialStats={initialStats} />
        </Suspense>
    );
}
