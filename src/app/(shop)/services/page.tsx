import { Suspense } from "react";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import ServicesClient from "./ServicesClient";
import { Loader2 } from "lucide-react";

export default async function ServicesPage() {
    let initialServices: any[] = [];
    let initialGlobalServices: any[] = [];
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
            const [shopSvcRes, globalSvcRes, globalCatRes] = await Promise.all([
                apiFetch(`/api/v1/public/shop/json/${shopId}`).catch(() => null),
                apiFetch(`/api/v1/global/services`).catch(() => null),
                apiFetch(`/api/v1/global/categories`).catch(() => null)
            ]);

            const shopData = shopSvcRes ? await shopSvcRes.json().catch(() => ({})) : {};
            const globalData = globalSvcRes ? await globalSvcRes.json().catch(() => ({})) : {};
            const globalCatData = globalCatRes ? await globalCatRes.json().catch(() => ({})) : {};

            const shopServicesList = shopData.data?.services || shopData.services || [];
            const globalSvcs = globalData.data?.services || globalData.data || globalData.services || [];
            const globalCats = globalCatData.data?.categories || globalCatData.data || globalCatData.categories || [];
            
            initialServices = shopServicesList.map((s: any) => ({
                ...s,
                name: s.name || globalSvcs.find((g: any) => g.globalServiceId === s.globalServiceId)?.name || "Unnamed Service",
                categories: (s.categories || []).map((c: any) => {
                    const fallbackName = globalCats.find((g: any) => g.globalCategoryId === c.globalCategoryId)?.name;
                    return {
                        ...c,
                        name: c.name || fallbackName || "Unnamed Category"
                    };
                })
            }));
            
            initialGlobalServices = globalSvcs;
        } else {
            error = "No shop ID could be determined.";
        }
    } catch (err: any) {
        console.error("Failed to load initial services on server", err);
        error = err.message || "Failed to load services";
    }

    return (
        <Suspense fallback={
            <div className="flex-1 p-8 h-screen overflow-hidden flex flex-col justify-center items-center bg-[#0e1424]">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
        }>
            <ServicesClient 
                initialServices={initialServices} 
                initialGlobalServices={initialGlobalServices} 
                error={error} 
            />
        </Suspense>
    );
}
