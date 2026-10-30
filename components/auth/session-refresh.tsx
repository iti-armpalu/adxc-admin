"use client";

// Shown when the server's request was refused with 401 — usually because the 5-minute
// pass in the cookie went stale while the tab was closed. Ask Stytch for a fresh one,
// then re-render the page. If Stytch has no session, go to sign-in. If we just did this
// and the API still refuses, stop and say so instead of looping.

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStytchB2BClient } from "@stytch/nextjs/b2b";
import { Button } from "@/components/ui/button";

const LAST_REFRESH = "adxc:last-session-refresh";
const LOOP_WINDOW_MS = 15_000;

function readLast() {
    try {
        return Number(sessionStorage.getItem(LAST_REFRESH) ?? 0);
    } catch {
        return 0;
    }
}
function writeLast() {
    try {
        sessionStorage.setItem(LAST_REFRESH, String(Date.now()));
    } catch {
        // Storage blocked: the loop guard is best-effort.
    }
}

export function SessionRefresh() {
    const stytch = useStytchB2BClient();
    const router = useRouter();
    const pathname = usePathname();
    const [stuck, setStuck] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const toLogin = () => router.replace(`/login?next=${encodeURIComponent(pathname)}`);

        if (Date.now() - readLast() < LOOP_WINDOW_MS) {
            // We refreshed moments ago and the API still said no — don't loop.
            queueMicrotask(() => !cancelled && setStuck(true));
            return () => {
                cancelled = true;
            };
        }

        stytch.session
            .authenticate()
            .then(() => {
                if (cancelled) return;
                writeLast();
                router.refresh();
            })
            .catch(() => !cancelled && toLogin());

        return () => {
            cancelled = true;
        };
    }, [stytch, router, pathname]);

    async function signOut() {
        try {
            await stytch.session.revoke();
        } finally {
            router.replace("/login");
        }
    }

    return (
        <div className="mx-auto max-w-md space-y-3 px-4 py-16 text-center">
            {stuck ? (
                <>
                    <h1 className="text-h4">Couldn&apos;t confirm your session</h1>
                    <p className="text-sm text-muted-foreground">
                        You&apos;re signed in, but the ADXC API didn&apos;t accept the session. Sign out and in again; if it
                        keeps happening, contact ADXC.
                    </p>
                    <Button className="rounded-xs" onClick={signOut}>
                        Sign out
                    </Button>
                </>
            ) : (
                <p className="text-sm text-muted-foreground" role="status">
                    Reconnecting…
                </p>
            )}
        </div>
    );
}
