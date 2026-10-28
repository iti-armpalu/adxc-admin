"use client";

import { useActionState, useEffect, useRef } from "react";
import { createProject, type CreateProjectState } from "@/app/(app)/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL: CreateProjectState = { error: null, created: null };

export function CreateProjectForm() {
    const [state, action, pending] = useActionState(createProject, INITIAL);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.created) formRef.current?.reset();
    }, [state]);

    return (
        <form ref={formRef} action={action} className="space-y-2">
            <Label htmlFor="project-name">New project</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                    id="project-name"
                    name="name"
                    placeholder="e.g. Northwind Foods"
                    autoComplete="off"
                    maxLength={120}
                    required
                    aria-invalid={Boolean(state.error)}
                    aria-describedby="project-name-help"
                    className="h-9 rounded-xs bg-card sm:max-w-sm"
                />
                <Button type="submit" disabled={pending} className="h-9 rounded-xs">
                    {pending ? "Creating…" : "Create project"}
                </Button>
            </div>
            <p id="project-name-help" className="text-xs" role="status">
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
