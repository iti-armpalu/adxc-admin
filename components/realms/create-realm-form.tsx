"use client";

// New realm. The name becomes part of the realm's connector address, so typing is nudged
// into shape (lowercase, spaces → hyphens) and anything else is flagged before submitting.

import { useActionState, useState } from "react";
import { createRealmAction, type CreateRealmState } from "@/app/(app)/realms/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REALM_NAME_HINT, REALM_NAME_MAX, normalizeRealmName, realmNameError } from "@/lib/adxc/realm-name";

const INITIAL: CreateRealmState = { error: null, created: null };

export function CreateRealmForm() {
    const [name, setName] = useState("");
    const [state, action, pending] = useActionState(async (prev: CreateRealmState, formData: FormData) => {
        const result = await createRealmAction(prev, formData);
        if (result.created) setName("");
        return result;
    }, INITIAL);

    // Live check only once something's typed; the server's answer wins after submitting.
    const liveError = name ? realmNameError(name) : null;
    const error = liveError ?? (name ? null : state.error);

    return (
        <form action={action} className="space-y-2">
            <Label htmlFor="realm-name">New realm</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                    id="realm-name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(normalizeRealmName(e.target.value))}
                    placeholder="e.g. northwind-foods"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={REALM_NAME_MAX}
                    required
                    aria-invalid={Boolean(error)}
                    aria-describedby="realm-name-help"
                    className="h-9 rounded-xs bg-card font-mono sm:max-w-sm"
                />
                <Button type="submit" disabled={pending || !name || Boolean(liveError)} className="h-9 rounded-xs">
                    {pending ? "Creating…" : "Create realm"}
                </Button>
            </div>
            <p id="realm-name-help" className="text-xs" role="status">
                {error ? (
                    <span className="text-destructive-text">{error}</span>
                ) : state.created && !name ? (
                    <span className="text-success">Created &ldquo;{state.created}&rdquo;.</span>
                ) : (
                    <span className="text-muted-foreground">{REALM_NAME_HINT}</span>
                )}
            </p>
        </form>
    );
}
