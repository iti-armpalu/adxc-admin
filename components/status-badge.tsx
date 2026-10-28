// Plain-language status for a question. Colour carries meaning, so the label always does too.

import { statusLabel } from "@/lib/adxc/outcome";
import type { Outcome } from "@/lib/adxc/types";
import { cn } from "@/lib/utils";

function tone(outcome: Outcome, paid: boolean) {
    if (paid) return "border-success/30 text-success";
    switch (outcome) {
        case "needs_input":
            return "border-warning/40 text-warning";
        case "quoted":
            return "border-primary/30 text-primary";
        case "error":
            return "border-destructive-border/40 text-destructive-text";
        default:
            return "border-border text-muted-foreground";
    }
}

export function StatusBadge({ outcome, paid, className }: { outcome: Outcome; paid: boolean; className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex h-5 shrink-0 items-center rounded-xs border bg-card px-1.5 text-xs font-medium whitespace-nowrap",
                tone(outcome, paid),
                className,
            )}
        >
            {statusLabel({ outcome, paid })}
        </span>
    );
}
