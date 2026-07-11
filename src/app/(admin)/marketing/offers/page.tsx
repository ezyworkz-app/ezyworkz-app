import { Suspense } from "react";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import ShopOffersClient from "./ShopOffersClient";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RefreshCw } from "lucide-react";

export default async function ShopOffersPage() {
    let initialOffers: any[] = [];
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
            // we use the same endpoint the client was using: /shops/{shopId}/offers
            const response = await apiFetch(`/api/v1/shops/${shopId}/offers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && data.success !== false) {
                initialOffers = data.offers || data.data || [];
            } else {
                error = data.message || "Failed to fetch offers";
            }
        } else {
            error = "No shop ID could be determined.";
        }
    } catch (err: any) {
        console.error("Failed to load initial offers on server", err);
        error = err.message || "Failed to load offers";
    }

    return (
        <ProtectedRoute>
            <Suspense fallback={
                <div className="flex justify-center p-8 h-screen">
                    <RefreshCw className="animate-spin text-gray-400" />
                </div>
            }>
                {error ? (
                    <div className="p-8 text-red-500">
                        {error}
                    </div>
                ) : (
                    <ShopOffersClient initialOffers={initialOffers} />
                )}
            </Suspense>
        </ProtectedRoute>
    );
}
