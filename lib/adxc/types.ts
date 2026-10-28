// lib/adxc/types.ts
//
// Response and request shapes for the ADXC v3 API, as the panel uses them.
// Source of truth: https://api.adxc.ai/docs/api-spec (generated from the service).
// Snapshot this file was written against: openapi.json "0.2.0", 2026-10-28.
// When Rob changes the spec, update the shapes here — field names mirror the API exactly.

export type Role = "member" | "org_admin";
export type AskerKind = "member" | "org_automation";

/** Where a hypermedia link points. Every v3 resource carries `links`. */
export type Link = { href: string; method: string; rel?: string | null };
export type Links = Record<string, Link> | null;

// ── Organisations ──────────────────────────────────────────────────────────

/** GET /v3/orgs — a person's token names exactly one org, so this is usually one row. */
export type OrgSummary = { org_id: string; org_name: string; slug?: string | null };
export type OrgSummaryList = { orgs: OrgSummary[] };

/** GET /v3/users/me — people only. */
export type UserMe = { email: string };

/** GET /v3/org/{org_id}/members/me — one of two shapes depending on the credential. */
export type MemberMePerson = {
    kind: "member";
    org_id: string;
    member_id: number | null;
    role: Role;
    user_id: string;
    email: string;
};
export type MemberMeServiceAccount = {
    kind: "org_automation";
    org_id: string;
    api_key_id: number;
    name: string;
    key_prefix: string;
};
export type MemberMe = MemberMePerson | MemberMeServiceAccount;

/** GET /v3/org/{org_id}/balance — decimal string in ADXC tokens. */
export type OrgBalance = { org_id: string; balance: string; currency: string };

// ── Members (org_admin only; API keys get 403) ─────────────────────────────

export type OrgMember = {
    member_id: number;
    user_id: string;
    email: string;
    role: Role;
    created_at: string;
    updated_at: string;
};
export type OrgMemberList = { members: OrgMember[] };
export type AddMemberRequest = { email: string; role?: Role };
export type SetRoleRequest = { role: Role };
/** GET /v3/org/{org_id}/members/not-admitted — invited, but not yet admitted to the closed beta. */
export type NotAdmitted = { emails: string[] };

// ── API keys (org_admin only) ──────────────────────────────────────────────

export type ApiKeyRecord = {
    id: number;
    org_id: string;
    name: string;
    key_prefix: string;
    created_at: string;
    deleted_at?: string | null;
    created_by_member_id?: number | null;
    /** Issuer's email, or "vetinari" for ADXC break-glass. Null = issued before 14 Oct 2026, not recorded. */
    created_by?: string | null;
};
export type ApiKeyList = { keys: ApiKeyRecord[] };
/** POST /v3/org/{org_id}/api-keys — the only response that ever carries the raw token. */
export type CreatedApiKey = ApiKeyRecord & { raw_token: string };

// ── Realms (shown to clients as "Projects") ────────────────────────────────

export type Realm = {
    realm_id: string;
    org_id: string;
    name: string;
    is_default: boolean;
    links?: Links;
};
export type RealmList = { realms: Realm[]; links?: Links };

// ── Queries ────────────────────────────────────────────────────────────────

/**
 * The whole state machine. `pending` and `needs_input` are still running;
 * the rest are resting states. Only `quoted` can be bought.
 */
export type Outcome = "pending" | "needs_input" | "quoted" | "no_data" | "abandoned" | "error";

/** Row in GET /v3/org/{org_id}/realm/{realm_id}/queries */
export type RealmQueryListItem = {
    query_id: string;
    question: string;
    outcome: Outcome;
    abstract?: string | null;
    price?: string | null;
    paid: boolean;
    asked_at: string;
    links?: Links;
};
export type RealmQueryList = {
    queries: RealmQueryListItem[];
    total: number;
    limit: number;
    offset: number;
    links?: Links;
};

/** Row in GET /v3/org/{org_id}/queries — adds where and by whom. */
export type OrgQueryListItem = RealmQueryListItem & {
    realm_id: string;
    realm_name: string;
    /** Member's email, or the API key's name. */
    asked_by: string;
    asked_by_kind: AskerKind;
};
export type OrgQueryList = { queries: OrgQueryListItem[]; total: number; limit: number; offset: number };

export type OrgQueryFilters = {
    limit?: number;
    offset?: number;
    /** Only one of member_id / api_key_id — the API answers 400 for both. */
    member_id?: number;
    api_key_id?: number;
    realm_id?: string;
};

/** GET /v3/org/{org_id}/queries/askers — exactly one id is set per row. */
export type Asker = { kind: AskerKind; member_id: number | null; api_key_id: number | null; name: string };
export type AskerList = { askers: Asker[] };

export type CoverageStatus = "full" | "partial" | "none";
/** `render` is prose to display, never to parse. Branch on `status`. */
export type CoverageRow = { render: string; status: CoverageStatus; [k: string]: unknown };
/** `render` is prose; `data` is supplier-specific and read by supplier_id. */
export type QueryPlanRow = { render: string; data?: Record<string, unknown>; [k: string]: unknown };

export type ArtifactLink = { name: string; media_type: string; href: string };
export type QueryArtifact = ArtifactLink & { supplier_id: string };

export type SupplierBlock = {
    supplier_id: string;
    display_name: string;
    status: "answered" | "no_data";
    no_data_reason?: string | null;
    as_of?: string | null;
    coverage?: CoverageRow[];
    coverage_status?: CoverageStatus | null;
    query_plan?: QueryPlanRow[];
    /** Assumptions made about the wording, e.g. "Read 'last week' as the past 7 days". */
    clarifications?: string[];
    artifacts?: ArtifactLink[];
    /** Null until the answer is paid for. */
    provenance?: string[] | null;
};

export type ProgressMessage = { seq: number; text: string; at?: string; [k: string]: unknown };

export type Clarification = {
    clarification_id: string;
    clarification_text: string;
    context_text: string;
    options?: string[];
    suggestion: string;
    raised_at: string;
    response?: string | null;
    responded_at?: string | null;
    links?: Links;
};

/** GET /v3/org/{org_id}/realm/{realm_id}/query/{query_id} */
export type QueryResult = {
    query_id: string;
    question: string;
    outcome: Outcome;
    /** Why there is no answer, for no_data / error. */
    message?: string | null;
    abstract?: string | null;
    price?: string | null;
    suppliers?: SupplierBlock[];
    messages?: ProgressMessage[];
    cursor?: number;
    /** Null until approved and paid. */
    answer?: string | null;
    /** Open clarifications only — non-empty exactly when outcome is needs_input. */
    clarifications?: Clarification[];
    links?: Links;
};

// ── History search & supplier info ─────────────────────────────────────────

export type HistoricalMatch = {
    /** This IS a query_id. */
    answer_uuid: string;
    question: string;
    similarity: number;
    asked_at: string;
    abstract?: string | null;
    links?: Links;
};
export type HistoricalSearch = { query: string; matches: HistoricalMatch[]; links?: Links };

/** GET /v3/org/{org_id}/about — markdown, what each supplier holds. */
export type About = { description: string };
