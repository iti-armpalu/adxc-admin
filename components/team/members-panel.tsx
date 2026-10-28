"use client";

// Members section: "Invite member" in the header, then two tabs —
// current members, and invited people still waiting for ADXC to admit them.

import { useState } from "react";
import type { OrgMember } from "@/lib/adxc/types";
import { cn } from "@/lib/utils";
import { InviteDialog } from "./invite-dialog";
import { MemberList } from "./member-list";

type Tab = "current" | "waiting";

export function MembersPanel({
    members,
    notAdmitted,
    myEmail,
}: {
    members: OrgMember[];
    notAdmitted: string[];
    myEmail: string | null;
}) {
    const [tab, setTab] = useState<Tab>("current");
    const [notice, setNotice] = useState<string | null>(null);

    const tabs: { id: Tab; label: string; count: number }[] = [
        { id: "current", label: "Members", count: members.length },
        { id: "waiting", label: "Waiting for access", count: notAdmitted.length },
    ];

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-0.5">
                    <h2 className="text-h4">Members</h2>
                    <p className="text-sm text-muted-foreground">People who can sign in and see questions on this account.</p>
                </div>
                <InviteDialog
                    onInvited={(m) => {
                        setNotice(m);
                        setTab("current");
                    }}
                />
            </div>

            {notice && (
                <p role="status" className="text-sm text-success">
                    {notice}
                </p>
            )}

            <div role="tablist" aria-label="Members" className="flex gap-6 border-b">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        role="tab"
                        type="button"
                        id={`tab-${t.id}`}
                        aria-selected={tab === t.id}
                        aria-controls={`panel-${t.id}`}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            "-mb-px flex items-center gap-2 border-b-2 pb-2.5 text-sm transition-colors",
                            tab === t.id
                                ? "border-primary font-medium text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {t.label}
                        <span className="text-xs text-muted-foreground tabular-nums">{t.count}</span>
                    </button>
                ))}
            </div>

            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
                {tab === "current" ? (
                    <MemberList members={members} myEmail={myEmail} />
                ) : notAdmitted.length === 0 ? (
                    <p className="border bg-card px-4 py-6 text-sm text-muted-foreground">Nobody is waiting for access.</p>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            ADXC is in closed beta, so new addresses also need to be admitted by ADXC before they can sign in. Ask
                            your ADXC contact to admit them.
                        </p>
                        <ul className="divide-y border bg-card text-sm">
                            {notAdmitted.map((email) => (
                                <li key={email} className="flex items-center justify-between gap-3 px-4 py-3">
                                    <span className="min-w-0 break-all text-foreground">{email}</span>
                                    <span className="shrink-0 text-xs text-warning">Waiting for ADXC</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
}
