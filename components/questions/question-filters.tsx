"use client";

// Project and "asked by" are single-choice (the API takes one of each); status is multi-select.
// Active filters show as removable pills; "Clear all" appears at two or more.

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    projects,
    askers,
}: {
    filters: QuestionFilters;
    projects: Option[];
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
    if (filters.project) {
        pills.push({
            key: "project",
            label: `Project: ${projects.find((p) => p.value === filters.project)?.label ?? "Unknown"}`,
            remove: () => apply({ project: null }),
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
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Select value={filters.project ?? ALL} onValueChange={(v) => apply({ project: v === ALL ? null : v })}>
                    <SelectTrigger className={triggerClass} aria-label="Project">
                        <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent className={menuClass} position="popper">
                        <SelectItem value={ALL}>All projects</SelectItem>
                        {projects.map((p) => (
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
                            onClick={() => apply({ project: null, asker: null, status: [] })}
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
