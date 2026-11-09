"use server";

import { revalidatePath } from "next/cache";
import { AdxcApiError, createRealm, getCurrentOrg } from "@/lib/adxc/client";
import { realmNameError } from "@/lib/adxc/realm-name";

export type CreateRealmState = { error: string | null; created: string | null };

export async function createRealmAction(_prev: CreateRealmState, formData: FormData): Promise<CreateRealmState> {
    const name = String(formData.get("name") ?? "").trim();
    // Checked again here: the form's live check can be bypassed.
    const invalid = realmNameError(name);
    if (invalid) return { error: invalid, created: null };

    try {
        const org = await getCurrentOrg();
        const realm = await createRealm(org.org_id, name);
        revalidatePath("/realms");
        revalidatePath("/");
        return { error: null, created: realm.name };
    } catch (err) {
        if (err instanceof AdxcApiError && err.status === 409)
            return { error: `There's already a realm called "${name}".`, created: null };
        return { error: "Couldn't create the realm. Try again.", created: null };
    }
}
