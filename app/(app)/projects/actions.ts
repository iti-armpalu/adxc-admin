"use server";

import { revalidatePath } from "next/cache";
import { AdxcApiError, createRealm, getCurrentOrg } from "@/lib/adxc/client";

export type CreateProjectState = { error: string | null; created: string | null };

export async function createProject(_prev: CreateProjectState, formData: FormData): Promise<CreateProjectState> {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { error: "Give the project a name.", created: null };
    if (name.length > 120) return { error: "Keep the name under 120 characters.", created: null };

    try {
        const org = await getCurrentOrg();
        const realm = await createRealm(org.org_id, name);
        revalidatePath("/projects");
        revalidatePath("/");
        return { error: null, created: realm.name };
    } catch (err) {
        if (err instanceof AdxcApiError && err.status === 409)
            return { error: `There's already a project called "${name}".`, created: null };
        return { error: "Couldn't create the project. Try again.", created: null };
    }
}
