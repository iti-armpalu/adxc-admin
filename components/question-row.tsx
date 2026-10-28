// One question in a list: what was asked, its status, and where/who/when/how much.

import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatRelative, formatTokens } from "@/lib/adxc/format";
import type { OrgQueryListItem } from "@/lib/adxc/types";

export function questionHref(q: Pick<OrgQueryListItem, "realm_id" | "query_id">) {
    return `/questions/${encodeURIComponent(q.realm_id)}/${encodeURIComponent(q.query_id)}`;
}

export function QuestionRow({ q }: { q: OrgQueryListItem }) {
    return (
        <li>
            <Link href={questionHref(q)} className="block space-y-1.5 px-4 py-3 transition-colors hover:bg-accent">
                <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-sm text-foreground">{q.question}</p>
                    <StatusBadge outcome={q.outcome} paid={q.paid} />
                </div>
                <p className="text-xs text-muted-foreground">
                    {q.realm_name} · {q.asked_by} · {formatRelative(q.asked_at)}
                    {q.price ? ` · ${formatTokens(q.price)} credits` : ""}
                </p>
            </Link>
        </li>
    );
}
