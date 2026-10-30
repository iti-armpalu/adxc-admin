"use client";

// Stytch's sign-in box, set up the way Rob specified:
//   Discovery flow · email code only · sessions of SESSION_MINUTES · no "Create an organization".
// Themed with the ADXC design tokens. Once Stytch confirms a session, go to the panel.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthFlowType, B2BProducts, StytchB2B, shadcnTheme, useStytchMemberSession } from "@stytch/nextjs/b2b";
import { SESSION_MINUTES } from "@/lib/auth/config";

const config = {
    authFlowType: AuthFlowType.Discovery,
    products: [B2BProducts.emailOtp],
    sessionOptions: { sessionDurationMinutes: SESSION_MINUTES },
    disableCreateOrganization: true,
    // Most people belong to one org: skip the picker for them.
    directLoginForSingleMembership: { status: true, ignoreInvites: false, ignoreJitProvisioning: false },
};

const presentation = {
    theme: {
        ...shadcnTheme, // reads --primary, --border, --muted-foreground… from globals.css
        "font-family": "var(--font-sans)",
        "header-font": "var(--font-heading)",
        "rounded-base": "var(--radius-xs)",
        "button-radius": "var(--radius-xs)",
        "input-radius": "var(--radius-xs)",
        "container-radius": "0px",
        "container-width": "100%",
        shadow: "none",
        background: "var(--card)",
        foreground: "var(--card-foreground)",
    },
    options: { hideHeaderText: true },
};

// Our wording for an email that belongs to no organisation. {email} is filled in by Stytch.
const strings = {
    "organizationDiscovery.noOrgs.title": "No ADXC account for {email}",
    "organizationDiscovery.noOrgs.content":
        "Check the address is right. If it is, ask your organisation's admin to invite you to ADXC.",
};

export function LoginBox({ next }: { next: string }) {
    const router = useRouter();
    const { session, isInitialized, fromCache } = useStytchMemberSession();

    useEffect(() => {
        // Wait for a confirmed (not cached) session so a stale cookie can't bounce us around.
        if (isInitialized && session && !fromCache) router.replace(next);
    }, [isInitialized, session, fromCache, next, router]);

    return <StytchB2B config={config} presentation={presentation} strings={strings} />;
}
