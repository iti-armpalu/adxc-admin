// proxy.ts — Next 16 request proxy (formerly middleware).
//
// Auth is not wired yet: in development the API client signs requests with
// ADXC_DEV_API_KEY, so every route is open locally.
// TODO: wire up Stytch — redirect to /login when there is no Stytch session,
// and send signed-in visitors on /login to "/".

import { NextResponse } from "next/server";

export function proxy() {
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
