"use server";

import { AppVersion } from "@/types/AppVersion";
import { apiFetch } from "../api";
import { revalidatePath } from "next/cache";

/**
 * Fetch all app versions via admin API
 */
export async function getAdminAppVersions() {
  try {
    const response = await apiFetch("/api/v1/admin/versions");
    const data = await response.json();
    
    return { data: data.data as AppVersion[] };
  } catch (error: any) {
    console.error("[getAdminAppVersions] Error:", error);
    return { error: error.message || "An unexpected error occurred" };
  }
}

/**
 * Update or create an app version entry
 */
export async function updateAppVersion(payload: Partial<AppVersion>) {
  try {
    const response = await apiFetch("/api/v1/admin/versions", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    revalidatePath("/app-versions");
    
    return { data: data.data as AppVersion };
  } catch (error: any) {
    console.error("[updateAppVersion] Error:", error);
    return { error: error.message || "An unexpected error occurred" };
  }
}
