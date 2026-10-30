"use client";

// One Stytch client for the whole app. It holds the session, writes the session cookies
// on our domain and refreshes the 5-minute JWT in the background while a tab is open.

import { createStytchB2BClient, StytchB2BProvider } from "@stytch/nextjs/b2b";

const publicToken = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN;
if (!publicToken) throw new Error("NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN is not set (see .env.local).");

const stytch = createStytchB2BClient(publicToken);

export function StytchProvider({ children }: { children: React.ReactNode }) {
    return <StytchB2BProvider stytch={stytch}>{children}</StytchB2BProvider>;
}
