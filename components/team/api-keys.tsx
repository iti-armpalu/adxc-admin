"use client";

// Service-account keys: what tools and integrations use to call ADXC.
// The raw token is shown exactly once, at creation — the API stores only a hash.

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { createKey, revokeKey, type ActionResult, type CreateKeyState } from "@/app/(app)/team/actions";
import { CopyField } from "@/components/copy-field";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/adxc/format";
import type { ApiKeyRecord } from "@/lib/adxc/types";
import { ConfirmDialog } from "./confirm-dialog";
import { dialogContentClass, dialogFooterClass } from "./dialog-styles";

const INITIAL: CreateKeyState = { error: null, token: null, name: null };

/** Null `created_by` means the key predates 14 Oct 2026 — not recorded, not "nobody". */
const issuer = (k: ApiKeyRecord) => (k.created_by === "vetinari" ? "ADXC" : (k.created_by ?? "Not recorded"));

export function ApiKeys({ keys }: { keys: ApiKeyRecord[] }) {
    const [state, action, pending] = useActionState(createKey, INITIAL);
    // The token from the latest create, until the admin confirms they've saved it.
    const [dismissedToken, setDismissedToken] = useState<string | null>(null);
    const revealed = state.token && state.token !== dismissedToken ? { token: state.token, name: state.name ?? "" } : null;
    const [revoking, setRevoking] = useState<ApiKeyRecord | null>(null);
    const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.token) formRef.current?.reset();
    }, [state]);

    const report = (r: ActionResult, success: string) =>
        setFeedback(r.ok ? { tone: "ok", text: r.message ?? success } : { tone: "error", text: r.error });

    return (
        <div className="space-y-4">
            <form ref={formRef} action={action} className="space-y-2 border bg-card p-5">
                <Label htmlFor="key-name">New API key</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                        id="key-name"
                        name="name"
                        placeholder="e.g. miro-sidekick"
                        autoComplete="off"
                        maxLength={128}
                        required
                        aria-invalid={Boolean(state.error)}
                        aria-describedby="key-help"
                        className="h-9 rounded-xs bg-card sm:max-w-sm"
                    />
                    <Button type="submit" disabled={pending} className="h-9 rounded-xs">
                        {pending ? "Creating…" : "Create key"}
                    </Button>
                </div>
                <p id="key-help" className="text-xs">
                    {state.error ? (
                        <span className="text-destructive-text">{state.error}</span>
                    ) : (
                        <span className="text-muted-foreground">Name it after the tool that will use it, so you know what to revoke later.</span>
                    )}
                </p>
            </form>

            {feedback && (
                <p role="status" className={feedback.tone === "ok" ? "text-sm text-success" : "text-sm text-destructive-text"}>
                    {feedback.text}
                </p>
            )}

            {keys.length === 0 ? (
                <p className="border bg-card px-4 py-6 text-sm text-muted-foreground">No API keys yet.</p>
            ) : (
                <ul className="divide-y border bg-card">
                    {keys.map((k) => (
                        <li key={k.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 space-y-0.5">
                                <p className="text-sm text-foreground">
                                    <span className="font-medium">{k.name}</span>
                                    <span className="ml-2 font-mono text-xs text-muted-foreground">{k.key_prefix}…</span>
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    Created {formatDate(k.created_at)} by {issuer(k)}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-4 text-sm">
                                <Link
                                    href={`/questions?asker=k:${k.id}`}
                                    className="text-primary underline-offset-4 hover:underline"
                                >
                                    View questions
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xs text-destructive-text"
                                    onClick={() => setRevoking(k)}
                                >
                                    Revoke
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Shown once, straight after creation. Can't be dismissed by clicking outside. */}
            <Dialog open={revealed !== null} onOpenChange={() => undefined}>
                <DialogContent
                    className={dialogContentClass}
                    showCloseButton={false}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    onPointerDownOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>Save your API key</DialogTitle>
                        <DialogDescription>
                            Copy <span className="font-medium text-foreground">{revealed?.name}</span> now and keep it somewhere
                            safe. You won&apos;t be able to see it again — if it&apos;s lost, revoke it and create a new one.
                        </DialogDescription>
                    </DialogHeader>
                    {revealed && <CopyField value={revealed.token} />}
                    <DialogFooter className={dialogFooterClass}>
                        <Button className="rounded-xs" onClick={() => setDismissedToken(state.token)}>
                            I&apos;ve saved it
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={revoking !== null}
                onOpenChange={(o) => !o && setRevoking(null)}
                title="Revoke this key?"
                description={
                    <>
                        Anything using <span className="font-medium text-foreground">{revoking?.name}</span> stops working
                        immediately. Answers it already bought stay on the account.
                    </>
                }
                confirmLabel="Revoke key"
                onConfirm={() => revokeKey(revoking!.id)}
                onDone={(r) => report(r, `${revoking?.name ?? "Key"} was revoked.`)}
            />
        </div>
    );
}
