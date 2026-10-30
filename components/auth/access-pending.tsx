"use client";

// Signed in with Stytch, but the ADXC API refused this organisation (403). Causes we've
// seen: an address not yet admitted to the closed beta, a Stytch organisation with no
// ADXC organisation behind it, or an email auto-joined to an org by its domain.
// The API's own message says which, so it leads. The action depends on whether the
// person has another organisation to try.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStytchB2BClient, useStytchMember, useStytchOrganization } from "@stytch/nextjs/b2b";
import { Button } from "@/components/ui/button";

const FALLBACK =
    "Your account doesn't have access to ADXC yet. ADXC is in closed beta, so new addresses need to be admitted. Ask your ADXC contact or your organisation's admin.";

export function AccessPending({ detail }: { detail?: string | null }) {
    const stytch = useStytchB2BClient();
    const { member } = useStytchMember();
    const { organization } = useStytchOrganization();
    const router = useRouter();
    const [pending, setPending] = useState(false);
    // null while checking; true if the person belongs to more than this one organisation.
    const [hasOtherOrgs, setHasOtherOrgs] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;
        stytch.discovery.organizations
            .list()
            .then((res) => {
                const active = res.discovered_organizations.filter((d) => d.membership.type === "active_member");
                if (!cancelled) setHasOtherOrgs(active.length > 1);
            })
            .catch(() => !cancelled && setHasOtherOrgs(false));
        return () => {
            cancelled = true;
        };
    }, [stytch]);

    // Ends this session, back to sign-in: the org list, or a fresh email.
    async function leave() {
        setPending(true);
        try {
            await stytch.session.revoke();
        } finally {
            router.replace("/login");
        }
    }

    const other = hasOtherOrgs === true;

    return (
        <main className="flex min-h-screen items-center justify-center px-4">
            <div className="max-w-md space-y-4 border bg-card p-6">
                <h1 className="text-h4">{other ? "You can't use this organisation yet" : "You don't have access to ADXC yet"}</h1>
                {(member || organization) && (
                    <p className="text-xs text-muted-foreground">
                        Signed in as <span className="text-foreground">{member?.email_address ?? "—"}</span>
                        {organization && (
                            <>
                                {" "}in <span className="text-foreground">{organization.organization_name}</span>
                            </>
                        )}
                    </p>
                )}
                <p className="text-sm text-foreground-alt">{detail || FALLBACK}</p>
                {hasOtherOrgs !== null && (
                    <p className="text-xs text-muted-foreground">
                        {other
                            ? "You belong to another organisation. Choose it instead."
                            : "If you have another work email with access, sign in with that instead."}
                    </p>
                )}
                <Button className="rounded-xs" onClick={leave} disabled={pending || hasOtherOrgs === null}>
                    {pending ? "One moment…" : other ? "Choose another organisation" : "Use a different email"}
                </Button>
            </div>
        </main>
    );
}
