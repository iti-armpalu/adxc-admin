// app/(app)/layout.tsx
//
// Authenticated shell. Loads what every page shows around it: the org, who is
// signed in, and the balance. Pages load their own data.

import { AppShell } from "@/components/shell/app-shell";
import type { ShellData } from "@/components/shell/sidebar-content";
import { getBalance, getCurrentOrg, getMemberMe } from "@/lib/adxc/client";
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
        };
    }

    // Dev mode: signed in with an org API key, not a person. Show Team so it can be
    // built against mock data — the real members/keys routes answer 403 for a key.
    return {
        orgName: org.org_name,
        balance: formatTokens(balance.balance),
        user: { primary: me.name, secondary: "API key · development" },
        isAdmin: true,
    };
}

const EMPTY_SHELL: ShellData = { orgName: null, balance: null, user: null, isAdmin: false };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    let shell = EMPTY_SHELL;
    try {
        shell = await loadShell();
    } catch {
        // The page underneath reports the API error; keep the shell usable.
    }
    return <AppShell {...shell}>{children}</AppShell>;
}
