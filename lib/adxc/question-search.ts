// lib/adxc/question-search.ts
//
// Finds the page of questions to show. Without a keyword or status filter it's one API
// call, paged by the API. With either, the API can't filter, so we fetch the newest
// SCAN_CAP questions (honouring project/asker), filter them here and page the matches.
// When Rob adds `q` / `outcome` params, swap the scan for a direct call — callers don't change.

import { listOrgQueries } from "./client";
import { PAGE_SIZE, rowStatus, toApiFilters, type QuestionFilters } from "./question-filters";
import type { OrgQueryListItem } from "./types";

export const SCAN_CAP = 500;
const BATCH = 100; // API page maximum

export type QuestionPage = {
    rows: OrgQueryListItem[];
    total: number;
    offset: number;
    /** True when the result came from scanning recent questions rather than the API. */
    scanned: boolean;
    /** True when there were more questions than the scan covered. */
    truncated: boolean;
};

export async function findQuestions(orgId: string, filters: QuestionFilters): Promise<QuestionPage> {
    const api = toApiFilters(filters);

    if (!filters.q && filters.status.length === 0) {
        const page = await listOrgQueries(orgId, api);
        return { rows: page.queries, total: page.total, offset: page.offset, scanned: false, truncated: false };
    }

    // First batch tells us how many exist; fetch the rest (up to the cap) in parallel.
    const first = await listOrgQueries(orgId, { ...api, limit: BATCH, offset: 0 });
    const upTo = Math.min(first.total, SCAN_CAP);
    const offsets: number[] = [];
    for (let o = BATCH; o < upTo; o += BATCH) offsets.push(o);
    const rest = await Promise.all(offsets.map((offset) => listOrgQueries(orgId, { ...api, limit: BATCH, offset })));
    const all = [first, ...rest].flatMap((p) => p.queries);

    const needle = filters.q?.toLowerCase();
    const matches = all.filter(
        (q) =>
            (filters.status.length === 0 || filters.status.includes(rowStatus(q))) &&
            (!needle || q.question.toLowerCase().includes(needle)),
    );

    const offset = (filters.page - 1) * PAGE_SIZE;
    return {
        rows: matches.slice(offset, offset + PAGE_SIZE),
        total: matches.length,
        offset,
        scanned: true,
        truncated: first.total > all.length,
    };
}
