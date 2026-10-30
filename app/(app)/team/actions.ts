"use server";

// Team writes. In sample mode (dev API key) they're simulated so the UI can be
// exercised end to end — nothing reaches the API and the lists don't change.

import { revalidatePath } from "next/cache";
import {
    AdxcApiError,
    addMember,
    createApiKey,
    getCurrentOrg,
    removeMember,
    revokeApiKey,
    setMemberRole,
} from "@/lib/adxc/client";
import { isSampleMode } from "@/lib/adxc/team";
import type { Role } from "@/lib/adxc/types";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
export type InviteState = { error: string | null; invited: string | null };
export type CreateKeyState = { error: string | null; token: string | null; name: string | null };

const SAMPLE_NOTE = "(sample data — nothing was changed)";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendly(err: unknown, fallback: string) {
    if (err instanceof AdxcApiError && err.status === 403) return "Only organisation admins can do this.";
    return fallback;
}

export async function inviteMember(_prev: InviteState, formData: FormData): Promise<InviteState> {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const role = (formData.get("role") === "org_admin" ? "org_admin" : "member") as Role;
    if (!EMAIL.test(email)) return { error: "Enter a valid email address.", invited: null };

    if (await isSampleMode()) return { error: null, invited: `${email} ${SAMPLE_NOTE}` };

    try {
        const org = await getCurrentOrg();
        await addMember(org.org_id, { email, role });
        revalidatePath("/team");
        return { error: null, invited: email };
    } catch (err) {
        if (err instanceof AdxcApiError && err.status === 409) return { error: `${email} is already a member.`, invited: null };
        return { error: friendly(err, "Couldn't send the invite. Try again."), invited: null };
    }
}

export async function changeRole(memberId: number, role: Role): Promise<ActionResult> {
    if (await isSampleMode()) return { ok: true, message: `Role changed ${SAMPLE_NOTE}` };
    try {
        const org = await getCurrentOrg();
        await setMemberRole(org.org_id, memberId, role);
        revalidatePath("/team");
        revalidatePath("/team/[memberId]", "page");
        return { ok: true };
    } catch (err) {
        return { ok: false, error: friendly(err, "Couldn't change the role. Try again.") };
    }
}

export async function removeMemberAction(memberId: number): Promise<ActionResult> {
    if (await isSampleMode()) return { ok: true, message: `Removed ${SAMPLE_NOTE}` };
    try {
        const org = await getCurrentOrg();
        await removeMember(org.org_id, memberId);
        revalidatePath("/team");
        return { ok: true };
    } catch (err) {
        return { ok: false, error: friendly(err, "Couldn't remove this person. Try again.") };
    }
}

export async function createKey(_prev: CreateKeyState, formData: FormData): Promise<CreateKeyState> {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { error: "Give the key a name, e.g. the tool that will use it.", token: null, name: null };
    if (name.length > 128) return { error: "Keep the name under 128 characters.", token: null, name: null };

    if (await isSampleMode()) {
        const fake = `adxc_k_SAMPLE${Math.random().toString(36).slice(2, 12)}ONLY`;
        return { error: null, token: fake, name };
    }

    try {
        const org = await getCurrentOrg();
        const key = await createApiKey(org.org_id, name);
        revalidatePath("/team");
        return { error: null, token: key.raw_token, name: key.name };
    } catch (err) {
        if (err instanceof AdxcApiError && err.status === 409)
            return { error: `A key called "${name}" already exists.`, token: null, name: null };
        return { error: friendly(err, "Couldn't create the key. Try again."), token: null, name: null };
    }
}

export async function revokeKey(keyId: number): Promise<ActionResult> {
    if (await isSampleMode()) return { ok: true, message: `Revoked ${SAMPLE_NOTE}` };
    try {
        const org = await getCurrentOrg();
        await revokeApiKey(org.org_id, keyId);
        revalidatePath("/team");
        return { ok: true };
    } catch (err) {
        return { ok: false, error: friendly(err, "Couldn't revoke the key. Try again.") };
    }
}
