// app/(app)/team/page.tsx — Team
//
// For the org admin: who can use ADXC on the account, who is still waiting to be let
// in, and the keys their tools use. Admins only.

import { SessionRefresh } from "@/components/auth/session-refresh";
import { ApiKeys } from "@/components/team/api-keys";
import { MembersPanel } from "@/components/team/members-panel";
import { AdxcApiError, isAuthError } from "@/lib/adxc/client";
import { loadTeam, type TeamData } from "@/lib/adxc/team";

export default async function TeamPage() {
    let data: TeamData;
    try {
        data = await loadTeam();
    } catch (err) {
        return <LoadError error={err} />;
    }
    const { mode, myEmail, members, notAdmitted, keys } = data;

    return (
        <div className="mx-auto max-w-5xl space-y-12 px-4 py-8 md:px-8">
            <header className="space-y-1">
                <h1>Team</h1>
                <p className="text-sm text-muted-foreground">Who can use ADXC on your account, and the keys your tools use.</p>
            </header>

            {mode === "sample" && (
                // TODO: wire up Stytch — this banner disappears once a person signs in as an admin.
                <p className="border border-warning/40 bg-card px-4 py-3 text-sm text-foreground-alt">
                    <span className="font-medium text-warning">Sample data.</span> You&apos;re signed in with a development API
                    key, which can&apos;t see team members or keys. Changes here are simulated.
                </p>
            )}

            <MembersPanel members={members} notAdmitted={notAdmitted} myEmail={myEmail} />

            <section className="space-y-3">
                <div className="space-y-0.5">
                    <h2 className="text-h4">API keys ({keys.length})</h2>
                    <p className="text-sm text-muted-foreground">
                        For tools and integrations that call ADXC on the account&apos;s behalf. A key can ask and buy, but
                        can&apos;t manage the team.
                    </p>
                </div>
                <ApiKeys keys={keys} />
            </section>
        </div>
    );
}

function LoadError({ error }: { error: unknown }) {
    // Stale 5-minute pass: refresh it and re-render instead of showing an error.
    if (isAuthError(error)) return <SessionRefresh />;
    const forbidden = error instanceof AdxcApiError && error.status === 403;
    return (
        <div className="mx-auto max-w-2xl space-y-2 px-4 py-8 md:px-8">
            <h1>Team</h1>
            <p className="text-sm text-muted-foreground">
                {forbidden ? "Only organisation admins can manage the team." : "Couldn't load the team. Try again."}
            </p>
        </div>
    );
}
