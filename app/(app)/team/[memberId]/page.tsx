// app/(app)/team/[memberId]/page.tsx — Member detail
//
// For the org admin asking "what has this person done on our account?": who they are,
// what they've asked and bought, and the two things you can change (role, removal).
// Source of truth is the ADXC API, not Stytch.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SessionRefresh } from "@/components/auth/session-refresh";
import { QuestionRow } from "@/components/question-row";
import { Avatar, RoleTag, Tag } from "@/components/team/member-bits";
import { MemberActions } from "@/components/team/member-actions";
import { AdxcApiError, getCurrentOrg, isAuthError, listOrgQueries } from "@/lib/adxc/client";
import { formatDate, formatTokens } from "@/lib/adxc/format";
import { loadTeam } from "@/lib/adxc/team";

// The API has no spend total, so bought/spent are counted over this person's newest
// questions (100 is the API's page maximum). The question count is exact.
const SCAN_LIMIT = 100;
const RECENT_COUNT = 5;

async function load(memberId: number) {
    const team = await loadTeam();
    const member = team.members.find((m) => m.member_id === memberId);
    if (!member) return null;

    const org = await getCurrentOrg();
    // Sample members (dev API key) don't exist in the API, so they have no activity.
    const history = team.mode === "live" ? await listOrgQueries(org.org_id, { member_id: memberId, limit: SCAN_LIMIT }) : null;
    return { member, isMe: member.email === team.myEmail, mode: team.mode, history };
}

export default async function MemberDetailPage({ params }: { params: Promise<{ memberId: string }> }) {
    const { memberId } = await params;
    const id = Number.parseInt(memberId, 10);
    if (!Number.isFinite(id)) notFound();

    let data: Awaited<ReturnType<typeof load>>;
    try {
        data = await load(id);
    } catch (err) {
        return <LoadError error={err} />;
    }
    if (!data) notFound();
    const { member, isMe, mode, history } = data;

    const rows = history?.queries ?? [];
    const bought = rows.filter((q) => q.paid);
    const spent = bought.reduce((sum, q) => sum + (Number(q.price) || 0), 0);
    const partial = history ? history.total > rows.length : false;

    return (
        <div className="animate-[adxc-fade_400ms_ease-out_both] motion-reduce:animate-none mx-auto max-w-5xl space-y-10 px-4 py-8 md:px-8">
            <Link href="/team" className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline">
                <ArrowLeft className="size-4" />
                Team
            </Link>

            <header className="flex items-center gap-4">
                <Avatar email={member.email} size="lg" />
                <div className="min-w-0 space-y-1.5">
                    <h1 className="text-h4 break-all">{member.email}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <RoleTag role={member.role} />
                        {isMe && <Tag tone="neutral">You</Tag>}
                        <span>Joined {formatDate(member.created_at)}</span>
                    </div>
                </div>
            </header>

            {mode === "sample" ? (
                <p className="border border-warning/40 bg-card px-4 py-3 text-sm text-foreground-alt">
                    <span className="font-medium text-warning">Sample data.</span> Activity shows once you&apos;re signed in.
                </p>
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-3" aria-label="Activity summary">
                        <Stat label="Questions asked" value={(history?.total ?? 0).toLocaleString("en-GB")} />
                        <Stat label="Answers bought" value={bought.length.toLocaleString("en-GB")} note={partial ? "Of their latest 100" : undefined} />
                        <Stat label="Credits spent" value={formatTokens(String(spent))} note={partial ? "Of their latest 100" : undefined} />
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-end justify-between gap-4">
                            <h2 className="text-h4">Recent questions</h2>
                            {rows.length > 0 && (
                                <Link
                                    href={`/questions?asker=m:${member.member_id}`}
                                    className="text-sm text-primary underline-offset-4 hover:underline"
                                >
                                    View all
                                </Link>
                            )}
                        </div>
                        {rows.length === 0 ? (
                            <p className="border bg-card px-4 py-6 text-sm text-muted-foreground">No questions asked yet.</p>
                        ) : (
                            <ul className="divide-y border bg-card">
                                {rows.slice(0, RECENT_COUNT).map((q) => (
                                    <QuestionRow key={q.query_id} q={q} />
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            )}

            {!isMe && <MemberActions member={member} />}
        </div>
    );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
    return (
        <div className="space-y-1 border bg-card p-5">
            <p className="text-caption uppercase text-muted-foreground">{label}</p>
            <p className="text-3xl font-medium text-foreground">{value}</p>
            {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
    );
}

function LoadError({ error }: { error: unknown }) {
    if (isAuthError(error)) return <SessionRefresh />;
    const forbidden = error instanceof AdxcApiError && error.status === 403;
    return (
        <div className="animate-[adxc-fade_400ms_ease-out_both] motion-reduce:animate-none mx-auto max-w-2xl space-y-2 px-4 py-8 md:px-8">
            <h1 className="text-h3">Member</h1>
            <p className="text-sm text-muted-foreground">
                {forbidden ? "Only organisation admins can see team members." : "Couldn't load this member. Try again."}
            </p>
        </div>
    );
}
