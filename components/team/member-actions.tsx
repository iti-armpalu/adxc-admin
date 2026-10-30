"use client";

// Manage one member: change role, remove. Removing goes back to the Team page.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeRole, removeMemberAction } from "@/app/(app)/team/actions";
import { Button } from "@/components/ui/button";
import type { OrgMember } from "@/lib/adxc/types";
import { ConfirmDialog } from "./confirm-dialog";

export function MemberActions({ member }: { member: OrgMember }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [removing, setRemoving] = useState(false);
    const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

    const isAdmin = member.role === "org_admin";

    const toggleRole = () =>
        startTransition(async () => {
            const r = await changeRole(member.member_id, isAdmin ? "member" : "org_admin");
            setFeedback(
                r.ok
                    ? { tone: "ok", text: r.message ?? `Now ${isAdmin ? "a member" : "an admin"}.` }
                    : { tone: "error", text: r.error },
            );
        });

    return (
        <section className="space-y-3">
            <h2 className="text-h4">Manage</h2>
            <div className="divide-y border bg-card text-sm">
                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <p className="font-medium text-foreground">{isAdmin ? "Make member" : "Make admin"}</p>
                        <p className="text-muted-foreground">
                            {isAdmin
                                ? "They'll keep seeing questions and answers, but can't manage the team or API keys."
                                : "They'll be able to invite people, change roles and manage API keys."}
                        </p>
                    </div>
                    <Button variant="outline" className="shrink-0 rounded-xs" onClick={toggleRole} disabled={pending}>
                        {pending ? "Saving…" : isAdmin ? "Make member" : "Make admin"}
                    </Button>
                </div>
                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <p className="font-medium text-foreground">Remove from team</p>
                        <p className="text-muted-foreground">
                            They lose access straight away. Their questions and bought answers stay on the account.
                        </p>
                    </div>
                    <Button variant="destructive" className="shrink-0 rounded-xs" onClick={() => setRemoving(true)}>
                        Remove
                    </Button>
                </div>
            </div>
            {feedback && (
                <p role="status" className={feedback.tone === "ok" ? "text-sm text-success" : "text-sm text-destructive-text"}>
                    {feedback.text}
                </p>
            )}

            <ConfirmDialog
                open={removing}
                onOpenChange={setRemoving}
                title="Remove from team?"
                description={
                    <>
                        <span className="font-medium text-foreground">{member.email}</span> will lose access straight away.
                    </>
                }
                confirmLabel="Remove"
                onConfirm={() => removeMemberAction(member.member_id)}
                onDone={() => router.push("/team")}
            />
        </section>
    );
}
