// What one data supplier contributed: whether it answered, how much of the question it
// could cover, how fresh its data is, what it assumed, and (once bought) its sourcing.

import { formatDate } from "@/lib/adxc/format";
import type { CoverageStatus, SupplierBlock } from "@/lib/adxc/types";
import { cn } from "@/lib/utils";

const COVERAGE: Record<CoverageStatus, { label: string; className: string }> = {
    full: { label: "Full coverage", className: "border-success/30 text-success" },
    partial: { label: "Partial coverage", className: "border-warning/40 text-warning" },
    none: { label: "No coverage", className: "border-border text-muted-foreground" },
};

export function SupplierCard({ s }: { s: SupplierBlock }) {
    const coverage = s.coverage_status ? COVERAGE[s.coverage_status] : null;

    return (
        <li className="space-y-4 border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h3>{s.display_name}</h3>
                    <p className="text-xs text-muted-foreground">
                        {s.status === "answered" ? "Contributed to the answer" : "Had nothing for this question"}
                        {s.as_of && ` · Data as of ${formatDate(s.as_of)}`}
                    </p>
                </div>
                {coverage && (
                    <span className={cn("inline-flex h-5 items-center rounded-xs border px-1.5 text-xs font-medium", coverage.className)}>
                        {coverage.label}
                    </span>
                )}
            </div>

            {s.no_data_reason && <p className="text-sm text-foreground-alt">{s.no_data_reason}</p>}

            {s.coverage && s.coverage.length > 0 && (
                <ul className="space-y-1 text-sm text-foreground-alt">
                    {s.coverage.map((row, i) => (
                        <li key={i} className="flex gap-2">
                            <span
                                className={cn(
                                    "mt-1.5 size-1.5 shrink-0",
                                    row.status === "full" ? "bg-success" : row.status === "partial" ? "bg-warning" : "bg-border",
                                )}
                                aria-hidden
                            />
                            <span>{row.render}</span>
                        </li>
                    ))}
                </ul>
            )}

            {s.clarifications && s.clarifications.length > 0 && (
                <div className="space-y-1">
                    <p className="text-caption uppercase text-muted-foreground">Assumptions</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground-alt">
                        {s.clarifications.map((c, i) => (
                            <li key={i}>{c}</li>
                        ))}
                    </ul>
                </div>
            )}

            {s.provenance && s.provenance.length > 0 && (
                <div className="space-y-1">
                    <p className="text-caption uppercase text-muted-foreground">Sources</p>
                    <ul className="space-y-1 text-sm text-foreground-alt">
                        {s.provenance.map((p, i) => (
                            <li key={i}>{p}</li>
                        ))}
                    </ul>
                </div>
            )}

            {s.query_plan && s.query_plan.length > 0 && (
                <details className="group text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        How this supplier read the question
                    </summary>
                    <ul className="mt-2 space-y-1 text-foreground-alt">
                        {s.query_plan.map((row, i) => (
                            <li key={i}>{row.render}</li>
                        ))}
                    </ul>
                </details>
            )}
        </li>
    );
}
