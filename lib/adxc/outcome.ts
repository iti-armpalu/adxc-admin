// lib/adxc/outcome.ts
//
// Client-facing words for the query state machine. The API's `outcome` codes stay
// in code; these labels are what people read.

import type { Outcome } from "./types";

export const OUTCOME_LABEL: Record<Outcome, string> = {
    pending: "In progress",
    needs_input: "Waiting for input",
    quoted: "Ready to buy",
    no_data: "No data found",
    abandoned: "Cancelled",
    error: "Failed",
};

/** Still running — the outcome can change on the next poll. */
export const isRunning = (o: Outcome) => o === "pending" || o === "needs_input";

/** A row's status as people read it: a bought quote is "Bought", not "Ready to buy". */
export function statusLabel(row: { outcome: Outcome; paid: boolean }) {
    if (row.paid) return "Bought";
    return OUTCOME_LABEL[row.outcome] ?? row.outcome;
}
