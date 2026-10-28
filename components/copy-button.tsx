"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Icon-only copy button. Markdown emphasis (** and `) is stripped so the text pastes
 * cleanly into docs and slides. Style its visibility from the parent (e.g. show on hover).
 */
export function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
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
        <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={copy}
            aria-label={copied ? "Copied" : label}
            title={copied ? "Copied" : label}
            className={cn("rounded-xs text-muted-foreground hover:text-foreground", className)}
        >
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
        </Button>
    );
}
