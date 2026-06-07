import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get("accessToken")?.value;

    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
    const isPublicAsset = pathname.startsWith("/_next") ||
        pathname.startsWith("/images") ||
        pathname.includes("favicon.ico") ||
        pathname.startsWith("/api");

    // 1. If user is authenticated and tries to access signin/signup, redirect to dashboard
    if (accessToken && isAuthPage) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // 2. If user is NOT authenticated and tries to access protected routes, redirect to login
    if (!accessToken && !isAuthPage && !isPublicAsset) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images (public images)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
    ],
};
