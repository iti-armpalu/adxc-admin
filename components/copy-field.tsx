"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyField({ value, label = "Copy" }: { value: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard can be blocked (insecure origin, permissions); the value stays selectable.
        }
    }

    return (
        <div className="flex min-w-0 items-stretch border bg-muted">
            <code className="min-w-0 flex-1 truncate px-3 py-2 font-mono text-sm text-foreground select-all">{value}</code>
            <Button type="button" variant="ghost" onClick={copy} className="h-auto shrink-0 rounded-xs border-l px-3">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                <span>{copied ? "Copied" : label}</span>
            </Button>
        </div>
    );
}
