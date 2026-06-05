"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!; // non-null

export async function apiFetch(
    path: string,
    init: RequestInit = {}
): Promise<Response> {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("accessToken")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;
    const id = cookieStore.get("id")?.value;

    /** Merge headers safely without overwriting unintentionally */
    const buildHeaders = (token?: string): HeadersInit => {
        const baseHeaders: Record<string, string> =
            init.headers instanceof Headers
                ? Object.fromEntries(init.headers.entries())
                : (init.headers as Record<string, string>) ?? {};

        const headers: Record<string, string> = {
            ...baseHeaders,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        // If Content-Type is not explicitly provided, default to application/json
        // UNLESS the body is FormData (browser/node-fetch handles boundary for FormData)
        if (!headers["Content-Type"] && !(init.body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
        }

        return headers;
    };

    const doFetch = (token?: string) =>
        fetch(`${API_URL}${path}`, {
            ...init,
            headers: buildHeaders(token),
            cache: "no-store",
        });

    /* ───── 1st attempt ───── */
    let res = await doFetch(accessToken);

    /* ───── Try one refresh on 401 ───── */
    if (res.status === 401 && refreshToken && id) {
        const rr = await fetch(`${API_URL}/api/v1/admin/auth/token/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, refreshToken }),
        });

        if (rr.ok) {
            const { data } = await rr.json(); // { token }
            const newAccess = data?.token ?? (data as any)?.token;
            if (newAccess) {
                cookieStore.set("accessToken", newAccess, {
                    path: "/",
                    httpOnly: true,
                });
                res = await doFetch(newAccess); // retry with fresh token
            }
        } else {
            // Refresh failed → clear cookies & redirect to login
            const clearOpts = { path: "/", httpOnly: true, maxAge: 0 };
            cookieStore.set("accessToken", "", clearOpts);
            cookieStore.set("refreshToken", "", clearOpts);
            cookieStore.set("id", "", clearOpts);
            cookieStore.set("role", "", clearOpts);
            redirect("/signin");
        }
    }

    /* ───── Throw helpful error on non-OK ───── */
    if (!res.ok) {
        let errorMessage = `API error ${res.status} ${res.statusText}`;

        try {
            // Clone the response if we need to read it multiple times or if we're unsure
            const clonedRes = res.clone();
            try {
                const body = await clonedRes.json();
                errorMessage = body?.message || errorMessage;
            } catch {
                const bodyText = await clonedRes.text();
                console.error(
                    `API error text (${res.status}) ${path}:`,
                    bodyText.slice(0, 200)
                );
            }
        } catch (e) {
            console.error(`Error parsing API error body:`, e);
        }

        throw new Error(errorMessage);
    }

    return res;
}
