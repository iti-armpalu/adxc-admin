// lib/adxc/team.ts
//
// Team data for the signed-in org admin. With the dev API key (a service account),
// the members and keys routes answer 403 by design, so this returns sample data and
// says so — the page shows a banner. Once Stytch lands and a person signs in, it's live.

import { mockApiKeys, mockMembers, mockNotAdmitted } from "@/lib/mock-data";
import { getCurrentOrg, getMemberMe, listApiKeys, listMembers, listNotAdmitted } from "./client";
import type { ApiKeyRecord, OrgMember } from "./types";

export type TeamData = {
    mode: "live" | "sample";
    myEmail: string | null;
    members: OrgMember[];
    notAdmitted: string[];
    keys: ApiKeyRecord[];
};

/** True when the current credential is the dev API key, so writes should be simulated. */
export async function isSampleMode() {
    const org = await getCurrentOrg();
    const me = await getMemberMe(org.org_id);
    return me.kind === "org_automation";
}

export async function loadTeam(): Promise<TeamData> {
    const org = await getCurrentOrg();
    const me = await getMemberMe(org.org_id);

    if (me.kind === "org_automation") {
        return {
            mode: "sample",
            myEmail: null,
            members: mockMembers(org.org_id),
            notAdmitted: mockNotAdmitted(),
            keys: mockApiKeys(org.org_id),
        };
    }

    const [members, notAdmitted, keys] = await Promise.all([
        listMembers(org.org_id),
        listNotAdmitted(org.org_id),
        listApiKeys(org.org_id),
    ]);
    return {
        mode: "live",
        myEmail: me.email,
        members: members.members,
        notAdmitted: notAdmitted.emails,
        keys: keys.keys,
    };
}
