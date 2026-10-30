// proxy.ts — Next 16 request proxy (formerly middleware).
//
// A convenience gate, not the security boundary: it only checks that a Stytch session
// cookie exists so signed-out visitors land on /login. The ADXC API verifies the actual
// token on every request.
//
// /login is never redirected away from here — the login page does that itself once
// Stytch confirms the session, so a stale cookie can't cause a redirect loop.

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/config";

export function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    if (pathname === "/login") return NextResponse.next();

    const signedIn = request.cookies.has(SESSION_COOKIE);
    const devKey = Boolean(process.env.ADXC_DEV_API_KEY) && process.env.NODE_ENV !== "production";
    if (signedIn || devKey) return NextResponse.next();

    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
}

export const config = {
    matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
