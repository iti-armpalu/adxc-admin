// app/(app)/questions/[realmId]/[queryId]/page.tsx — Question detail
//
// A read-only record of one question: where it got to, what it would cost, who could
// answer it and how well, and — if bought — the answer, its sources and files.
// Buying, cancelling and answering clarifications happen in the agent that asked.

import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { SupplierCard } from "@/components/question/supplier-card";
import { StatusBadge } from "@/components/status-badge";
import {
    AdxcApiError,
    getCurrentOrg,
    getQuery,
    getRealm,
    listArtifacts,
    listClarifications,
} from "@/lib/adxc/client";
import { formatDateTime, formatTokens } from "@/lib/adxc/format";
import { isRunning } from "@/lib/adxc/outcome";
import type { QueryResult } from "@/lib/adxc/types";

async function load(realmId: string, queryId: string) {
    const org = await getCurrentOrg();
    const query = await getQuery(org.org_id, realmId, queryId);
    // Secondary data: a failure here shouldn't take the page down.
    const [realm, clarifications, artifacts] = await Promise.allSettled([
        getRealm(org.org_id, realmId),
        listClarifications(org.org_id, realmId, queryId),
        listArtifacts(org.org_id, realmId, queryId),
    ]);
    return {
        query,
        realmName: realm.status === "fulfilled" ? realm.value.name : null,
        clarifications: clarifications.status === "fulfilled" ? clarifications.value : [],
        artifacts: artifacts.status === "fulfilled" ? artifacts.value : [],
    };
}

function explain(q: QueryResult) {
    if (q.answer) return "Bought. The full answer is below and is free to everyone in this project.";
    switch (q.outcome) {
        case "pending":
            return "Still being worked on. This page updates on its own.";
        case "needs_input":
            return "Paused until the person who asked answers a question about it in their agent.";
        case "quoted":
            return "An answer is ready. Only the person or agent who asked can buy it.";
        case "no_data":
            return "The data suppliers were asked and had nothing for this question. Nothing was charged.";
        case "abandoned":
            return "Cancelled, or left waiting for input too long. Nothing was charged.";
        case "error":
            return "The run failed. Nothing was charged.";
    }
}

export default async function QuestionDetailPage({
    params,
}: {
    params: Promise<{ realmId: string; queryId: string }>;
}) {
    const { realmId, queryId } = await params;

    let data: Awaited<ReturnType<typeof load>>;
    try {
        data = await load(realmId, queryId);
    } catch (err) {
        if (err instanceof AdxcApiError && err.status === 404) notFound();
        return <LoadError error={err} />;
    }
    const { query: q, realmName, clarifications, artifacts } = data;
    const paid = Boolean(q.answer);
    const suppliers = q.suppliers ?? [];
    const messages = q.messages ?? [];

    return (
        <div className="mx-auto max-w-5xl space-y-12 px-4 py-8 md:px-8">
            {isRunning(q.outcome) && <AutoRefresh />}

            <header className="space-y-4">
                <Link href="/questions" className="text-sm text-primary underline-offset-4 hover:underline">
                    ← Questions
                </Link>
                <h1>{q.question}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                    <StatusBadge outcome={q.outcome} paid={paid} />
                    {realmName && <span>Project: <span className="text-foreground">{realmName}</span></span>}
                    {q.price && (
                        <span>
                            {paid ? "Cost" : "Price"}: <span className="text-foreground">{formatTokens(q.price)} credits</span>
                        </span>
                    )}
                </div>
                <p className="text-sm text-foreground-alt">{explain(q)}</p>
                {q.message && <p className="border bg-card p-4 text-sm text-foreground-alt">{q.message}</p>}
            </header>

            {(q.answer || q.abstract) && (
                <section className="space-y-3">
                    <div>
                        <h2>{paid ? "Answer" : "Preview"}</h2>
                        {!paid && (
                            <p className="text-sm text-muted-foreground">
                                A shortened preview, free to read. The full answer unlocks when it&apos;s bought.
                            </p>
                        )}
                    </div>
                    <div className="border bg-card p-5 text-foreground whitespace-pre-line">{q.answer ?? q.abstract}</div>
                </section>
            )}

            {suppliers.length > 0 && (
                <section className="space-y-3">
                    <div>
                        <h2>Data suppliers</h2>
                        <p className="text-sm text-muted-foreground">Who was asked, and how much of the question each could cover.</p>
                    </div>
                    <ul className="space-y-4">
                        {suppliers.map((s) => (
                            <SupplierCard key={s.supplier_id} s={s} />
                        ))}
                    </ul>
                </section>
            )}

            {artifacts.length > 0 && (
                <section className="space-y-3">
                    <div>
                        <h2>Files</h2>
                        <p className="text-sm text-muted-foreground">
                            {paid ? "Data files that came with the answer." : "Included when the answer is bought."}
                        </p>
                    </div>
                    <ul className="divide-y border bg-card">
                        {artifacts.map((a) => (
                            <li key={a.href} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                                <div className="min-w-0">
                                    <p className="truncate text-foreground">{a.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {a.media_type} · {suppliers.find((s) => s.supplier_id === a.supplier_id)?.display_name ?? a.supplier_id}
                                    </p>
                                </div>
                                {/* TODO: wire up download — a Route Handler that streams `a.href` with the bearer token. */}
                                <span className="shrink-0 text-xs text-muted-foreground">{paid ? "Download soon" : "Locked"}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {clarifications.length > 0 && (
                <section className="space-y-3">
                    <div>
                        <h2>Clarifications</h2>
                        <p className="text-sm text-muted-foreground">What the run asked before answering, and what it was told.</p>
                    </div>
                    <ul className="space-y-4">
                        {clarifications.map((c) => (
                            <li key={c.clarification_id} className="space-y-2 border bg-card p-5 text-sm">
                                <p className="font-medium text-foreground">{c.clarification_text}</p>
                                <p className="text-muted-foreground">{c.context_text}</p>
                                {c.response ? (
                                    <p className="text-foreground-alt">
                                        Answered: <span className="text-foreground">{c.response}</span>
                                        {c.responded_at && <span className="text-muted-foreground"> · {formatDateTime(c.responded_at)}</span>}
                                    </p>
                                ) : (
                                    <p className="text-warning">
                                        Waiting for an answer. If none comes, it will assume: {c.suggestion}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {messages.length > 0 && (
                <section>
                    <details className="border bg-card" open={isRunning(q.outcome)}>
                        <summary className="cursor-pointer px-5 py-4">
                            <h2 className="inline">Activity</h2>
                            <span className="ml-2 text-sm text-muted-foreground">{messages.length} steps</span>
                        </summary>
                        <ol className="space-y-2 border-t px-5 py-4 text-sm">
                            {messages.map((m) => (
                                <li key={m.seq} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                                    {m.at && (
                                        <span className="shrink-0 tabular-nums text-muted-foreground sm:w-40">{formatDateTime(m.at)}</span>
                                    )}
                                    <span className="text-foreground-alt">{m.text}</span>
                                </li>
                            ))}
                        </ol>
                    </details>
                </section>
            )}
        </div>
    );
}

function LoadError({ error }: { error: unknown }) {
    const forbidden = error instanceof AdxcApiError && error.status === 403;
    const message =
        error instanceof AdxcApiError
            ? `${error.status} — ${typeof error.detail === "string" ? error.detail : JSON.stringify(error.detail)}`
            : String(error);
    return (
        <div className="mx-auto max-w-2xl space-y-3 px-4 py-8 md:px-8">
            <Link href="/questions" className="text-sm text-primary underline-offset-4 hover:underline">
                ← Questions
            </Link>
            <h1>Question</h1>
            <p className="text-sm text-muted-foreground">
                {forbidden
                    ? "This quote belongs to whoever asked it. Others can see it once it's bought."
                    : `Couldn't load this question: ${message}`}
            </p>
        </div>
    );
}
