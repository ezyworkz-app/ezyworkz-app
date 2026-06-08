import type { Metadata } from "next";
import { UserDashboardClient } from "@/components/users/UserDashboardClient";
import { getDashboardStats } from "@/lib/actions/dashboard";

export const metadata: Metadata = {
    title: "User Dashboard | Launezy Admin",
    description: "Business overview of Launezy user base",
};

export default async function UserDashboard() {
    let stats = null;
    try {
        stats = await getDashboardStats();
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
    }

    return <UserDashboardClient initialStats={stats} />;
}
