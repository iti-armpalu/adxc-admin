// lib/adxc/format.ts

/** "148.50" → "148.5" with grouping; the API sends decimals as strings. */
export function formatTokens(value: string | null | undefined) {
    if (value === null || value === undefined) return "—";
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString("en-GB", { maximumFractionDigits: 2 }) : value;
}

const rtf = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
];

/** "3 hours ago", "yesterday". */
export function formatRelative(iso: string, now = Date.now()) {
    const seconds = (new Date(iso).getTime() - now) / 1000;
    for (const [unit, size] of STEPS) {
        if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
    }
    return "just now";
}

/** "2026-07-31" or an ISO timestamp → "31 Jul 2026". Returns the input if it isn't a date. */
export function formatDate(value: string) {
    const d = new Date(value);
    return Number.isNaN(d.getTime())
        ? value
        : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** ISO timestamp → "31 Jul 2026, 09:14". */
export function formatDateTime(value: string) {
    const d = new Date(value);
    return Number.isNaN(d.getTime())
        ? value
        : d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
