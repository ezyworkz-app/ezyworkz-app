"use server";

import { cookies } from "next/headers";
import { apiFetch } from "../api";
import { redirect } from "next/navigation";

const ONE_YEAR = 60 * 60 * 24 * 365; // 1 year in seconds

export async function loginServer(
    prevState: { error: string; redirectTo?: string },
    formData: FormData
): Promise<{ error: string; redirectTo?: string }> {
    try {
        const email = formData.get("email") as string;
        const password = formData.get("pwd") as string;

        if (!email || !password) {
            return { error: "Email and password are required." };
        }

        const res = await apiFetch("/api/v1/shop-auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        const json = await res.json();
        
        if (!json.success) {
            return { error: json.message || "Login failed." };
        }

        const { token, shopOwner } = json.data;

        const ck = await cookies();
        ck.set("accessToken", token, {
            httpOnly: true,
            path: "/",
            maxAge: 31536000,
        });
        ck.set("id", shopOwner.shopOwnerId, {
            httpOnly: true,
            path: "/",
            maxAge: 31536000,
        });
        ck.set("role", "shop_owner", {
            httpOnly: true,
            path: "/",
            maxAge: 31536000,
        });

        // Redirect to admin dashboard after successful login
        return { error: "", redirectTo: "/" };
    } catch (err: any) {
        console.error("Login error:", err);
        return { error: err?.message || "Something went wrong. Please try again." };
    }
}

export async function logoutServer() {
    const ck = await cookies();

    // Clear all cookies
    const cookieOptions = { maxAge: 0, path: "/", httpOnly: true };
    ck.set("accessToken", "", cookieOptions);
    ck.set("id", "", cookieOptions);
    ck.set("role", "", cookieOptions);

    redirect("/signin");
}

export async function getShopProfile() {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) return null;

        const res = await apiFetch("/api/v1/shop-auth/me", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
            return json.data;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch shop profile:", error);
        return null;
    }
}

export async function updateShopProfile(
    prevState: { success: boolean; message: string },
    formData: FormData
) {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) return { success: false, message: "Not authenticated" };

        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;

        const res = await apiFetch("/api/v1/shop-auth/me", {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name, phone })
        });
        
        const json = await res.json();
        return { success: json.success, message: json.message || "Profile updated successfully" };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to update profile" };
    }
}
