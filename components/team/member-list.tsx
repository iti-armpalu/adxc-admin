"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { changeRole, removeMemberAction, type ActionResult } from "@/app/(app)/team/actions";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/adxc/format";
import type { OrgMember } from "@/lib/adxc/types";
import { ConfirmDialog } from "./confirm-dialog";
import { Avatar, RoleTag, Tag, roleLabel } from "./member-bits";


function Identity({ m, isMe }: { m: OrgMember; isMe: boolean }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <Avatar email={m.email} />
            <Link href={`/team/${m.member_id}`} className="min-w-0 break-all text-foreground hover:text-primary hover:underline underline-offset-4">
                {m.email}
            </Link>
            {isMe && <Tag tone="neutral">You</Tag>}
        </div>
    );
}

export function MemberList({ members, myEmail }: { members: OrgMember[]; myEmail: string | null }) {
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
    const [removing, setRemoving] = useState<OrgMember | null>(null);

    const report = (result: ActionResult, success: string) =>
        setFeedback(result.ok ? { tone: "ok", text: result.message ?? success } : { tone: "error", text: result.error });

    const toggleRole = (m: OrgMember) => {
        const next = m.role === "org_admin" ? "member" : "org_admin";
        startTransition(async () => report(await changeRole(m.member_id, next), `${m.email} is now ${roleLabel(next).toLowerCase()}.`));
    };

    const actions = (m: OrgMember) =>
        m.email === myEmail ? null : (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="rounded-xs" aria-label={`Actions for ${m.email}`} disabled={pending}>
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-none bg-card text-card-foreground">
                    <DropdownMenuItem onSelect={() => toggleRole(m)}>
                        {m.role === "org_admin" ? "Make member" : "Make admin"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(m)}>
                        Remove from team
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );

    return (
        <div className="space-y-2">
            {feedback && (
                <p role="status" className={feedback.tone === "ok" ? "text-sm text-success" : "text-sm text-destructive-text"}>
                    {feedback.text}
                </p>
            )}

            {/* Mobile: cards */}
            <ul className="divide-y border bg-card md:hidden">
                {members.map((m) => (
                    <li key={m.member_id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <div className="min-w-0 space-y-1.5">
                            <Identity m={m} isMe={m.email === myEmail} />
                            <div className="flex items-center gap-2 pl-11 text-xs text-muted-foreground">
                                <RoleTag role={m.role} />
                                <span>Joined {formatDate(m.created_at)}</span>
                            </div>
                        </div>
                        {actions(m)}
                    </li>
                ))}
            </ul>

            {/* md+: table */}
            <div className="hidden border bg-card md:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-muted-foreground">
                            <th className="w-full px-4 py-2.5 font-medium">Member</th>
                            <th className="px-4 py-2.5 font-medium">Role</th>
                            <th className="px-4 py-2.5 font-medium">Joined</th>
                            <th className="w-16 px-4 py-2.5" aria-label="Actions" />
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {members.map((m) => (
                            <tr key={m.member_id}>
                                <td className="px-4 py-3">
                                    <Identity m={m} isMe={m.email === myEmail} />
                                </td>
                                <td className="px-4 py-3">
                                    <RoleTag role={m.role} />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(m.created_at)}</td>
                                <td className="px-4 py-2 text-right">{actions(m)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                open={removing !== null}
                onOpenChange={(o) => !o && setRemoving(null)}
                title="Remove from team?"
                description={
                    <>
                        <span className="font-medium text-foreground">{removing?.email}</span> will lose access straight away.
                        Questions they asked and answers they bought stay on the account.
                    </>
                }
                confirmLabel="Remove"
                onConfirm={() => removeMemberAction(removing!.member_id)}
                onDone={(r) => report(r, `${removing?.email ?? "They"} was removed.`)}
            />
        </div>
    );
}
