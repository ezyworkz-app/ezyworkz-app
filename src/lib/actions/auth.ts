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

        const res = await apiFetch("/api/v1/admin/auth/session/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        const json = await res.json();
        const { token, refreshToken, adminId, role } = json.data;

        const ck = await cookies();
        ck.set("accessToken", token, {
            httpOnly: true,
            path: "/",
            maxAge: 31536000,
        });
        ck.set("refreshToken", refreshToken, {
            httpOnly: true,
            path: "/",
            maxAge: 31536000,
        });
        ck.set("id", adminId, {
            httpOnly: true,
            path: "/",
            maxAge: 31536000,
        });
        ck.set("role", role, {
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
    const refreshToken = ck.get("refreshToken")?.value;

    // Optional: Invalidate refresh token in backend
    if (refreshToken) {
        try {
            await apiFetch("/api/v1/admin/auth/session/logout", {
                method: "POST",
                body: JSON.stringify({ refreshToken }),
            });
        } catch (err) {
            console.warn("Failed to revoke refresh token:", err);
        }
    }

    // Clear all cookies
    const cookieOptions = { maxAge: 0, path: "/", httpOnly: true };
    ck.set("accessToken", "", cookieOptions);
    ck.set("refreshToken", "", cookieOptions);
    ck.set("id", "", cookieOptions);
    ck.set("role", "", cookieOptions);

    redirect("/signin");
}
