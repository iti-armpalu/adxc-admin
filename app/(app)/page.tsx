// app/(app)/page.tsx — Overview
//
// For the client's account owner landing in the panel: how much is left, how do we
// connect an agent, and what has been asked lately.

import { SessionRefresh } from "@/components/auth/session-refresh";
import Link from "next/link";
import { CopyField } from "@/components/copy-field";
import { QuestionRow } from "@/components/question-row";
import { AdxcApiError, getBalance, getCurrentOrg, listOrgQueries, listRealms, isAuthError } from "@/lib/adxc/client";
import { formatTokens } from "@/lib/adxc/format";
import { orgMcpUrl } from "@/lib/adxc/mcp";

const RECENT_COUNT = 5;


async function load() {
    const org = await getCurrentOrg();
    const [balance, realms, history] = await Promise.all([
        getBalance(org.org_id),
        listRealms(org.org_id),
        listOrgQueries(org.org_id, { limit: RECENT_COUNT }),
    ]);
    return { org, balance, realms: realms.realms, history };
}

export default async function OverviewPage() {
    let data: Awaited<ReturnType<typeof load>>;
    try {
        data = await load();
    } catch (err) {
        return <ApiUnavailable error={err} />;
    }
    const { org, balance, realms, history } = data;

    const recent = history.queries.slice(0, RECENT_COUNT);
    const mcpUrl = orgMcpUrl(org.slug);
    const defaultRealm = realms.find((r) => r.is_default);

    return (
        <div className="animate-[adxc-fade_400ms_ease-out_both] motion-reduce:animate-none mx-auto max-w-5xl space-y-12 px-4 py-8 md:px-8">
            <header className="space-y-1">
                <h1>Overview</h1>
                <p className="text-sm text-muted-foreground">Your account at a glance.</p>
            </header>

            <section className="grid gap-4 sm:grid-cols-3" aria-label="Summary">
                <Stat label="Credits" value={formatTokens(balance.balance)} note="Charged only when an answer is bought." />
                <Stat label="Questions asked" value={history.total.toLocaleString("en-GB")} />
                <Stat label="Realms" value={realms.length.toLocaleString("en-GB")} />
            </section>

            <section className="space-y-3">
                <div className="space-y-1">
                    <h2>Connect an agent</h2>
                    <p className="text-sm text-muted-foreground">
                        Paste this address into your agent&apos;s MCP or connector settings. Only members of{" "}
                        <span className="font-semibold text-foreground">{org.org_name}</span>{" "}
                        can use it.
                    </p>
                </div>
                <div className="space-y-3 border bg-card p-4">
                    {mcpUrl ? (
                        <CopyField value={mcpUrl} />
                    ) : (
                        // TODO: wire up — org has no slug, so the address can't be built. Ask Rob.
                        <p className="text-sm text-muted-foreground">Your connect address isn&apos;t available yet.</p>
                    )}
                    <p className="text-sm text-foreground-alt">
                        Questions asked here go to {defaultRealm ? <span className="font-semibold text-foreground">{defaultRealm.name}</span> : "your default realm"}.
                        To keep work for different clients apart, give each one its own realm and address on{" "}
                        <Link href="/realms" className="text-primary underline-offset-4 hover:underline">
                            Realms
                        </Link>
                        .
                    </p>
                </div>
            </section>

            <section className="space-y-3">
                <div className="flex items-end justify-between gap-4">
                    <h2>Recent questions</h2>
                    {history.total > 0 && (
                        <Link href="/questions" className="text-sm text-primary underline-offset-4 hover:underline">
                            View all
                        </Link>
                    )}
                </div>
                {recent.length === 0 ? (
                    <p className="border bg-card px-4 py-6 text-sm text-muted-foreground">
                        No questions yet. Once an agent is connected, everything it asks shows up here.
                    </p>
                ) : (
                    <ul className="divide-y border bg-card">
                        {recent.map((q) => (
                            <QuestionRow key={q.query_id} q={q} />
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
    return (
        <div className="space-y-1 border bg-card p-5">
            <p className="text-caption uppercase text-muted-foreground">{label}</p>
            <p className="text-3xl font-medium text-foreground">{value}</p>
            {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
    );
}

function ApiUnavailable({ error }: { error: unknown }) {
    // Stale 5-minute pass: refresh it and re-render instead of showing an error.
    if (isAuthError(error)) return <SessionRefresh />;
    const message =
        error instanceof AdxcApiError
            ? `${error.status} — ${typeof error.detail === "string" ? error.detail : JSON.stringify(error.detail)}`
            : String(error);
    return (
        <div className="animate-[adxc-fade_400ms_ease-out_both] motion-reduce:animate-none mx-auto max-w-2xl space-y-2 px-4 py-8 md:px-8">
            <h1>Can&apos;t reach the ADXC API</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">
                For local development, set <code>ADXC_DEV_API_KEY</code> in <code>.env.local</code> and restart{" "}
                <code>npm run dev</code>.
            </p>
        </div>
    );
}
