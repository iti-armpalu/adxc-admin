// lib/adxc/question-filters.ts
//
// Questions page filters live in the URL so a filtered view can be shared or bookmarked:
//   ?q=coffee&realm=<realm_id>&asker=m:42|k:17&status=quoted,bought&page=2
// Realm and asker are API params. Keyword and status have no API filter yet, so the
// server scans recent questions instead (see question-search.ts).
// TODO: ask Rob for `?q=` and `?outcome=` on the queries list.

import type { OrgQueryFilters, OrgQueryListItem } from "./types";

export const PAGE_SIZE = 25;

export const STATUS_OPTIONS = [
    { value: "needs_input", label: "Waiting for input" },
    { value: "quoted", label: "Ready to buy" },
    { value: "bought", label: "Bought" },
    { value: "pending", label: "In progress" },
    { value: "no_data", label: "No data found" },
    { value: "abandoned", label: "Cancelled" },
    { value: "error", label: "Failed" },
] as const;
export type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"];

export type QuestionFilters = {
    /** Keyword, matched case-insensitively against the question text. */
    q: string | null;
    realm: string | null;
    asker: string | null;
    status: StatusFilter[];
    page: number;
};

type RawParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || null;

export function parseFilters(params: RawParams): QuestionFilters {
    const valid = new Set<string>(STATUS_OPTIONS.map((o) => o.value));
    const status = (one(params.status) ?? "")
        .split(",")
        .filter((s): s is StatusFilter => valid.has(s));
    const page = Math.max(1, Number.parseInt(one(params.page) ?? "1", 10) || 1);
    const asker = one(params.asker);
    const q = (one(params.q) ?? "").trim().slice(0, 100);
    return {
        q: q || null,
        realm: one(params.realm),
        asker: asker && /^[mk]:\d+$/.test(asker) ? asker : null,
        status,
        page,
    };
}

export function toApiFilters(f: QuestionFilters): OrgQueryFilters {
    const [kind, id] = f.asker?.split(":") ?? [];
    return {
        limit: PAGE_SIZE,
        offset: (f.page - 1) * PAGE_SIZE,
        realm_id: f.realm ?? undefined,
        member_id: kind === "m" ? Number(id) : undefined,
        api_key_id: kind === "k" ? Number(id) : undefined,
    };
}

/** A row's status in filter terms: a bought quote is "bought", not "quoted". */
export const rowStatus = (q: Pick<OrgQueryListItem, "outcome" | "paid">): StatusFilter =>
    q.paid ? "bought" : q.outcome;

export function toSearch(f: Partial<QuestionFilters>) {
    const qs = new URLSearchParams();
    if (f.q) qs.set("q", f.q);
    if (f.realm) qs.set("realm", f.realm);
    if (f.asker) qs.set("asker", f.asker);
    if (f.status?.length) qs.set("status", f.status.join(","));
    if (f.page && f.page > 1) qs.set("page", String(f.page));
    const s = qs.toString();
    return s ? `?${s}` : "";
}
