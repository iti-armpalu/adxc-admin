// lib/mock-data.ts
//
// Sample data for screens the dev API key can't reach (members and API keys are
// org_admin-only; a service account gets 403). Dates are relative to now so they
// never look stale. Shapes match lib/adxc/types exactly, so swapping to live data
// changes nothing in the UI.

import type { ApiKeyRecord, OrgMember } from "@/lib/adxc/types";

const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

export function mockMembers(orgId: string): OrgMember[] {
    void orgId;
    return [
        { member_id: 1, user_id: "u-1", email: "sarah.chen@northwind.example", role: "org_admin", created_at: ago(92), updated_at: ago(92) },
        { member_id: 2, user_id: "u-2", email: "james.okafor@northwind.example", role: "org_admin", created_at: ago(61), updated_at: ago(14) },
        { member_id: 3, user_id: "u-3", email: "priya.raman@northwind.example", role: "member", created_at: ago(30), updated_at: ago(30) },
        { member_id: 4, user_id: "u-4", email: "tom.becker@northwind.example", role: "member", created_at: ago(9), updated_at: ago(9) },
    ];
}

export const mockNotAdmitted = (): string[] => ["lena.morales@northwind.example"];

export function mockApiKeys(orgId: string): ApiKeyRecord[] {
    return [
        { id: 11, org_id: orgId, name: "miro-sidekick", key_prefix: "adxc_k_9QcR", created_at: ago(45), created_by: "sarah.chen@northwind.example", created_by_member_id: 1 },
        { id: 12, org_id: orgId, name: "nightly-reporting", key_prefix: "adxc_k_T4mz", created_at: ago(20), created_by: "james.okafor@northwind.example", created_by_member_id: 2 },
        { id: 13, org_id: orgId, name: "legacy-integration", key_prefix: "adxc_k_b81L", created_at: ago(140), created_by: null, created_by_member_id: null },
    ];
}
