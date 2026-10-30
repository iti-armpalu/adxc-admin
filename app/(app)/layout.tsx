// app/(app)/layout.tsx
//
// Authenticated shell. Loads what every page shows around it: the org, who is
// signed in, and the balance. Pages load their own data.

import { AppShell } from "@/components/shell/app-shell";
import type { ShellData } from "@/components/shell/sidebar-content";
import { AccessPending } from "@/components/auth/access-pending";
import { SessionRefresh } from "@/components/auth/session-refresh";
import { AdxcApiError, getBalance, getCurrentOrg, getMemberMe, isAuthError } from "@/lib/adxc/client";
import { formatTokens } from "@/lib/adxc/format";

async function loadShell(): Promise<ShellData> {
    const org = await getCurrentOrg();
    const [me, balance] = await Promise.all([getMemberMe(org.org_id), getBalance(org.org_id)]);

    if (me.kind === "member") {
        return {
            orgName: org.org_name,
            balance: formatTokens(balance.balance),
            user: { primary: me.email, secondary: me.role === "org_admin" ? "Admin" : "Member" },
            isAdmin: me.role === "org_admin",
            isPerson: true,
        };
    }

    // Dev mode: signed in with an org API key, not a person. Show Team so it can be
    // built against mock data — the real members/keys routes answer 403 for a key.
    return {
        orgName: org.org_name,
        balance: formatTokens(balance.balance),
        user: { primary: me.name, secondary: "API key · development" },
        isAdmin: true,
        isPerson: false,
    };
}

const EMPTY_SHELL: ShellData = { orgName: null, balance: null, user: null, isAdmin: false, isPerson: false };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    let shell = EMPTY_SHELL;
    let failure: unknown = null;
    try {
        shell = await loadShell();
    } catch (err) {
        failure = err;
    }

    // Stale or missing pass: refresh it, then re-render.
    if (isAuthError(failure)) return <SessionRefresh />;
    // Signed in with Stytch but not admitted to ADXC yet (closed beta).
    if (failure instanceof AdxcApiError && failure.status === 403) {
        const d = failure.detail as { detail?: unknown } | string | undefined;
        const detail = typeof d === "string" ? d : typeof d?.detail === "string" ? d.detail : null;
        return <AccessPending detail={detail} />;
    }
    // Anything else: keep the shell usable; the page reports its own error.
    return <AppShell {...shell}>{children}</AppShell>;
}
