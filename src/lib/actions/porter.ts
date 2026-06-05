"use server";

import { cookies } from "next/headers";
import { apiFetch } from "../api";
export type PorterTrackingResult = {
    pickup?: any; // could define exact fields later
    delivery?: any; // same here
};

export type PorterCancelResult = {
    success: boolean;
    message: string;
    data?: any; // optional: the backend's returned data
};

export async function trackPorterOrder(
    orderId: string
): Promise<PorterTrackingResult | null> {
    if (!orderId) throw new Error("orderId is required");

    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/porter/orders/track/${orderId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    // No porter order tracked
    if (res.status === 404) {
        return null;
    }

    // Any other non-ok → unexpected
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to track Porter order");
    }

    const data = await res.json();

    // API responded ok, but inside success is false
    if (!data?.success) {
        return null;
    }

    return data.data as PorterTrackingResult;
}

export async function cancelPorterOrder(
    orderId: string,
    type: "pickup" | "delivery"
): Promise<PorterCancelResult | null> {
    try {
        if (!orderId) throw new Error("orderId is required");
        if (!type || !["pickup", "delivery"].includes(type)) {
            throw new Error(`Invalid type: ${type}`);
        }

        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(
            `/api/v1/porter/orders/cancel/${orderId}/${type}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to cancel Porter order");
        }

        return {
            success: true,
            message: data.message,
            data: data.data,
        };
    } catch (error) {
        console.error("[cancelPorterOrder]", error);
        return null;
    }
}
