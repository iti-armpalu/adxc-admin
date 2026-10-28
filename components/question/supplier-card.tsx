// Data suppliers on a question. Suppliers that contributed get a card (coverage, freshness,
// assumptions, sources); the ones that had nothing are listed compactly underneath.

import { formatDate } from "@/lib/adxc/format";
import type { CoverageStatus, SupplierBlock } from "@/lib/adxc/types";
import { cn } from "@/lib/utils";

const COVERAGE: Record<CoverageStatus, { label: string; className: string }> = {
    full: { label: "Full coverage", className: "border-success/30 text-success" },
    partial: { label: "Partial coverage", className: "border-warning/40 text-warning" },
    none: { label: "No coverage", className: "border-border text-muted-foreground" },
};

const DOT: Record<CoverageStatus, string> = { full: "bg-success", partial: "bg-warning", none: "bg-border-4" };

function Label({ children }: { children: React.ReactNode }) {
    return <p className="text-caption uppercase text-muted-foreground">{children}</p>;
}

function SupplierCard({ s }: { s: SupplierBlock }) {
    const coverage = s.coverage_status ? COVERAGE[s.coverage_status] : null;
    return (
        <li className="space-y-4 border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <p className="font-semibold text-foreground">{s.display_name}</p>
                    {s.as_of && <p className="text-xs text-muted-foreground">Data as of {formatDate(s.as_of)}</p>}
                </div>
                {coverage && (
                    <span className={cn("inline-flex h-5 items-center rounded-xs border px-1.5 text-xs font-medium", coverage.className)}>
                        {coverage.label}
                    </span>
                )}
            </div>

            {s.coverage && s.coverage.length > 0 && (
                <ul className="space-y-1 text-sm text-foreground-alt">
                    {s.coverage.map((row, i) => (
                        <li key={i} className="flex gap-2">
                            <span className={cn("mt-1.5 size-1.5 shrink-0", DOT[row.status] ?? "bg-border-4")} aria-hidden />
                            <span>{row.render}</span>
                        </li>
                    ))}
                </ul>
            )}

            {s.clarifications && s.clarifications.length > 0 && (
                <div className="space-y-1">
                    <Label>Assumptions</Label>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground-alt">
                        {s.clarifications.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                </div>
            )}

            {s.provenance && s.provenance.length > 0 && (
                <div className="space-y-1">
                    <Label>Sources</Label>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground-alt">
                        {s.provenance.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                </div>
            )}

            {s.query_plan && s.query_plan.length > 0 && (
                <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        How {s.display_name} read the question
                    </summary>
                    <ul className="mt-2 space-y-1 text-foreground-alt">
                        {s.query_plan.map((row, i) => <li key={i}>{row.render}</li>)}
                    </ul>
                </details>
            )}
        </li>
    );
}

/** The supplier's reason, without repeating what its coverage line already says. */
function noDataReason(s: SupplierBlock) {
    const reason = s.no_data_reason ?? s.coverage?.[0]?.render ?? null;
    return reason;
}

export function SupplierList({ suppliers }: { suppliers: SupplierBlock[] }) {
    const answered = suppliers.filter((s) => s.status === "answered");
    const empty = suppliers.filter((s) => s.status !== "answered");

    return (
        <div className="space-y-4">
            {answered.length > 0 && (
                <ul className="space-y-4">
                    {answered.map((s) => <SupplierCard key={s.supplier_id} s={s} />)}
                </ul>
            )}
            {empty.length > 0 && (
                <div className="space-y-2 border bg-card p-5">
                    <Label>{answered.length ? "Also asked, nothing found" : "Asked, nothing found"}</Label>
                    <ul className="space-y-2 text-sm">
                        {empty.map((s) => (
                            <li key={s.supplier_id}>
                                <span className="font-medium text-foreground">{s.display_name}</span>
                                {noDataReason(s) && <span className="text-foreground-alt"> — {noDataReason(s)}</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
