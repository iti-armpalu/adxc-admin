"use client";

// The org name at the top of the sidebar. For a signed-in person it opens a list of the
// organisations they belong to; picking one swaps the Stytch session to that org and
// reloads the panel (realms, questions and members all belong to one org).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { useStytchB2BClient, useStytchMember, useStytchMemberSession } from "@stytch/nextjs/b2b";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SESSION_MINUTES } from "@/lib/auth/config";
import { VerifyOrgDialog, type OrgTarget } from "./verify-org-dialog";

type OrgOption = { id: string; name: string };

export function OrgSwitcher({ orgName }: { orgName: string | null }) {
    const stytch = useStytchB2BClient();
    const { session } = useStytchMemberSession();
    const { member } = useStytchMember();
    // Org that needs an email code before we can switch into it.
    const [verifying, setVerifying] = useState<OrgTarget | null>(null);
    const router = useRouter();
    const [orgs, setOrgs] = useState<OrgOption[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const label = (
        <>
            <p className="text-caption uppercase text-sidebar-muted">Organisation</p>
            <p className="truncate font-medium text-foreground">{orgName ?? "—"}</p>
        </>
    );

    // Dev API key (no Stytch session): nothing to switch.
    if (!session) return <div className="min-w-0">{label}</div>;

    async function load() {
        if (orgs) return;
        try {
            const res = await stytch.discovery.organizations.list();
            setOrgs(
                res.discovered_organizations
                    .filter((d) => d.membership.type === "active_member")
                    .map((d) => ({ id: d.organization.organization_id, name: d.organization.organization_name })),
            );
        } catch {
            setError("Couldn't load your organisations.");
        }
    }

    function switchTo(id: string) {
        if (id === session?.organization_id) return;
        const target = orgs?.find((o) => o.id === id);
        setError(null);
        startTransition(async () => {
            try {
                const res = await stytch.session.exchange({ organization_id: id, session_duration_minutes: SESSION_MINUTES });
                if (!res.member_authenticated) {
                    // The target org asks for extra verification the panel doesn't support yet.
                    router.replace("/login");
                    return;
                }
                router.push("/");
                router.refresh();
            } catch (err) {
                // This org doesn't accept how you signed in (e.g. another org's SSO): verify by email code.
                const type = (err as { error_type?: string } | null)?.error_type;
                if (type === "operation_restricted_by_organization_auth_methods" && target && member?.email_address) {
                    try {
                        await stytch.otps.email.discovery.send({ email_address: member.email_address });
                        setVerifying(target);
                        return;
                    } catch {
                        // fall through to the generic message
                    }
                }
                setError("Couldn't switch organisation. Try again.");
            }
        });
    }

    return (
        <>
        <VerifyOrgDialog target={verifying} email={member?.email_address ?? ""} onClose={() => setVerifying(null)} />
        <DropdownMenu onOpenChange={(open) => open && load()}>
            <DropdownMenuTrigger
                className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xs text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                disabled={pending}
            >
                <div className="min-w-0">{label}</div>
                <ChevronsUpDown className="size-4 shrink-0 text-sidebar-muted" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-none bg-card text-card-foreground">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Switch organisation</DropdownMenuLabel>
                {error && <p className="px-2 py-1.5 text-xs text-destructive-text">{error}</p>}
                {!orgs && !error && <p className="px-2 py-1.5 text-xs text-muted-foreground">Loading…</p>}
                {orgs?.map((o) => (
                    <DropdownMenuItem key={o.id} onSelect={() => switchTo(o.id)} className="justify-between">
                        <span className="truncate">{o.name}</span>
                        {o.id === session.organization_id && <Check className="size-4 text-primary" aria-label="Current" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
        </>
    );
}
