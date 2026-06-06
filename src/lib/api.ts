"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

let baseApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
if (!baseApiUrl.endsWith('/api/v1')) {
    baseApiUrl = baseApiUrl.replace(/\/$/, '') + '/api/v1';
}
// For server actions, if baseApiUrl is relative, it will fail unless absolute. 
// But here it usually comes from NEXT_PUBLIC_API_URL.
// The base url should NOT include /api/v1 if the path already starts with /api/v1
// Wait, doFetch does fetch(`${API_URL}${path}`). If path is `/api/v1/admin/shops/...` then we don't want to duplicate `/api/v1`.
const API_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');


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
            redirect("/login");
        }
    }

    /* ───── Throw helpful error on non-OK ───── */
    if (!res.ok) {
        let errorMessage = `API error ${res.status} ${res.statusText}`;

        try {
            const bodyText = await res.clone().text();
            try {
                const body = JSON.parse(bodyText);
                errorMessage = body?.message || errorMessage;
            } catch {
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
