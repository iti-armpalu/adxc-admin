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
