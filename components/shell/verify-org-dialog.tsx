"use client";

// Some organisations only accept certain sign-in methods. A session signed in with one
// org's SSO can't be swapped straight into such an org (Stytch:
// operation_restricted_by_organization_auth_methods). Like Rob's panel, we then verify
// with an email code for that org: discovery code → intermediate session → exchange into it.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useStytchB2BClient } from "@stytch/nextjs/b2b";
import { dialogContentClass, dialogFooterClass } from "@/components/team/dialog-styles";
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
import { SESSION_MINUTES } from "@/lib/auth/config";

export type OrgTarget = { id: string; name: string };

export function VerifyOrgDialog({
    target,
    email,
    onClose,
}: {
    target: OrgTarget | null;
    email: string;
    onClose: () => void;
}) {
    const stytch = useStytchB2BClient();
    const router = useRouter();
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function close() {
        setCode("");
        setError(null);
        setNotice(null);
        onClose();
    }

    function verify() {
        if (!target) return;
        setError(null);
        startTransition(async () => {
            try {
                await stytch.otps.email.discovery.authenticate({ code: code.trim(), email_address: email });
            } catch {
                setError("That code didn't work. Check it, or send a new one.");
                return;
            }
            try {
                const res = await stytch.discovery.intermediateSessions.exchange({
                    organization_id: target.id,
                    session_duration_minutes: SESSION_MINUTES,
                });
                if (!res.member_authenticated) {
                    // The org also wants MFA, which the panel doesn't support yet.
                    router.replace("/login");
                    return;
                }
                close();
                router.push("/");
                router.refresh();
            } catch {
                // Code was fine, but this org won't accept an email-code sign-in either.
                setError(`${target.name} doesn't allow signing in with an email code. Ask its admin which sign-in method to use.`);
            }
        });
    }

    function resend() {
        setError(null);
        startTransition(async () => {
            try {
                await stytch.otps.email.discovery.send({ email_address: email });
                setNotice("New code sent.");
            } catch {
                setError("Couldn't send a new code. Try again.");
            }
        });
    }

    return (
        <Dialog open={target !== null} onOpenChange={(o) => !o && !pending && close()}>
            <DialogContent className={dialogContentClass}>
                <form
                    className="grid gap-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        verify();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Verify to switch to {target?.name}</DialogTitle>
                        <DialogDescription>
                            {target?.name} needs a fresh sign-in. We&apos;ve sent a code to{" "}
                            <span className="font-medium text-foreground">{email}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="org-code">Code</Label>
                        <Input
                            id="org-code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="123456"
                            aria-invalid={Boolean(error)}
                            className="h-9 rounded-xs bg-card font-mono tracking-widest"
                            autoFocus
                        />
                        {error ? (
                            <p className="text-xs text-destructive-text">{error}</p>
                        ) : notice ? (
                            <p className="text-xs text-success">{notice}</p>
                        ) : (
                            <button
                                type="button"
                                onClick={resend}
                                disabled={pending}
                                className="text-xs text-primary underline-offset-4 hover:underline"
                            >
                                Send a new code
                            </button>
                        )}
                    </div>

                    <DialogFooter className={dialogFooterClass}>
                        <Button type="button" variant="outline" className="rounded-xs" onClick={close} disabled={pending}>
                            Cancel
                        </Button>
                        <Button type="submit" className="rounded-xs" disabled={pending || code.length < 6}>
                            {pending ? "Verifying…" : "Verify and switch"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
