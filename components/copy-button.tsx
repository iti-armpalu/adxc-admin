"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Copies `text`; markdown emphasis (** and `) is stripped so it pastes cleanly into docs and slides. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(text.replace(/\*\*|`/g, ""));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard blocked; the text is still selectable on the page.
        }
    }

    return (
        <Button type="button" variant="outline" size="sm" onClick={copy} className="rounded-xs bg-card">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            <span>{copied ? "Copied" : label}</span>
        </Button>
    );
}
