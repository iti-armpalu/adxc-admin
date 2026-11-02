"use client";

import { useActionState, useEffect, useRef } from "react";
import { createRealmAction, type CreateRealmState } from "@/app/(app)/realms/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL: CreateRealmState = { error: null, created: null };

export function CreateRealmForm() {
    const [state, action, pending] = useActionState(createRealmAction, INITIAL);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.created) formRef.current?.reset();
    }, [state]);

    return (
        <form ref={formRef} action={action} className="space-y-2">
            <Label htmlFor="realm-name">New realm</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                    id="realm-name"
                    name="name"
                    placeholder="e.g. Northwind Foods"
                    autoComplete="off"
                    maxLength={120}
                    required
                    aria-invalid={Boolean(state.error)}
                    aria-describedby="realm-name-help"
                    className="h-9 rounded-xs bg-card sm:max-w-sm"
                />
                <Button type="submit" disabled={pending} className="h-9 rounded-xs">
                    {pending ? "Creating…" : "Create realm"}
                </Button>
            </div>
            <p id="realm-name-help" className="text-xs" role="status">
                {state.error ? (
                    <span className="text-destructive-text">{state.error}</span>
                ) : state.created ? (
                    <span className="text-success">Created &ldquo;{state.created}&rdquo;.</span>
                ) : (
                    <span className="text-muted-foreground">Usually one per client, brand or piece of work.</span>
                )}
            </p>
        </form>
    );
}
