// lib/adxc/client.ts
//
// Server-side client for the ADXC v3 API. Import only from Server Components,
// Server Actions and Route Handlers — it reads secrets from the environment and
// must never ship to the browser.
//
// Auth: the signed-in person's Stytch session JWT, read fresh from the cookie the Stytch
// SDK writes on our domain (it refreshes every few minutes while a tab is open).
// Development fallback: an org API key in ADXC_DEV_API_KEY, used only when nobody is
// signed in, and never in production.

import { cookies } from "next/headers";
import { cache } from "react";
import { JWT_COOKIE } from "@/lib/auth/config";
import type {
    About,
    AddMemberRequest,
    ApiKeyList,
    ApiKeyRecord,
    AskerList,
    Clarification,
    CreatedApiKey,
    HistoricalSearch,
    MemberMe,
    NotAdmitted,
    OrgBalance,
    OrgMember,
    OrgMemberList,
    OrgQueryFilters,
    OrgQueryList,
    OrgSummary,
    OrgSummaryList,
    QueryArtifact,
    QueryResult,
    Realm,
    RealmList,
    RealmQueryList,
    Role,
    UserMe,
} from "./types";

const BASE = process.env.ADXC_API_URL ?? "https://api.adxc.ai";

export class AdxcApiError extends Error {
    constructor(
        public status: number,
        public path: string,
        public detail?: unknown,
    ) {
        super(`ADXC API ${status} on ${path}`);
        this.name = "AdxcApiError";
    }
}

async function bearerToken(): Promise<string> {
    const jwt = (await cookies()).get(JWT_COOKIE)?.value;
    if (jwt) return jwt;

    const devKey = process.env.ADXC_DEV_API_KEY;
    if (devKey && process.env.NODE_ENV !== "production") return devKey;

    throw new AdxcApiError(401, "(auth)", "Not signed in.");
}

/** The request had no valid credential: not signed in, or the 5-minute pass went stale. */
export const isAuthError = (err: unknown) => err instanceof AdxcApiError && err.status === 401;

type Query = Record<string, string | number | undefined | null>;

function withQuery(path: string, query?: Query) {
    if (!query) return path;
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    const s = qs.toString();
    return s ? `${path}?${s}` : path;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${await bearerToken()}`,
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: "no-store",
    });
    if (!res.ok) {
        let detail: unknown;
        try {
            detail = await res.json();
        } catch {
            detail = await res.text().catch(() => undefined);
        }
        throw new AdxcApiError(res.status, path, detail);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

const get = <T>(path: string, query?: Query) => request<T>("GET", withQuery(path, query));
const post = <T>(path: string, body?: unknown) => request<T>("POST", path, body);
const del = (path: string) => request<void>("DELETE", path);

const org = (orgId: string) => `/v3/org/${encodeURIComponent(orgId)}`;
const realm = (orgId: string, realmId: string) => `${org(orgId)}/realm/${encodeURIComponent(realmId)}`;
const query = (orgId: string, realmId: string, queryId: string) =>
    `${realm(orgId, realmId)}/query/${encodeURIComponent(queryId)}`;

// ── Who and where ──────────────────────────────────────────────────────────

export const listOrgs = () => get<OrgSummaryList>("/v3/orgs");

/**
 * The org this session acts in. A credential reaches exactly one org, so this is
 * the first (normally only) row. Cached per request.
 */
export const getCurrentOrg = cache(async (): Promise<OrgSummary> => {
    const { orgs } = await listOrgs();
    if (!orgs.length) throw new AdxcApiError(403, "/v3/orgs", "This credential is not a member of any organisation.");
    return orgs[0];
});

/** People only — a service account gets an error here. */
export const getUserMe = () => get<UserMe>("/v3/users/me");
export const getMemberMe = cache((orgId: string) => get<MemberMe>(`${org(orgId)}/members/me`));
export const getBalance = (orgId: string) => get<OrgBalance>(`${org(orgId)}/balance`);
export const getAbout = (orgId: string) => get<About>(`${org(orgId)}/about`);

// ── Members (org_admin only) ───────────────────────────────────────────────

export const listMembers = (orgId: string) => get<OrgMemberList>(`${org(orgId)}/members`);
export const listNotAdmitted = (orgId: string) => get<NotAdmitted>(`${org(orgId)}/members/not-admitted`);
export const addMember = (orgId: string, body: AddMemberRequest) => post<OrgMember>(`${org(orgId)}/members`, body);
export const setMemberRole = (orgId: string, memberId: number, role: Role) =>
    post<OrgMember>(`${org(orgId)}/members/${memberId}/set_role`, { role });
export const removeMember = (orgId: string, memberId: number) => del(`${org(orgId)}/members/${memberId}`);

// ── API keys (org_admin only) ──────────────────────────────────────────────

export const listApiKeys = (orgId: string) => get<ApiKeyList>(`${org(orgId)}/api-keys`);
export const getApiKey = (orgId: string, keyId: number) => get<ApiKeyRecord>(`${org(orgId)}/api-keys/${keyId}`);
/** The response carries `raw_token` once and never again. */
export const createApiKey = (orgId: string, name: string) => post<CreatedApiKey>(`${org(orgId)}/api-keys`, { name });
export const revokeApiKey = (orgId: string, keyId: number) => del(`${org(orgId)}/api-keys/${keyId}`);

// ── Realms ─────────────────────────────────────────────────────────────────

export const listRealms = (orgId: string) => get<RealmList>(`${org(orgId)}/realms`);
export const getRealm = (orgId: string, realmId: string) => get<Realm>(realm(orgId, realmId));
/** 409 if the name is already taken in this org. */
export const createRealm = (orgId: string, name: string) => post<Realm>(`${org(orgId)}/realms`, { name });

// ── History ────────────────────────────────────────────────────────────────

export const listOrgQueries = (orgId: string, filters: OrgQueryFilters = {}) =>
    get<OrgQueryList>(`${org(orgId)}/queries`, filters);
export const listAskers = (orgId: string) => get<AskerList>(`${org(orgId)}/queries/askers`);
export const listRealmQueries = (orgId: string, realmId: string, page: { limit?: number; offset?: number } = {}) =>
    get<RealmQueryList>(`${realm(orgId, realmId)}/queries`, page);
export const searchQuestions = (
    orgId: string,
    realmId: string,
    q: string,
    opts: { limit?: number; min_similarity?: number } = {},
) => get<HistoricalSearch>(`${realm(orgId, realmId)}/questions/search`, { q, ...opts });

// ── One query (read-only — the panel never asks, approves or cancels) ──────

export const getQuery = (orgId: string, realmId: string, queryId: string, since = 0) =>
    get<QueryResult>(query(orgId, realmId, queryId), { since });
/** Full record: open and answered clarifications. */
export const listClarifications = (orgId: string, realmId: string, queryId: string) =>
    get<Clarification[]>(`${query(orgId, realmId, queryId)}/clarifications`);
/** Listing is free; the bytes behind each href need the answer to be paid. */
export const listArtifacts = (orgId: string, realmId: string, queryId: string) =>
    get<QueryArtifact[]>(`${query(orgId, realmId, queryId)}/artifacts`);

/**
 * Fetch one artifact's bytes. `href` must be the exact path the artifacts listing gave
 * (the extension is part of the file's identity). 403 until the answer is paid for.
 * Used by /api/artifact, which streams it to the browser — the browser never holds the token.
 */
export async function fetchArtifact(href: string): Promise<Response> {
    const res = await fetch(`${BASE}${href}`, {
        headers: { Authorization: `Bearer ${await bearerToken()}` },
        cache: "no-store",
    });
    if (!res.ok) throw new AdxcApiError(res.status, href);
    return res;
}
