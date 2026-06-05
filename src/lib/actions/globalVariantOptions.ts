"use server";

import { apiFetch } from "../api";
import { GlobalVariantOption } from "@/types/global";

export async function getAllGlobalVariantOptions(): Promise<GlobalVariantOption[]> {
    try {
        const res = await apiFetch("/api/v1/global/variant-options");

        if (!res.ok) {
            throw new Error("Failed to fetch global variant options");
        }

        const data = await res.json();
        return data as GlobalVariantOption[];

    } catch (error) {
        console.error("[getAllGlobalVariantOptions]", error);
        return [];
    }
}
