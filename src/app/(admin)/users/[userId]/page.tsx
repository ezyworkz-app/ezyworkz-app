import { Suspense } from "react";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";
import UserProfileClient from "./UserProfileClient";
import { Loader2 } from "lucide-react";

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    let userData: any = null;
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
            const res = await apiFetch(`/api/v1/customers/${shopId}/${userId}`);
            const data = await res.json();
            if (data.success && data.data) {
                userData = data.data;
            } else {
                error = data.message || "User not found";
            }
        } else {
            error = "No shop ID could be determined.";
        }
    } catch (err: any) {
        console.error("Failed to load user profile", err);
        error = err.message || "Failed to load user profile";
    }

    return (
        <Suspense fallback={
            <div className="flex justify-center items-center p-12 h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        }>
            <UserProfileClient userData={userData} error={error} />
        </Suspense>
    );
}
