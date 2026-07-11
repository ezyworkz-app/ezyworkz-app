import { Suspense } from "react";
import { cookies } from "next/headers";
import { getShopCustomers } from "@/lib/actions/users";
import UsersClient from "./UsersClient";
import { Loader2 } from "lucide-react";

export default async function UsersPage() {
    let initialCustomers: any[] = [];
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
            const { users } = await getShopCustomers(shopId);
            initialCustomers = users || [];
        } else {
            error = "No shop ID could be determined.";
        }
    } catch (err: any) {
        console.error("Failed to load initial customers on server", err);
        error = err.message || "Failed to load customers";
    }

    return (
        <Suspense fallback={
            <div className="flex justify-center items-center p-12 h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        }>
            <UsersClient initialCustomers={initialCustomers} error={error} />
        </Suspense>
    );
}
