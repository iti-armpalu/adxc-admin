// app/(app)/questions/page.tsx — Questions
//
// For the account owner checking what has been asked on their account: by which person
// or agent, for which client, what it cost, and where it ended up. Read-only.

import { SessionRefresh } from "@/components/auth/session-refresh";
import Link from "next/link";
import { QuestionFiltersBar } from "@/components/questions/question-filters";
import { QuestionRow, questionHref } from "@/components/question-row";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdxcApiError, getCurrentOrg, listAskers, listOrgQueries, listRealms, isAuthError } from "@/lib/adxc/client";
import { formatRelative, formatTokens } from "@/lib/adxc/format";
import { parseFilters, rowStatus, toApiFilters, toSearch, type QuestionFilters } from "@/lib/adxc/question-filters";

async function load(filters: QuestionFilters) {
    const org = await getCurrentOrg();
    const [history, realms, askers] = await Promise.all([
        listOrgQueries(org.org_id, toApiFilters(filters)),
        listRealms(org.org_id),
        listAskers(org.org_id),
    ]);
    return { history, realms: realms.realms, askers: askers.askers };
}

export default async function QuestionsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const filters = parseFilters(await searchParams);

    let data: Awaited<ReturnType<typeof load>>;
    try {
        data = await load(filters);
    } catch (err) {
        return <LoadError error={err} />;
    }
    const { history, realms, askers } = data;

    const rows = filters.status.length
        ? history.queries.filter((q) => filters.status.includes(rowStatus(q)))
        : history.queries;

    const projectOptions = realms.map((r) => ({ value: r.realm_id, label: r.name }));
    const askerOptions = askers.map((a) => ({
        value: a.member_id !== null ? `m:${a.member_id}` : `k:${a.api_key_id}`,
        label: a.kind === "org_automation" ? `${a.name} (API key)` : a.name,
    }));

    const first = history.total === 0 ? 0 : history.offset + 1;
    const last = history.offset + history.queries.length;
    const hasPrev = filters.page > 1;
    const hasNext = last < history.total;
    const anyFilter = Boolean(filters.project || filters.asker || filters.status.length);

    return (
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
            <header className="space-y-1">
                <h1>Questions</h1>
                <p className="text-sm text-muted-foreground">Everything asked on your account, by people and agents.</p>
            </header>

            <QuestionFiltersBar filters={filters} projects={projectOptions} askers={askerOptions} />

            {rows.length === 0 ? (
                <div className="border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
                    {anyFilter
                        ? "No questions match these filters."
                        : "No questions yet. Once an agent is connected, everything it asks shows up here."}
                </div>
            ) : (
                <>
                    {/* Mobile: cards */}
                    <ul className="divide-y border bg-card md:hidden">
                        {rows.map((q) => (
                            <QuestionRow key={q.query_id} q={q} />
                        ))}
                    </ul>

                    {/* md+: table */}
                    <div className="hidden border bg-card md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Question</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Asked by</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Asked</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((q) => (
                                    <TableRow key={q.query_id} className="relative">
                                        <TableCell className="max-w-0 whitespace-normal">
                                            {/* The link's ::after covers the row, so the whole row is clickable. */}
                                            <Link
                                                href={questionHref(q)}
                                                className="line-clamp-2 text-foreground after:absolute after:inset-0 hover:text-primary"
                                            >
                                                {q.question}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge outcome={q.outcome} paid={q.paid} />
                                        </TableCell>
                                        <TableCell className="text-foreground-alt">{q.realm_name}</TableCell>
                                        <TableCell className="max-w-48 truncate text-foreground-alt">{q.asked_by}</TableCell>
                                        <TableCell className="text-right tabular-nums text-foreground-alt">
                                            {q.price ? formatTokens(q.price) : "—"}
                                        </TableCell>
                                        <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                                            {formatRelative(q.asked_at)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}

            {history.total > 0 && (
                <nav className="flex items-center justify-between gap-4 text-sm" aria-label="Pagination">
                    <p className="text-muted-foreground">
                        {first}–{last} of {history.total.toLocaleString("en-GB")}
                        {filters.status.length > 0 && ` · status filter shows ${rows.length} on this page`}
                    </p>
                    <div className="flex gap-2">
                        <PageLink disabled={!hasPrev} href={`/questions${toSearch({ ...filters, page: filters.page - 1 })}`}>
                            Previous
                        </PageLink>
                        <PageLink disabled={!hasNext} href={`/questions${toSearch({ ...filters, page: filters.page + 1 })}`}>
                            Next
                        </PageLink>
                    </div>
                </nav>
            )}
        </div>
    );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
    const base = "inline-flex h-8 items-center rounded-xs border bg-card px-3";
    return disabled ? (
        <span className={`${base} text-muted-foreground opacity-50`} aria-disabled="true">
            {children}
        </span>
    ) : (
        <Link href={href} className={`${base} text-foreground hover:bg-accent`}>
            {children}
        </Link>
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
        <div className="mx-auto max-w-2xl space-y-2 px-4 py-8 md:px-8">
            <h1>Questions</h1>
            <p className="text-sm text-muted-foreground">Couldn&apos;t load questions: {message}</p>
        </div>
    );
}
