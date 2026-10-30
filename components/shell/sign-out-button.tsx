"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useStytchB2BClient } from "@stytch/nextjs/b2b";

export function SignOutButton() {
    const stytch = useStytchB2BClient();
    const router = useRouter();
    const [pending, setPending] = useState(false);

    async function signOut() {
        setPending(true);
        try {
            await stytch.session.revoke();
        } finally {
            router.replace("/login");
        }
    }

    return (
        <button
            type="button"
            onClick={signOut}
            disabled={pending}
            className="inline-flex items-center gap-1.5 text-xs text-sidebar-muted hover:text-foreground disabled:opacity-60"
        >
            <LogOut className="size-3.5" />
            {pending ? "Signing out…" : "Sign out"}
        </button>
    );
}
