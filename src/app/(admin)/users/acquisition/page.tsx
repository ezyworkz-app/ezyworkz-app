import type { Metadata } from "next";
import { UserAcquisitionClient } from "@/components/users/UserAcquisitionClient";
import { getDashboardStats } from "@/lib/actions/dashboard";

export const metadata: Metadata = {
    title: "Acquisition Analytics | Launezy Admin",
    description: "New user acquisition, order conversion and repeat behaviour",
};

export default async function UserAcquisitionPage() {
    let stats = null;
    try {
        stats = await getDashboardStats();
    } catch (error) {
        console.error("Failed to fetch acquisition stats:", error);
    }

    return <UserAcquisitionClient initialStats={stats} />;
}
