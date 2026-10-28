// app/(app)/page.tsx
//
// TEMPORARY smoke test for the v3 client: proves the dev API key reaches real
// data (org, balance, projects, recent questions). Replaced by the Overview page.

import { AdxcApiError, getBalance, getCurrentOrg, listOrgQueries, listRealms } from "@/lib/adxc/client";
import { formatRelative, formatTokens } from "@/lib/adxc/format";
import { statusLabel } from "@/lib/adxc/outcome";

async function load() {
    const org = await getCurrentOrg();
    const [balance, realms, recent] = await Promise.all([
        getBalance(org.org_id),
        listRealms(org.org_id),
        listOrgQueries(org.org_id, { limit: 5 }),
    ]);
    return { org, balance, realms, recent };
}

export default async function Home() {
    let data: Awaited<ReturnType<typeof load>>;
    try {
        data = await load();
    } catch (err) {
        const message =
            err instanceof AdxcApiError
                ? `${err.status} — ${typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail)}`
                : String(err);
        return <ApiUnavailable message={message} />;
    }
    const { org, balance, realms, recent } = data;

    return (
        <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-8">
            <header className="space-y-1">
                <p className="text-sm text-muted-foreground">Connected to</p>
                <h1>{org.org_name}</h1>
            </header>

            <section className="border p-4">
                <p className="text-sm text-muted-foreground">Credits remaining</p>
                <p className="text-3xl font-bold">{formatTokens(balance.balance)}</p>
            </section>

            <section className="space-y-2">
                <h2>Projects ({realms.realms.length})</h2>
                <ul className="divide-y border">
                    {realms.realms.map((r) => (
                        <li key={r.realm_id} className="flex items-center justify-between px-4 py-2 text-sm">
                            <span>{r.name}</span>
                            {r.is_default && <span className="text-muted-foreground">Default</span>}
                        </li>
                    ))}
                </ul>
            </section>

            <section className="space-y-2">
                <h2>Recent questions ({recent.total})</h2>
                {recent.queries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No questions yet. Connect an agent to get started.</p>
                ) : (
                    <ul className="divide-y border">
                        {recent.queries.map((q) => (
                            <li key={q.query_id} className="space-y-1 px-4 py-3 text-sm">
                                <p className="text-foreground">{q.question}</p>
                                <p className="text-muted-foreground">
                                    {statusLabel(q)} · {q.realm_name} · {q.asked_by} · {formatRelative(q.asked_at)}
                                    {q.price ? ` · ${formatTokens(q.price)} credits` : ""}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

function ApiUnavailable({ message }: { message: string }) {
    return (
        <div className="mx-auto max-w-2xl space-y-2 px-4 py-8 md:px-8">
            <h1>Can&apos;t reach the ADXC API</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">
                For local development, set <code>ADXC_DEV_API_KEY</code> in <code>.env.local</code> to an org API
                key and restart <code>npm run dev</code>.
            </p>
        </div>
    );
}
