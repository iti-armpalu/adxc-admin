// app/(app)/realms/page.tsx — Realms (realms in the API)
//
// For the account owner organising work by client: what realms exist, how much has
// been asked in each, and how to point an agent at one. A bought answer is free to
// everyone asking in the same realm, and never visible from another.

import { SessionRefresh } from "@/components/auth/session-refresh";
import Link from "next/link";
import { CopyField } from "@/components/copy-field";
import { CreateRealmForm } from "@/components/realms/create-realm-form";
import { AdxcApiError, getCurrentOrg, listRealmQueries, listRealms, isAuthError } from "@/lib/adxc/client";
import { formatRelative } from "@/lib/adxc/format";
import { orgMcpUrl } from "@/lib/adxc/mcp";
import type { Realm } from "@/lib/adxc/types";

type RealmStats = { total: number; lastAskedAt: string | null } | null;

async function load() {
    const org = await getCurrentOrg();
    const { realms } = await listRealms(org.org_id);
    // One small call per realm for its count and latest question. Fine at today's scale.
    // TODO: ask Rob for question_count / last_asked_at on the realm list.
    const stats = await Promise.all(
        realms.map(async (r): Promise<RealmStats> => {
            try {
                const page = await listRealmQueries(org.org_id, r.realm_id, { limit: 1 });
                return { total: page.total, lastAskedAt: page.queries[0]?.asked_at ?? null };
            } catch {
                return null;
            }
        }),
    );
    const sorted = realms
        .map((realm, i) => ({ realm, stats: stats[i] }))
        .sort((a, b) => Number(b.realm.is_default) - Number(a.realm.is_default) || a.realm.name.localeCompare(b.realm.name));
    return { org, realms: sorted };
}

export default async function RealmsPage() {
    let data: Awaited<ReturnType<typeof load>>;
    try {
        data = await load();
    } catch (err) {
        return <LoadError error={err} />;
    }
    const { org, realms } = data;
    const defaultUrl = orgMcpUrl(org.slug);

    return (
        <div className="animate-[adxc-fade_400ms_ease-out_both] motion-reduce:animate-none mx-auto max-w-5xl space-y-12 px-4 py-8 md:px-8">
            <header className="space-y-1">
                <h1>Realms</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                    Keep work for each client apart. An answer bought in a realm is free to everyone asking in it, and
                    never visible from another realm.
                </p>
            </header>

            <section className="border bg-card p-5">
                <CreateRealmForm />
            </section>

            <section className="space-y-3">
                <h2 className="text-h4">All realms ({realms.length})</h2>
                <ul className="space-y-4">
                    {realms.map(({ realm, stats }) => (
                        <RealmCard key={realm.realm_id} realm={realm} stats={stats} defaultUrl={defaultUrl} />
                    ))}
                </ul>
            </section>
        </div>
    );
}

function RealmCard({ realm, stats, defaultUrl }: { realm: Realm; stats: RealmStats; defaultUrl: string | null }) {
    const href = `/questions?realm=${encodeURIComponent(realm.realm_id)}`;
    return (
        <li className="space-y-4 border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-foreground">{realm.name}</p>
                        {realm.is_default && (
                            <span className="inline-flex h-5 items-center rounded-xs border px-1.5 text-xs text-muted-foreground">
                                Default
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {stats === null
                            ? "Question count unavailable"
                            : stats.total === 0
                              ? "No questions yet"
                              : `${stats.total.toLocaleString("en-GB")} question${stats.total === 1 ? "" : "s"}${
                                    stats.lastAskedAt ? ` · last asked ${formatRelative(stats.lastAskedAt)}` : ""
                                }`}
                    </p>
                </div>
                {stats !== null && stats.total > 0 && (
                    <Link href={href} className="text-sm text-primary underline-offset-4 hover:underline">
                        View questions
                    </Link>
                )}
            </div>

            <div className="space-y-2">
                <p className="text-caption uppercase text-muted-foreground">Connect address</p>
                {realm.is_default && defaultUrl ? (
                    <CopyField value={defaultUrl} />
                ) : (
                    // TODO: wire up per-realm addresses — waiting on Rob to return `mcp_url` on realms.
                    <p className="border border-dashed px-3 py-2 text-sm text-muted-foreground">
                        {realm.is_default ? "Not available yet." : "Each realm will get its own address here soon."}
                    </p>
                )}
            </div>
        </li>
    );
}

function LoadError({ error }: { error: unknown }) {
    // Stale 5-minute pass: refresh it and re-render instead of showing an error.
    if (isAuthError(error)) return <SessionRefresh />;
    const message =
        error instanceof AdxcApiError
            ? `${error.status} — ${typeof error.detail === "string" ? error.detail : JSON.stringify(error.detail)}`
            : String(error);
    return (
        <div className="animate-[adxc-fade_400ms_ease-out_both] motion-reduce:animate-none mx-auto max-w-2xl space-y-2 px-4 py-8 md:px-8">
            <h1>Realms</h1>
            <p className="text-sm text-muted-foreground">Couldn&apos;t load realms: {message}</p>
        </div>
    );
}
