"use client";

// Realm and "asked by" are single-choice (the API takes one of each); status is multi-select.
// Active filters show as removable pills; "Clear all" appears at two or more.

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_OPTIONS, toSearch, type QuestionFilters, type StatusFilter } from "@/lib/adxc/question-filters";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };
const ALL = "__all";

const triggerClass = "h-9 w-full rounded-xs bg-card text-foreground sm:w-56";
const menuClass = "rounded-none bg-card text-card-foreground";

export function QuestionFiltersBar({
    filters,
    realms,
    askers,
}: {
    filters: QuestionFilters;
    realms: Option[];
    askers: Option[];
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    // Any filter change goes back to page 1.
    const apply = (next: Partial<QuestionFilters>) =>
        startTransition(() => router.replace(`/questions${toSearch({ ...filters, ...next, page: 1 })}`, { scroll: false }));

    const toggleStatus = (value: StatusFilter, on: boolean) =>
        apply({ status: on ? [...filters.status, value] : filters.status.filter((s) => s !== value) });

    const pills: { key: string; label: string; remove: () => void }[] = [];
    if (filters.q) pills.push({ key: "q", label: `Search: “${filters.q}”`, remove: () => apply({ q: null }) });
    if (filters.realm) {
        pills.push({
            key: "realm",
            label: `Realm: ${realms.find((p) => p.value === filters.realm)?.label ?? "Unknown"}`,
            remove: () => apply({ realm: null }),
        });
    }
    if (filters.asker) {
        pills.push({
            key: "asker",
            label: `Asked by: ${askers.find((a) => a.value === filters.asker)?.label ?? "Unknown"}`,
            remove: () => apply({ asker: null }),
        });
    }
    for (const s of filters.status) {
        pills.push({
            key: `status-${s}`,
            label: STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s,
            remove: () => toggleStatus(s, false),
        });
    }

    return (
        <div className={cn("space-y-3", pending && "opacity-60 transition-opacity")}>
            {/* Keyed on the URL value so "Clear all" / removing the pill resets the box. */}
            <KeywordSearch key={filters.q ?? ""} initial={filters.q ?? ""} onSearch={(q) => apply({ q: q || null })} />

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Select value={filters.realm ?? ALL} onValueChange={(v) => apply({ realm: v === ALL ? null : v })}>
                    <SelectTrigger className={triggerClass} aria-label="Realm">
                        <SelectValue placeholder="All realms" />
                    </SelectTrigger>
                    <SelectContent className={menuClass} position="popper">
                        <SelectItem value={ALL}>All realms</SelectItem>
                        {realms.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                                {p.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filters.asker ?? ALL} onValueChange={(v) => apply({ asker: v === ALL ? null : v })}>
                    <SelectTrigger className={triggerClass} aria-label="Asked by">
                        <SelectValue placeholder="Anyone" />
                    </SelectTrigger>
                    <SelectContent className={menuClass} position="popper">
                        <SelectItem value={ALL}>Asked by anyone</SelectItem>
                        {askers.map((a) => (
                            <SelectItem key={a.value} value={a.value}>
                                {a.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className={cn(triggerClass, "justify-between font-normal")}>
                            {filters.status.length ? `Status (${filters.status.length})` : "Any status"}
                            <ChevronDown className="size-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className={cn(menuClass, "w-56")}>
                        {STATUS_OPTIONS.map((o) => (
                            <DropdownMenuCheckboxItem
                                key={o.value}
                                checked={filters.status.includes(o.value)}
                                onCheckedChange={(on) => toggleStatus(o.value, on === true)}
                                onSelect={(e) => e.preventDefault()}
                            >
                                {o.label}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {pills.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {pills.map((p) => (
                        <span key={p.key} className="inline-flex h-7 items-center gap-1 border bg-card pr-1 pl-2 text-xs text-foreground">
                            {p.label}
                            <button
                                type="button"
                                onClick={p.remove}
                                className="p-0.5 text-muted-foreground hover:text-foreground"
                                aria-label={`Remove ${p.label}`}
                            >
                                <X className="size-3.5" />
                            </button>
                        </span>
                    ))}
                    {pills.length >= 2 && (
                        <button
                            type="button"
                            onClick={() => apply({ q: null, realm: null, asker: null, status: [] })}
                            className="text-xs text-primary underline-offset-4 hover:underline"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// Searches as you type (after a short pause), so there's no button to press.
function KeywordSearch({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
    const [value, setValue] = useState(initial);
    // Latest callback without restarting the debounce every time the parent re-renders.
    const onSearchRef = useRef(onSearch);
    useEffect(() => {
        onSearchRef.current = onSearch;
    }, [onSearch]);

    useEffect(() => {
        if (value.trim() === initial) return;
        const id = setTimeout(() => onSearchRef.current(value.trim()), 400);
        return () => clearTimeout(id);
    }, [value, initial]);

    return (
        <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="search"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Search questions"
                aria-label="Search questions"
                maxLength={100}
                className="h-9 rounded-xs bg-card pl-9"
            />
        </div>
    );
}
