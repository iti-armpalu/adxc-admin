// app/(app)/questions/[realmId]/[queryId]/page.tsx — Question detail
//
// A read-only record of one question. The answer (or its free preview) leads; the facts
// about it — status, project, cost, freshness, files — sit in a side column.
// Buying, cancelling and answering clarifications happen in the agent that asked.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Lock } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { CopyButton } from "@/components/copy-button";
import { MarkdownText } from "@/components/markdown-text";
import { SupplierList } from "@/components/question/supplier-card";
import { StatusBadge } from "@/components/status-badge";
import {
    AdxcApiError,
    getCurrentOrg,
    getQuery,
    getRealm,
    listArtifacts,
    listClarifications,
} from "@/lib/adxc/client";
import { formatDate, formatDateTime, formatTokens } from "@/lib/adxc/format";
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

/** One line on what the status means — only where the badge alone doesn't say enough. */
function explain(q: QueryResult, paid: boolean): string | null {
    if (paid) return null;
    switch (q.outcome) {
        case "pending":
            return "Still being worked on. This page updates on its own.";
        case "needs_input":
            return "Paused until whoever asked answers a question about it in their agent.";
        case "quoted":
            return "An answer is ready to buy. Only the person or agent who asked can buy it.";
        case "no_data":
            return "The data suppliers had nothing for this question. Nothing was charged.";
        case "abandoned":
            return "Cancelled, or left waiting for input too long. Nothing was charged.";
        case "error":
            return "The run failed. Nothing was charged.";
    }
}

function latest(dates: (string | null | undefined)[]) {
    const valid = dates.filter((d): d is string => Boolean(d)).sort();
    return valid.length ? valid[valid.length - 1] : null;
}

function SectionTitle({ title, note, action }: { title: string; note?: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-end justify-between gap-4">
            <div className="space-y-0.5">
                <h2 className="text-h4">{title}</h2>
                {note && <p className="text-sm text-muted-foreground">{note}</p>}
            </div>
            {action}
        </div>
    );
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
    const contributors = suppliers.filter((s) => s.status === "answered");
    const dataAsOf = latest(contributors.map((s) => s.as_of));
    const note = explain(q, paid);
    const supplierName = (id: string) => suppliers.find((s) => s.supplier_id === id)?.display_name ?? id;

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
            {isRunning(q.outcome) && <AutoRefresh />}

            <Link href="/questions" className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline">
                <ArrowLeft className="size-4" />
                Questions
            </Link>

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
                {/* Main column */}
                <div className="min-w-0 space-y-10">
                    <header className="space-y-4">
                        <div className="space-y-2 border-l-2 border-primary bg-card px-5 py-4 md:px-6 md:py-5">
                            <p className="text-caption uppercase text-muted-foreground">Question</p>
                            <h1 className="text-base leading-relaxed font-normal tracking-normal text-foreground">
                                {q.question}
                            </h1>
                        </div>
                        {/* On large screens these facts live in the side column. */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground lg:hidden">
                            <StatusBadge outcome={q.outcome} paid={paid} />
                            {realmName && <span>{realmName}</span>}
                            {q.price && <span>{formatTokens(q.price)} credits</span>}
                        </div>
                        {note && <p className="text-sm text-foreground-alt">{note}</p>}
                        {q.message && <p className="border bg-card p-4 text-sm text-foreground-alt">{q.message}</p>}
                    </header>

                    {(q.answer || q.abstract) && (
                        <section className="space-y-3">
                            <SectionTitle
                                title={paid ? "Answer" : "Preview"}
                                note={paid ? undefined : "A shortened preview, free to read. The full answer unlocks when it's bought."}
                            />
                            <div className="group relative border bg-card p-5 text-foreground-alt md:p-6">
                                {q.answer && (
                                    // Appears on hover/focus; always shown on touch screens, which can't hover.
                                    <CopyButton
                                        text={q.answer}
                                        label="Copy answer"
                                        className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                                    />
                                )}
                                <MarkdownText text={q.answer ?? q.abstract ?? ""} />
                            </div>
                        </section>
                    )}

                    {suppliers.length > 0 && (
                        <section className="space-y-3">
                            <SectionTitle title="Data suppliers" note="Who was asked, and how much of the question each could cover." />
                            <SupplierList suppliers={suppliers} />
                        </section>
                    )}

                    {clarifications.length > 0 && (
                        <section className="space-y-3">
                            <SectionTitle title="Clarifications" note="What the run asked before answering, and what it was told." />
                            <ul className="space-y-3">
                                {clarifications.map((c) => (
                                    <li key={c.clarification_id} className="space-y-2 border bg-card p-5 text-sm">
                                        <p className="font-medium text-foreground">{c.clarification_text}</p>
                                        <p className="text-muted-foreground">{c.context_text}</p>
                                        {c.response ? (
                                            <p className="text-foreground-alt">
                                                Answered: <span className="text-foreground">{c.response}</span>
                                                {c.responded_at && (
                                                    <span className="text-muted-foreground"> · {formatDateTime(c.responded_at)}</span>
                                                )}
                                            </p>
                                        ) : (
                                            <p className="text-warning">Waiting for an answer. If none comes, it will assume: {c.suggestion}</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {messages.length > 0 && (
                        <details className="border bg-card" open={isRunning(q.outcome)}>
                            <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm">
                                <span className="font-medium text-foreground">Activity log</span>
                                <span className="text-muted-foreground">{messages.length} steps</span>
                            </summary>
                            <ol className="space-y-2 border-t px-5 py-4 text-sm">
                                {messages.map((m) => (
                                    <li key={m.seq} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                                        {m.at && (
                                            <span className="shrink-0 tabular-nums text-muted-foreground sm:w-40">
                                                {formatDateTime(m.at)}
                                            </span>
                                        )}
                                        <span className="text-foreground-alt">{m.text}</span>
                                    </li>
                                ))}
                            </ol>
                        </details>
                    )}
                </div>

                {/* Side column */}
                <aside className="space-y-6 lg:sticky lg:top-8">
                    <dl className="divide-y border bg-card text-sm">
                        <Fact label="Status"><StatusBadge outcome={q.outcome} paid={paid} /></Fact>
                        {realmName && <Fact label="Project">{realmName}</Fact>}
                        {q.price && <Fact label={paid ? "Cost" : "Price"}>{formatTokens(q.price)} credits</Fact>}
                        {contributors.length > 0 && (
                            <Fact label="Answered by">{contributors.map((s) => s.display_name).join(", ")}</Fact>
                        )}
                        {dataAsOf && <Fact label="Data as of">{formatDate(dataAsOf)}</Fact>}
                    </dl>

                    {artifacts.length > 0 && (
                        <section className="space-y-2">
                            <p className="text-caption uppercase text-muted-foreground">Files</p>
                            <ul className="divide-y border bg-card text-sm">
                                {artifacts.map((a) => {
                                    const body = (
                                        <>
                                            <div className="min-w-0">
                                                <p className="truncate text-foreground">{a.name}</p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {a.media_type} · {supplierName(a.supplier_id)}
                                                </p>
                                            </div>
                                            {paid ? (
                                                <Download className="size-4 shrink-0 text-primary" aria-label="Download" />
                                            ) : (
                                                <Lock className="size-4 shrink-0 text-muted-foreground" aria-label="Unlocks when bought" />
                                            )}
                                        </>
                                    );
                                    return (
                                        <li key={a.href}>
                                            {paid ? (
                                                <a
                                                    href={`/api/artifact?href=${encodeURIComponent(a.href)}`}
                                                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent"
                                                >
                                                    {body}
                                                </a>
                                            ) : (
                                                <div className="flex items-center justify-between gap-3 px-4 py-3">{body}</div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                            {!paid && <p className="text-xs text-muted-foreground">Files unlock when the answer is bought.</p>}
                        </section>
                    )}
                </aside>
            </div>
        </div>
    );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 px-4 py-3">
            <dt className="shrink-0 text-muted-foreground">{label}</dt>
            <dd className="text-right text-foreground">{children}</dd>
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
            <Link href="/questions" className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline">
                <ArrowLeft className="size-4" />
                Questions
            </Link>
            <h1 className="text-h3">Question</h1>
            <p className="text-sm text-muted-foreground">
                {forbidden
                    ? "This quote belongs to whoever asked it. Others can see it once it's bought."
                    : `Couldn't load this question: ${message}`}
            </p>
        </div>
    );
}
