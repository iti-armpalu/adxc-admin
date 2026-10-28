"use client";

// Re-fetches the page's server data on an interval while a query is still running.
// Mounted only for running queries, so a finished page never polls.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
    const router = useRouter();
    useEffect(() => {
        const id = setInterval(() => router.refresh(), seconds * 1000);
        return () => clearInterval(id);
    }, [router, seconds]);
    return null;
}
