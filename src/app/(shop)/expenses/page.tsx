import { Suspense } from "react";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import { ExpensesView } from "./ExpensesView";
import { Loader2 } from "lucide-react";

export default async function ExpensesPage() {
    let initialExpenses: any[] = [];
    let error = "";

    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;
        let shopId = cookieStore.get("shopId")?.value;
        
        if (!shopId && token) {
            try {
                const API_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
                const res = await fetch(`${API_URL}/api/v1/shops/my-shops`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store'
                });
                const data = await res.json();
                if (data.success && data.data && data.data.length > 0) {
                    shopId = data.data[0].shopId;
                }
            } catch (e) {
                console.warn("Failed to fetch shopId in SSR", e);
            }
        }

        if (shopId) {
            const response = await apiFetch(`/api/v1/shops/${shopId}/expenses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && data.success !== false) {
                initialExpenses = data.data?.expenses || data.expenses || [];
            } else {
                error = data.message || "Failed to fetch expenses";
            }
        } else {
            error = "No shop ID could be determined.";
        }
    } catch (err: any) {
        console.error("Failed to load initial expenses on server", err);
        error = err.message || "Failed to load expenses";
    }

    return (
        <Suspense fallback={
            <div className="flex justify-center items-center p-12 h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        }>
            <ExpensesView activeTab="ALL" initialExpenses={initialExpenses} error={error} />
        </Suspense>
    );
}
